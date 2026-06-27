import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import router from './dev.index'

describe('dev Mock Performance Endpoint', () => {
  it('should return 200 OK and match performance schemas', async () => {
    const app = new Hono().route('/api', router)
    const res = await app.request('/api/dev/mock-performance')
    expect(res.status).toBe(200)
    const data = (await res.json()) as {
      algorithm: string
      metrics: {
        before_optimization: {
          avg_latency_ms: number
        }
      }
      improvement_summary: {
        speedup_ratio: string
      }
    }
    expect(data).toHaveProperty('algorithm')
    expect(data.metrics.before_optimization.avg_latency_ms).toBe(142.5)
    expect(data.improvement_summary.speedup_ratio).toBe('67.8x Faster')
  })
})
