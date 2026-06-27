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
  .server(() => 'en')
  .client(() => 'en')

/**
 * 获取客户端 locale（仅客户端使用）
 */
export function getClientLocale(pathname: string): Locale {
  return 'en'
}

/**
 * 异步加载消息
 */
export async function loadMessages(locale: Locale): Promise<Messages> {
  const loader = messageLoaders.en
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
