/**
 * 服务器端 i18n 工具
 * 处理 cookie、重定向等服务器端逻辑
 */
import {
  defaultLocale,
  detectLocaleFromAcceptLanguage,
  extractLocaleFromPath,
  LOCALE_COOKIE,
  normalizeLocale,
  parseLocaleCookie,
  shouldIgnorePath,
} from './shared'

/**
 * 创建 cookie header
 */
export function createCookieHeader(name: string, value: string): string {
  return `${name}=${value}; Path=/; SameSite=Lax; Max-Age=31536000` // 1 year
}

/**
 * 处理 locale 中间件逻辑
 * 返回需要执行的重定向或 cookie 设置
 */
export function handleLocaleMiddleware(request: Request): {
  redirect?: Response
  setCookie?: { name: string, value: string }
} {
  return {}
}
