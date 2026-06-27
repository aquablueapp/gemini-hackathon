import type { Locale } from '../shared'
import type { Messages } from './index'
/**
 * i18n 消息 API
 * 通过 HTTP 请求获取翻译文件
 *
 * 重要：此文件 **禁止** 顶层静态 import 语言包文件（如 import en from './en'），
 * 否则会将全部语言包打入主 Chunk，抵消 index.ts 的动态分包优化。
 * SSR 和客户端回退均使用 dynamic import() 按需加载。
 */
import { createIsomorphicFn } from '@tanstack/react-start'

/**
 * 动态加载器映射（按需加载，不会打入主 Chunk）
 */
const lazyMessageLoaders: Record<Locale, () => Promise<Messages>> = {
  'zh-CN': () => import('./zh-CN').then(m => m.default as unknown as Messages),
  'zh-TW': () => import('./zh-TW').then(m => m.default as unknown as Messages),
  'en': () => import('./en').then(m => m.default as unknown as Messages),
  'ja': () => import('./ja').then(m => m.default as unknown as Messages),
  'ko': () => import('./ko').then(m => m.default as unknown as Messages),
}

/**
 * 客户端获取翻译消息（同构函数）
 * SSR 时使用动态 import 加载静态文件，客户端优先从 HTTP API 获取，失败时回退到动态 import
 */
export const fetchMessagesClient = createIsomorphicFn()
  .server(async (locale: Locale): Promise<Messages> => {
    // SSR 时使用动态 import，每次请求只加载对应语言
    const loader = lazyMessageLoaders[locale]
    return loader()
  })
  .client(async (locale: Locale): Promise<Messages> => {
    try {
      // 客户端使用相对路径即可
      const apiUrl = import.meta.env.VITE_I18N_API_URL || '/api/i18n'
      const response = await fetch(`${apiUrl}/${locale}`)

      if (!response.ok) {
        throw new Error(`Failed to fetch messages for locale: ${locale}`)
      }

      const messages = await response.json()
      return messages as Messages
    }
    catch (error) {
      console.warn(`Failed to fetch messages from API for locale ${locale}, falling back to static files:`, error)

      // 回退到动态 import
      const loader = lazyMessageLoaders[locale]
      if (loader) {
        return loader()
      }

      throw new Error(`No messages available for locale: ${locale}`)
    }
  })
