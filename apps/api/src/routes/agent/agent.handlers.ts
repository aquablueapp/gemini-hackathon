import type { ChatRoute, GetSessionEventsRoute } from './agent.routes'
import type { AppRouteHandler } from '@/lib/types'
import { streamSSE } from 'hono/streaming'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { getFirestore } from '@/db/firestore'
import { decrypt } from '@/services/credentials'

export const chatHandler: AppRouteHandler<ChatRoute> = async (c) => {
  const { message, sessionId, model, file } = c.req.valid('json')

  const firestore = getFirestore()
  try {
    await firestore.collection('session_events').add({
      sessionId,
      role: 'user',
      author: 'user',
      content: message,
      createdAt: new Date(),
    })
  }
  catch (err) {
    console.error('Failed to save user message to firestore:', err)
  }

  // Load and decrypt all user credentials to pass to the agent
  const userCredentials: Record<string, string> = {}
  try {
    const credsSnap = await firestore.collection('user_credentials').where('userId', '==', 'default_user').get()
    for (const doc of credsSnap.docs) {
      const cred = doc.data() as any
      try {
        const decrypted = decrypt(cred.encryptedValue, cred.iv, cred.tag)
        userCredentials[cred.service] = decrypted
      }
      catch (decErr) {
        console.error(`Failed to decrypt credential for ${cred.service}:`, decErr)
      }
    }
  }
  catch (err) {
    console.error('Failed to retrieve user credentials for agent payload:', err)
  }



  const stateDelta: Record<string, any> = {
    user_credentials: userCredentials,
  }
  if (model) {
    stateDelta.selected_model = model
  }

  const agentApiUrl = process.env.AGENT_API_URL || 'http://127.0.0.1:7668'
  const parts: any[] = [{ text: message }]
  if (file && file.base64 && file.mimeType) {
    const cleanMimeType = file.mimeType.split(';')[0]
    parts.push({
      inline_data: {
        mime_type: cleanMimeType,
        data: file.base64,
      }
    })
  }

  const payload = {
    app_name: 'app',
    user_id: 'default_user',
    session_id: sessionId,
    new_message: {
      role: 'user',
      parts,
    },
    streaming: true,
    state_delta: stateDelta,
  }

  // Ensure the session is pre-created on the ADK agent sidecar to prevent 404 Session Not Found
  try {
    await fetch(`${agentApiUrl}/apps/app/users/default_user/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session_id: sessionId }),
    })
  }
  catch (err) {
    console.warn('⚠️ Warning: Failed to pre-create session on agent sidecar:', err)
  }

  let agentResponse: Response
  try {
    agentResponse = await fetch(`${agentApiUrl}/run_sse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
  }
  catch (err) {
    console.error('❌ Failed to connect to Python agent sidecar:', err)
    return c.json(
      { message: 'Python agent service is not running or unreachable' },
      HttpStatusCodes.INTERNAL_SERVER_ERROR,
    )
  }

  if (!agentResponse.ok) {
    const errorText = await agentResponse.text()
    return c.json(
      { message: `Agent service error: ${errorText}` },
      agentResponse.status as any,
    )
  }

  // Return SSE stream response
  c.header('Content-Type', 'text/event-stream')
  c.header('Cache-Control', 'no-cache')
  c.header('Connection', 'keep-alive')

  return streamSSE(c, async (stream) => {
    const reader = agentResponse.body?.getReader()
    if (!reader) {
      await stream.writeSSE({
        data: JSON.stringify({ error: 'No response stream from agent' }),
        event: 'error',
      })
      return
    }

    let isAborted = false
    stream.onAbort(() => {
      isAborted = true
      reader.cancel()
    })

    const decoder = new TextDecoder()
    let fullModelText = ''
    let buffer = ''
    try {
      while (!isAborted) {
        const { done, value } = await reader.read()
        if (done)
          break
        const chunk = decoder.decode(value, { stream: true })
        // chunk is already SSE formatted text ("data: ...\n\n"), we pipe it directly
        await stream.write(chunk)

        buffer += chunk
        let lineEndIndex: number
        while ((lineEndIndex = buffer.indexOf('\n')) !== -1) {
          const line = buffer.substring(0, lineEndIndex).trim()
          buffer = buffer.substring(lineEndIndex + 1)

          if (line.startsWith('data: ')) {
            const jsonStr = line.substring(6).trim()
            if (!jsonStr)
              continue
            try {
              const event = JSON.parse(jsonStr)
              if (event.content && event.content.parts) {
                const textPart = event.content.parts.map((p: any) => p.text || '').join('')
                if (event.partial === false) {
                  fullModelText = textPart
                }
                else {
                  fullModelText += textPart
                }
              }
            }
            catch (e) {
              // Ignore incomplete line parse failures
            }
          }
        }
      }

      // Save model reply to database when stream finishes successfully
      if (!isAborted && fullModelText) {
        await firestore.collection('session_events').add({
          sessionId,
          role: 'model',
          author: 'model',
          content: fullModelText,
          createdAt: new Date(),
        })
      }
    }
    catch (err) {
      console.error('Error in agent stream piping:', err)
    }
    finally {
      reader.releaseLock()
    }
  })
}

export const getSessionEventsHandler: AppRouteHandler<GetSessionEventsRoute> = async (c) => {
  const { sessionId } = c.req.valid('param')
  const firestore = getFirestore()

  try {
    const querySnap = await firestore
      .collection('session_events')
      .where('sessionId', '==', sessionId)
      .get()

    const events = querySnap.docs.map((doc) => {
      const data = doc.data()
      return {
        id: doc.id,
        sessionId: data.sessionId,
        role: data.role,
        author: data.author,
        content: data.content,
        createdAt: data.createdAt,
      }
    })

    // Sort events by createdAt
    events.sort((a, b) => {
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt).getTime()
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt).getTime()
      return timeA - timeB
    })

    return c.json(events as any, HttpStatusCodes.OK)
  }
  catch (err: any) {
    console.error('Failed to get session events:', err)
    return c.json([], HttpStatusCodes.OK)
  }
}
