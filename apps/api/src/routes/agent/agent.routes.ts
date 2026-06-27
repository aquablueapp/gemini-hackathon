import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'

const tags = ['Agent']

export const chatRequestSchema = z.object({
  message: z.string().min(1).openapi({ example: 'Clean old spams from Inbox' }),
  sessionId: z.string().min(1).openapi({ example: 'session_123' }),
  model: z.string().optional().openapi({ example: 'gemini-2.5-flash' }),
})

export const chatRoute = createRoute({
  path: '/agent/chat',
  method: 'post',
  request: {
    body: jsonContentRequired(chatRequestSchema, 'Chat request parameters'),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: {
      description: 'Stream execution logs of the agent in real-time via Server-Sent Events (SSE).',
      content: {
        'text/event-stream': {
          schema: {
            type: 'string',
          },
        },
      },
    },
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(chatRequestSchema),
      'Validation error',
    ),
  },
})

export const chat = chatRoute
export type ChatRoute = typeof chatRoute

export const getSessionEventsRoute = createRoute({
  path: '/agent/sessions/{sessionId}/events',
  method: 'get',
  request: {
    params: z.object({
      sessionId: z.string().openapi({ example: 'session_gcp_clean' }),
    }),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.array(
        z.object({
          id: z.string(),
          sessionId: z.string(),
          role: z.enum(['user', 'model', 'tool']),
          author: z.string(),
          content: z.string(),
          createdAt: z.any(),
        }),
      ),
      'List of chat events in session',
    ),
  },
})

export type GetSessionEventsRoute = typeof getSessionEventsRoute
