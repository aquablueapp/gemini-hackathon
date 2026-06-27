import { pinoLogger as logger } from 'hono-pino'
import pino from 'pino'
import pretty from 'pino-pretty'

import env from '@/env'

export function pinoLogger() {
  return logger({
    pino: pino(
      {
        level: env.LOG_LEVEL || 'info',
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            '*.password',
            '*.secret',
            '*.creditCard',
            // 深层嵌套 PII 保护 (I5: fast-redact 不支持 ** 递归通配符)
            '*.*.password',
            '*.*.secret',
            // 查询字符串中可能携带的敏感参数 (I6)
            '*.query.token',
            '*.query.api_key',
            '*.query.secret',
          ],
          censor: '[REDACTED]',
        },
      },
      env.NODE_ENV === 'production' ? undefined : pretty(),
    ),
    http: {
      reqId: () => crypto.randomUUID(),
      onReqBindings: c => ({
        reqId: c.get('requestId'), // Override hono-pino's default reqId with our X-Request-Id
        event_name: 'http_request_completed', // Mandatory according to GEMINI.md
        req: {
          url: c.req.path,
          method: c.req.method,
          query: c.req.query(),
          userAgent: c.req.header('user-agent'),
          ip: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for'),
          country: c.req.header('cf-ipcountry'),
        },
      }),
      onResBindings: (c) => {
        const userId = c.get('userId' as any)
        const userRole = c.get('userRole' as any)

        return {
          res: {
            status: c.res.status, // Only log status, NOT the entire response object
          },
          route: c.req.routePath || c.req.path, // The matched route template (e.g. /shops/:id), evaluated AFTER routing
          ...(userId && { user_id: userId, user_role: userRole }),
        }
      },
    },
  })
}
