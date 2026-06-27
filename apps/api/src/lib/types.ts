import type { OpenAPIHono, RouteConfig, RouteHandler } from '@hono/zod-openapi'
import type { Context, Schema } from 'hono'
import type { PinoLogger } from 'hono-pino'

export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  PREMIUM: 'premium',
} as const

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES]

export const APP_BINDING_KEYS = {
  LOGGER: 'logger',
  USER_ROLE: 'userRole',
  USER_ID: 'userId',
  SESSION_ID: 'sessionId',
} as const

export interface AppBindings {
  Bindings: Record<string, unknown>
  Variables: {
    [APP_BINDING_KEYS.LOGGER]: PinoLogger
    [APP_BINDING_KEYS.USER_ROLE]?: UserRole
    [APP_BINDING_KEYS.USER_ID]?: string
    [APP_BINDING_KEYS.SESSION_ID]?: string
  }
};

export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>

export type AppContext = Context<AppBindings>
