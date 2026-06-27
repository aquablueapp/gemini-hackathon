import type { AppBindings, AppOpenAPI } from './types'
import { OpenAPIHono } from '@hono/zod-openapi'
import { cors } from 'hono/cors'
import { requestId } from 'hono/request-id'
import { notFound, onError, serveEmojiFavicon } from 'stoker/middlewares'

import { defaultHook } from 'stoker/openapi'
import env from '@/env'

import { pinoLogger } from '@/middlewares/pino-logger'

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  })
}

export default function createApp() {
  const app = createRouter()
  app.use(serveEmojiFavicon('📝'))
  app.use(requestId())
  app.use(pinoLogger())

  // 添加CORS中间件（兼容 APP_URL 动态配置）
  app.use('*', async (c, next) => {
    const appUrl = ((globalThis as any).APP_URL || env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '')
    const corsMiddleware = cors({
      origin: (origin) => {
        if (!origin)
          return appUrl
        if (origin === appUrl || origin.startsWith('http://localhost:') || origin.endsWith('.run.app')) {
          return origin
        }
        return appUrl
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
      credentials: true,
      exposeHeaders: ['Content-Length', 'X-Total-Count'],
      maxAge: 86400,
    })
    return corsMiddleware(c, next)
  })

  app.notFound(notFound)
  app.onError(async (err, c) => {
    // 结构化错误日志：在 stoker 的 onError（仅做 HTTP 响应格式化）之前记录完整现场
    const logger = c.get('logger')
    logger.error(
      {
        event_name: 'unhandled_error',
        error: err.message,
        stack: err.stack,
        trigger_payload: {
          method: c.req.method,
          path: c.req.path,
          query: c.req.query(),
        },
      },
      'Unhandled server error',
    )
    return onError(err, c)
  })
  return app
}

export function createTestApp<R extends AppOpenAPI>(router: R) {
  return createApp().route('/', router)
}
