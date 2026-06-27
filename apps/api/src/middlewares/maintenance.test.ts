import { createRoute, z } from '@hono/zod-openapi'
import { testClient } from 'hono/testing'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import env from '@/env'
import { createRouter, createTestApp } from '@/lib/create-app'
import { maintenanceModeGuard } from '@/middlewares/maintenance'

/**
 * MAINTENANCE_MODE 中间件测试
 * 直接操作 env 对象的 MAINTENANCE_MODE 属性来控制开关状态。
 * 不使用 vi.mock 以避免在 isolate: false 模式下污染其他测试文件。
 */

// 创建测试路由
const testRoute = createRoute({
  path: '/test-endpoint',
  method: 'get',
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
      description: 'OK',
    },
  },
})

const exemptAuthRoute = createRoute({
  path: '/api/auth/test',
  method: 'get',
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
      description: 'OK',
    },
  },
})

const rootRoute = createRoute({
  path: '/',
  method: 'get',
  responses: {
    [HttpStatusCodes.OK]: {
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
      description: 'OK',
    },
  },
})

function createTestRouter() {
  const router = createRouter()
  router.use('*', maintenanceModeGuard)
  return router
    .openapi(testRoute, c => c.json({ message: 'ok' }, HttpStatusCodes.OK))
    .openapi(exemptAuthRoute, c => c.json({ message: 'auth ok' }, HttpStatusCodes.OK))
    .openapi(rootRoute, c => c.json({ message: 'root ok' }, HttpStatusCodes.OK))
}

// 记录原始值以便恢复
const originalMaintenanceMode = env.MAINTENANCE_MODE

describe('maintenance middleware', () => {
  beforeEach(() => {
    (env as Record<string, unknown>).MAINTENANCE_MODE = false
  })

  afterEach(() => {
    // 恢复原始值，避免影响其他测试文件
    (env as Record<string, unknown>).MAINTENANCE_MODE = originalMaintenanceMode
  })

  it('should allow requests when maintenance mode is off', async () => {
    const app = createTestApp(createTestRouter())
    const client = testClient<typeof app>(app) as any
    const response = await client['test-endpoint'].$get()
    expect(response.status).toBe(HttpStatusCodes.OK)
  })

  it('should block non-exempt requests when maintenance mode is on', async () => {
    (env as Record<string, unknown>).MAINTENANCE_MODE = true
    const app = createTestApp(createTestRouter())
    const client = testClient<typeof app>(app) as any
    const response = await client['test-endpoint'].$get()
    expect(response.status).toBe(HttpStatusCodes.SERVICE_UNAVAILABLE)
    const json = await response.json()
    expect((json).success).toBe(false)
    expect((json).error.issues[0].code).toBe('MAINTENANCE_MODE')
  })

  it('should allow /api/auth/ paths when maintenance mode is on', async () => {
    (env as Record<string, unknown>).MAINTENANCE_MODE = true
    const app = createTestApp(createTestRouter())
    const client = testClient<typeof app>(app) as any
    const response = await client.api.auth.test.$get()
    expect(response.status).toBe(HttpStatusCodes.OK)
  })

  it('should allow root path when maintenance mode is on', async () => {
    (env as Record<string, unknown>).MAINTENANCE_MODE = true
    const app = createTestApp(createTestRouter())
    const client = testClient<typeof app>(app) as any
    const response = await client.index.$get()
    expect(response.status).toBe(HttpStatusCodes.OK)
  })
})
