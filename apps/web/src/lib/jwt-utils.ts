/**
 * JWT 工具函数
 * 用于解析和处理 JWT token
 */
import * as Sentry from '@sentry/react'

export const JWT_TOKEN_QUERY_KEY = 'jwt-token'

export interface JwtTokenData {
  token: string
  payload: {
    id?: string
    email?: string
    role?: string
    sessionId?: string
    exp?: number
    iat?: number
    [key: string]: unknown
  }
  expiresAt: number | null
}

/**
 * 解析 JWT token 的 payload（不验证签名）
 * @param token - JWT token 字符串
 * @returns 解析后的 payload 对象
 */
export function parseJwtPayload(token: string): any {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format')
    }

    const payload = parts[1]
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    const decoded = atob(padded)
    return JSON.parse(decoded)
  }
  catch (error) {
    Sentry.captureException(error, { extra: { source: 'jwt_parse' } })
    return null
  }
}

/**
 * 从 JWT token 创建 JwtTokenData 对象
 * @param token - JWT token 字符串
 * @returns JwtTokenData 对象
 */
export function createJwtTokenData(token: string): JwtTokenData {
  const payload = parseJwtPayload(token)
  const expiresAt = payload?.exp ? payload.exp * 1000 : null

  return {
    token,
    payload,
    expiresAt,
  }
}
