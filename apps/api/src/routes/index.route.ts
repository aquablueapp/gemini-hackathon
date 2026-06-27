import { createRoute } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent } from 'stoker/openapi/helpers'
import { createMessageObjectSchema } from 'stoker/openapi/schemas'

import { createRouter } from '@/lib/create-app'

const indexRoute = createRoute({
  tags: ['Index'],
  method: 'get',
  path: '/',
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      createMessageObjectSchema('Aquablue API'),
      'Aquablue API Index',
    ),
  },
})

const router = createRouter()
  .openapi(
    indexRoute,
    (c) => {
      return c.json(
        {
          message: 'Aquablue API',
        },
        HttpStatusCodes.OK,
      )
    },
  )

export default router
