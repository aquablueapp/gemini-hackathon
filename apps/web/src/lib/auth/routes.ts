/**
 * 认证路由配置
 */
export const AUTH_ROUTES = {
  signIn: 'sign-in',
  signUp: 'sign-up',
  forgotPassword: 'forgot-password',
  resetPassword: 'reset-password',
  verifyEmail: 'verify-email',
  resendEmail: 'resend-email',
} as const

export const AUTH_BASE_PATH = '/auth'

export type AuthRoute = typeof AUTH_ROUTES[keyof typeof AUTH_ROUTES]

export function getAuthRoute(route: AuthRoute): string {
  return `${AUTH_BASE_PATH}/${route}`
}
