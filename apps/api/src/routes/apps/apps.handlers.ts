import type { CreateRoute, ListRoute, RemoveRoute, RunRoute } from './apps.routes'
import type { FirestoreApplet, FirestoreAppletRun, FirestoreUserCredential } from '@/db/schema/firestore'
import type { AppRouteHandler } from '@/lib/types'
import { streamSSE } from 'hono/streaming'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { firestore } from '@/db/firestore'
import { decrypt } from '@/services/credentials'
import { runSandboxScript } from '@/services/sandbox-runner'
import { downloadScript, uploadScript } from '@/services/storage'

function toIsoString(val: any): string {
  if (!val)
    return new Date().toISOString()
  if (val instanceof Date) {
    return val.toISOString()
  }
  if (typeof val.toDate === 'function') {
    return val.toDate().toISOString()
  }
  return new Date(val).toISOString()
}

export const listApplets: AppRouteHandler<ListRoute> = async (c) => {
  const querySnap = await firestore.collection('applets').where('userId', '==', 'default_user').get()
  const applets = querySnap.docs.map((doc) => {
    const data = doc.data() as FirestoreApplet
    return {
      ...data,
      createdAt: toIsoString(data.createdAt),
      updatedAt: toIsoString(data.updatedAt),
    }
  })
  return c.json(applets, HttpStatusCodes.OK)
}

export const createApplet: AppRouteHandler<CreateRoute> = async (c) => {
  const body = c.req.valid('json')

  const appId = `applet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`

  // Upload Python script content to mock GCS
  const gcsPath = await uploadScript('default_user', appId, body.scriptContent)

  const newApplet: FirestoreApplet = {
    id: appId,
    userId: 'default_user',
    name: body.name,
    description: body.description,
    icon: body.icon,
    color: body.color,
    gcsPath,
    dependencies: body.dependencies || [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await firestore.collection('applets').doc(appId).set(newApplet)

  return c.json({
    ...newApplet,
    createdAt: toIsoString(newApplet.createdAt),
    updatedAt: toIsoString(newApplet.updatedAt),
  }, HttpStatusCodes.CREATED)
}

export const deleteApplet: AppRouteHandler<RemoveRoute> = async (c) => {
  const { id } = c.req.valid('param')

  const docRef = firestore.collection('applets').doc(id)
  const docSnap = await docRef.get()

  if (!docSnap.exists) {
    return c.json({ message: 'Applet not found' }, HttpStatusCodes.NOT_FOUND)
  }

  await docRef.delete()
  return c.body(null, HttpStatusCodes.NO_CONTENT)
}

export const runApplet: AppRouteHandler<RunRoute> = async (c) => {
  const { id } = c.req.valid('param')

  const docSnap = await firestore.collection('applets').doc(id).get()
  if (!docSnap.exists) {
    return c.json({ message: 'Applet not found' }, HttpStatusCodes.NOT_FOUND)
  }
  const applet = docSnap.data() as FirestoreApplet

  let scriptContent = ''
  try {
    scriptContent = await downloadScript(applet.gcsPath)
  }
  catch (error) {
    return c.json({ message: 'Failed to retrieve script content' }, HttpStatusCodes.INTERNAL_SERVER_ERROR)
  }

  // Setup SSE log stream
  return streamSSE(c, async (stream) => {
    const runId = `run_${Date.now()}`

    // Create execution run record in Firestore
    const runRecord: FirestoreAppletRun = {
      id: runId,
      appId: id,
      status: 'running',
      startedAt: new Date(),
    }
    await firestore.collection('applet_runs').doc(runId).set(runRecord)

    // Decrypt and load credentials for default_user to inject as subprocess env vars
    const envVars: Record<string, string> = {}
    try {
      const credsSnap = await firestore.collection('user_credentials').where('userId', '==', 'default_user').get()
      for (const doc of credsSnap.docs) {
        const cred = doc.data() as FirestoreUserCredential
        const decrypted = decrypt(cred.encryptedValue, cred.iv, cred.tag)
        envVars[cred.service.toUpperCase()] = decrypted
      }
    }
    catch (err) {
      console.warn('⚠️ Warning: Failed to decrypt credentials:', err)
    }

    let isAborted = false
    stream.onAbort(() => {
      isAborted = true
    })

    const result = await runSandboxScript({
      appId: id,
      scriptContent,
      dependencies: applet.dependencies,
      envVars,
      onLog: async (line, type) => {
        if (isAborted)
          return

        if (line.startsWith('__NODE_STATUS__:')) {
          const rawData = line.substring('__NODE_STATUS__:'.length).trim()
          try {
            const parsed = JSON.parse(rawData)
            await stream.writeSSE({
              data: JSON.stringify(parsed),
              event: 'node-status',
              id: String(Date.now()),
            })
          }
          catch {
            // Fallback to regular log if parsing fails
            await stream.writeSSE({
              data: JSON.stringify({ line, type }),
              event: 'log',
              id: String(Date.now()),
            })
          }
        }
        else if (line.startsWith('__FINAL_REPORT__:')) {
          const rawData = line.substring('__FINAL_REPORT__:'.length).trim()
          try {
            const parsed = JSON.parse(rawData)
            await stream.writeSSE({
              data: JSON.stringify(parsed),
              event: 'report-result',
              id: String(Date.now()),
            })
          }
          catch {
            await stream.writeSSE({
              data: JSON.stringify({ line, type }),
              event: 'log',
              id: String(Date.now()),
            })
          }
        }
        else {
          await stream.writeSSE({
            data: JSON.stringify({ line, type }),
            event: 'log',
            id: String(Date.now()),
          })
        }
      },
    })

    const status = result.exitCode === 0 ? 'success' : 'failed'

    // Update execution run record with final result
    await firestore.collection('applet_runs').doc(runId).update({
      status,
      exitCode: result.exitCode ?? undefined,
      errorSummary: result.error,
      finishedAt: new Date(),
    })

    if (!isAborted) {
      await stream.writeSSE({
        data: JSON.stringify({
          status,
          exitCode: result.exitCode,
          error: result.error,
        }),
        event: 'result',
        id: String(Date.now()),
      })
    }
  })
}
