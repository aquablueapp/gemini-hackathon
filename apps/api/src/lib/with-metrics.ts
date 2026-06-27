import type { PinoLogger } from 'hono-pino'

/**
 * 高阶函数：自动包裹异步操作并记录 duration_ms
 * 用于核心 DB 查询和外部 API 调用的性能度量
 *
 * @param eventName - 事件名称（snake_case），如 'db_list_shops'
 * @param fn - 待度量的异步函数
 * @param logger - Pino logger 实例
 * @returns 原始函数的返回值
 */
export async function withMetrics<T>(
  eventName: string,
  fn: () => Promise<T>,
  logger: PinoLogger,
): Promise<T> {
  const start = performance.now()
  try {
    const result = await fn()
    const durationMs = Math.round((performance.now() - start) * 100) / 100
    logger.debug(
      {
        event_name: eventName,
        duration_ms: durationMs,
        status: 'success',
      },
      `${eventName} completed`,
    )
    return result
  }
  catch (error) {
    const durationMs = Math.round((performance.now() - start) * 100) / 100
    logger.error(
      {
        event_name: eventName,
        duration_ms: durationMs,
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      `${eventName} failed`,
    )
    throw error
  }
}
