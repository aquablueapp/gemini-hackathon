import type { AppOpenAPI } from './types'

import { Scalar } from '@scalar/hono-api-reference'

import packageJSON from '../../package.json' assert { type: 'json' }

export default function configureOpenAPI(app: AppOpenAPI) {
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      version: packageJSON.version,
      title: 'Aquablue API',
    },
  })

  app.get(
    '/reference',
    Scalar({
      theme: 'kepler',
      layout: 'modern',
      authentication: {
        preferredSecurityScheme: 'httpBearer',
        securitySchemes: {
          httpBearer: {
            name: 'Authorization',
            in: 'header',
            description: 'Bearer token for authentication',
            value: 'Bearer 1234567890',
          },
        },
      },
      sources: [
        {
          url: '/doc',
          title: 'Aquablue API',
        },
      ],
      showSidebar: true,
      defaultHttpClient: {
        targetKey: 'js',
        clientKey: 'fetch',
      },
      // 重要：这里必须指向主文档，以便 Scalar 知道从哪开始加载
      url: '/doc',
    }),
  )
}
