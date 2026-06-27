/**
 * 共享的 i18n 配置
 * 定义支持的语言、默认语言、忽略的路径等
 */

export const defaultLocale = 'en' as const
export const supportedLocales = ['zh-CN', 'zh-TW', 'en', 'ja', 'ko'] as const

/**
 * Cookie 名称
 */
export const LOCALE_COOKIE = 'locale'

export type Locale = (typeof supportedLocales)[number]

export const supportedLanguageCodes = ['cn', 'tw', 'en', 'ja', 'kr'] as const
export type LanguageCode = (typeof supportedLanguageCodes)[number]
export const defaultLanguageCode: LanguageCode = 'cn'

export function localeToLanguageCode(locale: Locale): LanguageCode {
  switch (locale) {
    case 'zh-CN': return 'cn'
    case 'zh-TW': return 'tw'
    case 'ko': return 'kr'
    case 'ja': return 'ja'
    case 'en': return 'en'
    default: return 'cn'
  }
}

/**
 * 语言显示名称（在所有语言中显示相同）
 * 例如：中文显示为 '中文'，英文显示为 'English'
 */
export const localeNames: Record<Locale, string> = {
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
  'en': 'English',
  'ja': '日本語',
  'ko': '한국어',
} as const

// Paths that bypass locale handling entirely
// 注意：需要兼容带 locale 前缀的路径，如 /zh-CN/dashboard/chat
export const ignoredPathsRegex = /^\/(?:[a-z]{2}(?:-[A-Za-z]{2})?\/)?(?:api|rpc|dashboard|auth)(?:\/|$)/

export function shouldIgnorePath(pathname: string): boolean {
  return ignoredPathsRegex.test(pathname)
}

/**
 * 从路径中提取 locale
 * 例如: /es/about -> 'es', /about -> null
 */
export function normalizeLocale(input: string | null | undefined): Locale | null {
  if (!input)
    return null

  const value = input.trim().toLowerCase()
  if (value === 'zh')
    return 'zh-CN'
  if (value === 'zh-cn' || value === 'zh-hans')
    return 'zh-CN'
  if (value === 'zh-tw' || value === 'zh-hk' || value === 'zh-mo' || value === 'zh-hant')
    return 'zh-TW'
  if (value.startsWith('en'))
    return 'en'
  if (value.startsWith('ja'))
    return 'ja'
  if (value.startsWith('ko') || value.startsWith('kr'))
    return 'ko'

  const normalized = supportedLocales.find(locale => locale.toLowerCase() === value)
  return normalized ?? null
}

export function extractLocaleFromPath(pathname: string): Locale | null {
  const match = /^\/([a-z]{2}(?:-[A-Za-z]{2})?)(?:\/|$)/.exec(pathname)
  const locale = normalizeLocale(match?.[1])
  return locale && locale !== defaultLocale ? locale : null
}

/**
 * 验证 locale 是否有效
 */
export function isValidLocale(locale: string): locale is Locale {
  return supportedLocales.includes(locale as Locale)
}

/**
 * 解析 locale cookie
 * 可在客户端和服务器端使用
 */
export function parseLocaleCookie(cookieHeader: string | null): Locale | null {
  if (!cookieHeader)
    return null

  const cookies = cookieHeader.split(';').map(c => c.trim())
  const localeCookie = cookies.find(c => c.startsWith(`${LOCALE_COOKIE}=`))

  if (!localeCookie)
    return null

  const value = localeCookie.split('=')[1]
  return normalizeLocale(value)
}

/**
 * 从 Accept-Language header 检测语言
 * 解析 Accept-Language: "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7"
 */
export function detectLocaleFromAcceptLanguage(
  acceptLanguage: string | null,
): Locale | null {
  if (!acceptLanguage)
    return null

  // 解析 Accept-Language header
  const languages = acceptLanguage
    .split(',')
    .map((lang) => {
      const [locale, q = '1'] = lang.trim().split(';q=')
      return {
        locale: locale.trim(),
        quality: Number.parseFloat(q),
      }
    })
    .sort((a, b) => b.quality - a.quality) // 按优先级排序

  // 找到第一个支持的语言
  for (const { locale } of languages) {
    const normalized = normalizeLocale(locale)
    if (normalized) {
      return normalized
    }
  }

  return null
}

/**
 * 从浏览器 navigator 检测语言（仅客户端）
 */
export function detectLocaleFromNavigator(): Locale | null {
  if (typeof window === 'undefined')
    return null

  const primaryLocale = normalizeLocale(navigator.language)
  if (primaryLocale) {
    return primaryLocale
  }

  // 也检查 navigator.languages（支持的语言列表）
  for (const lang of navigator.languages || []) {
    const normalized = normalizeLocale(lang)
    if (normalized) {
      return normalized
    }
  }

  return null
}
