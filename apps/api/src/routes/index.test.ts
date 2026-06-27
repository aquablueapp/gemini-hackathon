import { testClient } from 'hono/testing'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { describe, expect, it } from 'vitest'

import env from '@/env'
import { createTestApp } from '@/lib/create-app'

import router from './index.route'

if (env.NODE_ENV !== 'test') {
  throw new Error('NODE_ENV must be \'test\'')
}

const client = testClient<typeof router>(createTestApp(router)) as any

describe('index route', () => {
  it('gET / - 返回健康检查信息', async () => {
    const response = await client.index.$get()

    expect(response.status).toBe(HttpStatusCodes.OK)
    const json = await response.json()
    expect(json.message).toBeDefined()
  })
})
