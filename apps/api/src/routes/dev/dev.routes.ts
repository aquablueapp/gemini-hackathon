import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'

// Performance schema definitions for before/after optimizations
const performanceSchema = z.object({
  algorithm: z.string(),
  metrics: z.object({
    before_optimization: z.object({
      name: z.string(),
      avg_latency_ms: z.number(),
      p95_latency_ms: z.number(),
      throughput_ops_sec: z.number(),
      memory_usage_mb: z.number(),
      cpu_utilization_pct: z.number(),
    }),
    after_optimization: z.object({
      name: z.string(),
      avg_latency_ms: z.number(),
      p95_latency_ms: z.number(),
      throughput_ops_sec: z.number(),
      memory_usage_mb: z.number(),
      cpu_utilization_pct: z.number(),
    }),
  }),
  improvement_summary: z.object({
    speedup_ratio: z.string(),
    memory_saved_pct: z.string(),
    cpu_idle_gain_pct: z.string(),
  }),
})

export const devMockPerformanceRoute = createRoute({
  path: '/dev/mock-performance',
  method: 'get',
  tags: ['Dev'],
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      performanceSchema,
      'Fetch mock performance comparison stats successfully',
    ),
  },
})

export type DevMockPerformanceRoute = typeof devMockPerformanceRoute
