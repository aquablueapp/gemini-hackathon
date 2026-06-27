import { describe, expect, it, vi } from 'vitest'

import { withMetrics } from './with-metrics'

function createMockLogger() {
  return {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    silent: vi.fn(),
    assign: vi.fn(),
  } as any
}

describe('withMetrics', () => {
  it('should return the result of the wrapped function', async () => {
    const logger = createMockLogger()
    const result = await withMetrics(
      'test_operation',
      async () => ({ data: 'hello' }),
      logger,
    )
    expect(result).toEqual({ data: 'hello' })
  })

  it('should log duration_ms and event_name on success', async () => {
    const logger = createMockLogger()
    await withMetrics(
      'db_list_shops',
      async () => [1, 2, 3],
      logger,
    )
    expect(logger.debug).toHaveBeenCalledOnce()
    const logPayload = logger.debug.mock.calls[0][0]
    expect(logPayload.event_name).toBe('db_list_shops')
    expect(logPayload.status).toBe('success')
    expect(typeof logPayload.duration_ms).toBe('number')
    expect(logPayload.duration_ms).toBeGreaterThanOrEqual(0)
  })

  it('should log error with duration_ms on failure and re-throw', async () => {
    const logger = createMockLogger()
    const testError = new Error('DB connection failed')

    await expect(
      withMetrics(
        'db_query_failed',
        async () => { throw testError },
        logger,
      ),
    ).rejects.toThrow('DB connection failed')

    expect(logger.error).toHaveBeenCalledOnce()
    const logPayload = logger.error.mock.calls[0][0]
    expect(logPayload.event_name).toBe('db_query_failed')
    expect(logPayload.status).toBe('error')
    expect(logPayload.error).toBe('DB connection failed')
    expect(logPayload.stack).toBeDefined()
    expect(typeof logPayload.duration_ms).toBe('number')
  })

  it('should handle non-Error thrown values', async () => {
    const logger = createMockLogger()

    await expect(
      withMetrics(
        'string_error',
        async () => { throw 'raw string error' },
        logger,
      ),
    ).rejects.toThrow('raw string error')

    const logPayload = logger.error.mock.calls[0][0]
    expect(logPayload.error).toBe('raw string error')
    expect(logPayload.stack).toBeUndefined()
  })
})
