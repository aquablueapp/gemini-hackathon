import type { Messages } from './messages'
import type { Locale } from './shared'
/**
 * 客户端 i18n 工具
 * 处理客户端 locale 检测和提供者
 */
import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import * as React from 'react'
import { IntlProvider as UseIntlProvider, useMessages } from 'use-intl'
import { messageLoaders } from './messages'
import {
  defaultLocale,
  detectLocaleFromAcceptLanguage,
  detectLocaleFromNavigator,
  extractLocaleFromPath,
  LOCALE_COOKIE,
  normalizeLocale,
  parseLocaleCookie,
  shouldIgnorePath,
  supportedLocales,
} from './shared'

// 导出 useMessages hook，供其他组件使用
export { useMessages }

/**
 * 获取当前 locale（同构函数，支持 SSR 和客户端）
 */
export const getCurrentLocale = createIsomorphicFn()
  .server(() => {
    try {
      const request = getRequest()
      const url = new URL(request.url)

      // Dashboard 从 cookie 读取
      if (shouldIgnorePath(url.pathname)) {
        return (
          parseLocaleCookie(request.headers.get('cookie'))
          ?? detectLocaleFromAcceptLanguage(request.headers.get('accept-language'))
          ?? defaultLocale
        )
      }
      // 公开页面从 URL 读取，fallback 到 cookie 和 Accept-Language
      return (
        extractLocaleFromPath(url.pathname)
        ?? parseLocaleCookie(request.headers.get('cookie'))
        ?? detectLocaleFromAcceptLanguage(request.headers.get('accept-language'))
        ?? defaultLocale
      )
    }
    catch (e) {
      // Avoid calling client-side Sentry SDK on Node.js server side to prevent serialization timeouts
      if (import.meta.env.DEV) {
        console.warn('SSR locale detection failed, falling back to default:', e)
      }
      return defaultLocale
    }
  })
  .client(() => {
    // Dashboard 从 cookie 读取
    if (shouldIgnorePath(window.location.pathname)) {
      return (
        parseLocaleCookie(document.cookie)
        ?? detectLocaleFromNavigator()
        ?? defaultLocale
      )
    }
    // 公开页面从 URL 读取，fallback 到 cookie 和 navigator
    return (
      extractLocaleFromPath(window.location.pathname)
      ?? parseLocaleCookie(document.cookie)
      ?? detectLocaleFromNavigator()
      ?? defaultLocale
    )
  })

/**
 * 获取客户端 locale（仅客户端使用）
 */
export function getClientLocale(pathname: string): Locale {
  // 安全检查：确保在客户端环境
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return defaultLocale
  }

  if (shouldIgnorePath(pathname)) {
    return (
      parseLocaleCookie(document.cookie)
      ?? detectLocaleFromNavigator()
      ?? defaultLocale
    )
  }
  return (
    extractLocaleFromPath(pathname)
    ?? parseLocaleCookie(document.cookie)
    ?? detectLocaleFromNavigator()
    ?? defaultLocale
  )
}

/**
 * 异步加载消息
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  // 验证 locale 是否有效，如果无效则使用默认 locale
  const normalizedLocale = normalizeLocale(locale) ?? defaultLocale
  const validLocale = supportedLocales.includes(normalizedLocale) ? normalizedLocale : defaultLocale
  const loader = messageLoaders[validLocale]

  if (!loader) {
    throw new Error(`No message loader found for locale: ${validLocale}`)
  }

  const module = await loader()
  return module.default
}

/**
 * 客户端设置 locale cookie
 */
export function setLocaleCookie(locale: Locale) {
  if (typeof document === 'undefined')
    return
  document.cookie = `${LOCALE_COOKIE}=${locale}; Path=/; SameSite=Lax; Max-Age=31536000`
}

/**
 * IntlProvider 组件包装器
 */
export function IntlProvider(props: {
  locale: Locale
  messages: Messages
  timeZone?: string
  children: React.ReactNode
}) {
  return (
    <UseIntlProvider
      locale={props.locale}
      messages={props.messages as any}
      timeZone={props.timeZone}
    >
      {props.children}
    </UseIntlProvider>
  )
}
