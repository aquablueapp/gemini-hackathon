import type { PinoLogger } from 'hono-pino'

/**
 * 结构化错误日志辅助函数
 *
 * 消除各 handler 中重复的 `error instanceof Error ? ...` 模式，
 * 统一 event_name + error + stack 的日志结构。
 *
 * @param logger - Pino logger 实例
 * @param eventName - 事件名称（snake_case）
 * @param error - 捕获的错误对象
 * @param message - 人类可读的日志消息
 * @param extra - 可选的额外上下文（如 trigger_payload）
 */
export function logStructuredError(
  logger: PinoLogger,
  eventName: string,
  error: unknown,
  message: string,
  extra?: Record<string, unknown>,
): void {
  logger.error(
    {
      event_name: eventName,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...extra,
    },
    message,
  )
}
