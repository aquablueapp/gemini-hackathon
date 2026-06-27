import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'
import { notFoundSchema } from '@/lib/constants'
import { appletSchema, createAppletSchema } from '@/shared/schemas/applet'

const tags = ['Apps']

const AppletIdParamsSchema = z.object({
  id: z.string().min(1).openapi({ example: 'applet_123', description: 'The unique ID of the Applet' }),
})

export const listAppletsRoute = createRoute({
  path: '/apps',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(appletSchema),
      'Get applets list successfully',
    ),
  },
})

export const createAppletRoute = createRoute({
  path: '/apps',
  method: 'post',
  request: {
    body: jsonContentRequired(createAppletSchema, 'Create Applet details'),
  },
  tags,
  responses: {
    [HttpStatusCodes.CREATED]: jsonContent(appletSchema, 'Applet created successfully'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(createAppletSchema),
      'Validation error',
    ),
  },
})

export const deleteAppletRoute = createRoute({
  path: '/apps/{id}',
  method: 'delete',
  request: {
    params: AppletIdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.NO_CONTENT]: {
      description: 'Applet deleted successfully',
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Applet not found'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(AppletIdParamsSchema),
      'Invalid ID parameters',
    ),
  },
})

export const runAppletRoute = createRoute({
  path: '/apps/{id}/run',
  method: 'get',
  request: {
    params: AppletIdParamsSchema,
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      description: 'Stream execution logs of the applet in real-time via Server-Sent Events (SSE).',
      content: {
        'text/event-stream': {
          schema: {
            type: 'string',
          },
        },
      },
    },
    [HttpStatusCodes.NOT_FOUND]: jsonContent(notFoundSchema, 'Applet not found'),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(AppletIdParamsSchema),
      'Invalid ID parameters',
    ),
  },
})

export const list = listAppletsRoute
export const create = createAppletRoute
export const remove = deleteAppletRoute
export const run = runAppletRoute

export type ListRoute = typeof listAppletsRoute
export type CreateRoute = typeof createAppletRoute
export type RemoveRoute = typeof deleteAppletRoute
export type RunRoute = typeof runAppletRoute
