import type { DevMockPerformanceRoute } from './dev.routes'
import type { AppRouteHandler } from '@/lib/types'
import * as HttpStatusCodes from 'stoker/http-status-codes'

// Handler returning benchmark metrics for nested loops vs hash map lookup
export const devMockPerformanceHandler: AppRouteHandler<DevMockPerformanceRoute> = async (c) => {
  return c.json(
    {
      algorithm: 'User Directory Search & Filter (N=10,000)',
      metrics: {
        before_optimization: {
          name: 'Nested Double Loop (O(N^2))',
          avg_latency_ms: 142.5,
          p95_latency_ms: 198.2,
          throughput_ops_sec: 70,
          memory_usage_mb: 42.1,
          cpu_utilization_pct: 88.5,
        },
        after_optimization: {
          name: 'Hash map-based O(1) Lookup',
          avg_latency_ms: 2.1,
          p95_latency_ms: 4.5,
          throughput_ops_sec: 4800,
          memory_usage_mb: 12.8,
          cpu_utilization_pct: 5.2,
        },
      },
      improvement_summary: {
        speedup_ratio: '67.8x Faster',
        memory_saved_pct: '69.5% Reduction',
        cpu_idle_gain_pct: '83.3% Lower Load',
      },
    },
    HttpStatusCodes.OK,
  )
}
