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
  const url = new URL(request.url)
  const pathname = url.pathname

  // 跳过忽略的路径
  if (shouldIgnorePath(pathname)) {
    return {}
  }

  // 处理默认语言前缀（包含 legacy /zh）
  const prefixMatch = /^\/([a-z]{2}(?:-[A-Za-z]{2})?)(?:\/|$)/.exec(pathname)
  const prefixLocale = normalizeLocale(prefixMatch?.[1])
  if (prefixLocale && prefixLocale === defaultLocale) {
    url.pathname = pathname.replace(`/${prefixMatch?.[1]}`, '') || '/'
    return {
      redirect: Response.redirect(url.toString(), 301),
      setCookie: { name: LOCALE_COOKIE, value: defaultLocale },
    }
  }

  const urlLocale = extractLocaleFromPath(pathname)
  const cookieLocale = parseLocaleCookie(request.headers.get('cookie'))

  // 如果 URL 中有 locale，同步到 cookie
  if (urlLocale) {
    // 从忽略的路径中移除 locale: /en/dashboard -> /dashboard
    const strippedPath = pathname.replace(`/${urlLocale}`, '') || '/'
    if (shouldIgnorePath(strippedPath)) {
      url.pathname = strippedPath
      return { redirect: Response.redirect(url.toString(), 301) }
    }

    // 当 URL 有明确的 locale 时，同步 cookie
    if (urlLocale !== cookieLocale) {
      return { setCookie: { name: LOCALE_COOKIE, value: urlLocale } }
    }
    return {}
  }

  // URL 中没有 locale，需要检测并可能重定向
  // 优先级：Cookie > Accept-Language > 默认语言
  const detectedLocale
    = cookieLocale
      ?? defaultLocale

  // 如果检测到的语言不是默认语言，且与 cookie 不同，重定向并设置 cookie
  if (detectedLocale !== defaultLocale && detectedLocale !== cookieLocale) {
    url.pathname = `/${detectedLocale}${pathname === '/' ? '' : pathname}`
    return {
      redirect: Response.redirect(url.toString(), 302), // 302 临时重定向
      setCookie: { name: LOCALE_COOKIE, value: detectedLocale },
    }
  }

  // 如果是默认语言，不需要重定向，但可以设置 cookie（如果还没有）
  if (detectedLocale === defaultLocale && !cookieLocale) {
    return { setCookie: { name: LOCALE_COOKIE, value: defaultLocale } }
  }

  return {}
}
