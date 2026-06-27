import { testClient } from 'hono/testing'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { describe, expect, it, vi } from 'vitest'
import { createTestApp } from '@/lib/create-app'
import router from './apps.index'

// Setup in-memory stores for mock Firestore collections
const mockStore: Record<string, Map<string, any>> = {
  applets: new Map(),
  applet_runs: new Map(),
  user_credentials: new Map(),
}

vi.mock('@/db/firestore', () => {
  const getCollectionMock = (colName: string) => {
    const colStore = mockStore[colName] || new Map()
    return {
      doc: (id: string) => ({
        get: async () => ({
          exists: colStore.has(id),
          data: () => colStore.get(id),
        }),
        set: async (val: any) => {
          colStore.set(id, val)
        },
        update: async (val: any) => {
          const prev = colStore.get(id) || {}
          colStore.set(id, { ...prev, ...val })
        },
        delete: async () => {
          colStore.delete(id)
        },
      }),
      where: (field: string, op: string, value: any) => ({
        get: async () => {
          const docs = Array.from(colStore.values())
            .filter((doc: any) => doc[field] === value)
            .map((doc: any) => ({
              data: () => doc,
            }))
          return { docs }
        },
      }),
    }
  }

  return {
    firestore: {
      collection: getCollectionMock,
    },
    default: {
      collection: getCollectionMock,
    },
  }
})

const client = testClient<typeof router>(createTestApp(router)) as any

describe('apps Router API', () => {
  let createdAppId: string

  it('pOST /apps - create applet successfully', async () => {
    const payload = {
      name: 'Test Email Cleaner',
      description: 'Helper to clean spams',
      icon: 'mail-minus',
      color: 'rose',
      scriptContent: 'print("run successful from sandbox test")',
      dependencies: ['requests'],
    }

    const res = await client.apps.$post({
      json: payload,
    })

    expect(res.status).toBe(HttpStatusCodes.CREATED)
    const json = await res.json()
    expect(json.name).toBe(payload.name)
    expect(json.icon).toBe(payload.icon)
    expect(json.gcsPath).toContain('gs://agent-bucket/')
    expect(json.id).toBeDefined()
    createdAppId = json.id
  })

  it('gET /apps - retrieve applets list', async () => {
    const res = await client.apps.$get()
    expect(res.status).toBe(HttpStatusCodes.OK)
    const json = await res.json()
    expect(Array.isArray(json)).toBe(true)
    expect(json.some((app: any) => app.id === createdAppId)).toBe(true)
  })

  it('gET /apps/:id/run - stream execution logs via SSE', async () => {
    const res = await client.apps[':id'].run.$get({
      param: { id: createdAppId },
    })

    expect(res.status).toBe(HttpStatusCodes.OK)
    expect(res.headers.get('content-type')).toContain('text/event-stream')

    const bodyText = await res.text()
    expect(bodyText).toContain('event: log')
    expect(bodyText).toContain('event: result')
    expect(bodyText).toContain('success')
  })

  it('gET /apps/:id/run - parse and stream node status and report events via SSE', async () => {
    // Create a temporary applet with custom node status & report logs
    const payload = {
      name: 'Test Node SSE Applet',
      description: 'Helper to check node status and report parsing',
      icon: 'cpu',
      color: 'amber',
      scriptContent: 'print(\'__NODE_STATUS__:{"nodeId": "node-123", "status": "active"}\')\nprint(\'__FINAL_REPORT__:{"score": 100, "passed": true}\')\nprint(\'normal output log\')',
      dependencies: [],
    }

    const createRes = await client.apps.$post({ json: payload })
    expect(createRes.status).toBe(HttpStatusCodes.CREATED)
    const createJson = await createRes.json()
    const tempAppId = createJson.id

    try {
      const res = await client.apps[':id'].run.$get({
        param: { id: tempAppId },
      })

      expect(res.status).toBe(HttpStatusCodes.OK)
      expect(res.headers.get('content-type')).toContain('text/event-stream')

      const bodyText = await res.text()

      // Assert that custom events are received
      expect(bodyText).toContain('event: node-status')
      expect(bodyText).toContain('data: {"nodeId":"node-123","status":"active"}')

      expect(bodyText).toContain('event: report-result')
      expect(bodyText).toContain('data: {"score":100,"passed":true}')

      expect(bodyText).toContain('event: log')
      expect(bodyText).toContain('normal output log')
    } finally {
      // Clean up
      await client.apps[':id'].$delete({
        param: { id: tempAppId },
      })
    }
  })

  it('dELETE /apps/:id - remove applet', async () => {
    const res = await client.apps[':id'].$delete({
      param: { id: createdAppId },
    })

    expect(res.status).toBe(HttpStatusCodes.NO_CONTENT)

    // Verify deletion
    const listRes = await client.apps.$get()
    const listJson = await listRes.json()
    expect(listJson.some((app: any) => app.id === createdAppId)).toBe(false)
  })
})
