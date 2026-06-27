import { createRoute, z } from '@hono/zod-openapi'
import * as HttpStatusCodes from 'stoker/http-status-codes'
import { jsonContent, jsonContentRequired } from 'stoker/openapi/helpers'
import { createErrorSchema } from 'stoker/openapi/schemas'

const tags = ['Credentials']

export const saveCredentialSchema = z.object({
  service: z.string().min(1).openapi({ example: 'gmail', description: 'The service identifier (e.g. gmail, polymarket)' }),
  secret: z.string().min(1).openapi({ example: 'your-api-key-or-oauth-token', description: 'The raw secret value to be encrypted' }),
})

export const credentialListSchema = z.array(z.string())

export const saveCredentialRoute = createRoute({
  path: '/credentials',
  method: 'post',
  request: {
    body: jsonContentRequired(saveCredentialSchema, 'Credential payload to encrypt and save'),
  },
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({ success: z.boolean() }),
      'Credential saved and encrypted successfully',
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: jsonContent(
      createErrorSchema(saveCredentialSchema),
      'Validation error',
    ),
  },
})

export const listConfiguredCredentialsRoute = createRoute({
  path: '/credentials',
  method: 'get',
  tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      credentialListSchema,
      'List of service names that have active credentials configured',
    ),
  },
})

export const save = saveCredentialRoute
export const list = listConfiguredCredentialsRoute

export type SaveRoute = typeof saveCredentialRoute
export type ListRoute = typeof listConfiguredCredentialsRoute
