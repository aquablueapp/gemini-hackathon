import { testClient } from 'hono/testing'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { describe, expect, it, vi } from 'vitest'
import { createTestApp } from '@/lib/create-app'
import router from './agent.index'

const client = testClient<typeof router>(createTestApp(router)) as any

describe('agent Chat API Router', () => {
  it('pOST /agent/chat - pipes stream output successfully from ADK agent server', async () => {
    // Intercept fetch call to the ADK agent server and return a mock event stream
    const originalFetch = globalThis.fetch

    globalThis.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes('/run_sse')) {
        const mockStream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder()
            // Stream mock event payload
            controller.enqueue(
              encoder.encode(
                'data: {"author": "root_agent", "content": {"role": "model", "parts": [{"text": "Hello, I am ready."}]}}\n\n',
              ),
            )
            controller.close()
          },
        })

        return new Response(mockStream, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
          },
        })
      }
      return originalFetch(url, init)
    })

    const res = await client.agent.chat.$post({
      json: {
        message: 'Hello ADK Agent',
        sessionId: 'session_test_456',
      },
    })

    expect(res.status).toBe(HttpStatusCodes.OK)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const bodyText = await res.text()
    expect(bodyText).toContain('Hello, I am ready.')

    // Restore fetch
    globalThis.fetch = originalFetch
  })

  it('pOST /agent/chat - returns error response if validation fails', async () => {
    const res = await client.agent.chat.$post({
      json: {
        message: '', // invalid: min(1) required
        sessionId: 'session_test_456',
      },
    })

    expect(res.status).toBe(HttpStatusCodes.UNPROCESSABLE_ENTITY)
  })
})
