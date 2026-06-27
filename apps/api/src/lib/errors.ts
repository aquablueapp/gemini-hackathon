/**
 * 统一的错误处理工具
 */

export const ERROR_CODES = {
  // 认证相关
  AUTH_UNAUTHORIZED: 'auth_unauthorized',
  AUTH_FORBIDDEN: 'auth_forbidden',
  AUTH_INVALID_TOKEN: 'auth_invalid_token',
  AUTH_SESSION_EXPIRED: 'auth_session_expired',
  AUTH_MISSING_SESSION_ID: 'auth_missing_session_id',
  AUTH_SESSION_NOT_FOUND: 'auth_session_not_found',

  // 资源相关
  RESOURCE_NOT_FOUND: 'resource_not_found',
  RESOURCE_ALREADY_EXISTS: 'resource_already_exists',

  // 验证相关
  VALIDATION_ERROR: 'validation_error',
  VALIDATION_INVALID_UPDATES: 'validation_invalid_updates',

  // 系统相关
  INTERNAL_ERROR: 'internal_error',
} as const

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES]

export class AuthError extends Error {
  constructor(
    public readonly code: ErrorCode | string,
    message?: string,
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export function createErrorResponse(
  code: ErrorCode | string,
  options?: { message?: string, path?: (string | number)[], name?: string },
) {
  const { message, path = [], name } = options || {}
  return {
    success: false,
    error: {
      issues: [
        {
          code,
          path,
          ...(message && { message }),
        },
      ],
      name: name || 'Error',
    },
  }
}
