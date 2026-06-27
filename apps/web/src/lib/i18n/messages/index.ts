/**
 * 消息文件索引
 * 支持通过 HTTP API 请求获取翻译，失败时回退到静态文件
 */
import type { Locale } from '../shared'
import { fetchMessagesClient } from './api'

/**
 * 将深层嵌套的对象属性从字面量类型转换为 string 类型
 */
type DeepStringify<T> = {
  [K in keyof T]: T[K] extends object ? DeepStringify<T[K]> : T[K] extends boolean ? boolean : string;
}

// Ensure type references default to the english baseline
export type Messages = DeepStringify<typeof import('./en').default>

/**
 * 静态导入消息（用于回退）
 */
const staticMessageLoaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  'zh-CN': () => import('./zh-CN').then(m => m as any),
  'zh-TW': () => import('./zh-TW').then(m => m as any),
  'en': () => import('./en').then(m => m as any),
  'ja': () => import('./ja').then(m => m as any),
  'ko': () => import('./ko').then(m => m as any),
}

/**
 * 动态加载消息
 * 优先从 HTTP API 获取，失败时回退到静态文件
 */
export const messageLoaders: Record<Locale, () => Promise<{ default: Messages }>> = {
  'zh-CN': async () => {
    if (typeof window === 'undefined') {
      return staticMessageLoaders['zh-CN']()
    }
    try {
      const messages = await fetchMessagesClient('zh-CN')
      return { default: messages }
    }
    catch (error) {
      return staticMessageLoaders['zh-CN']()
    }
  },
  'zh-TW': async () => {
    if (typeof window === 'undefined') {
      return staticMessageLoaders['zh-TW']()
    }
    try {
      const messages = await fetchMessagesClient('zh-TW')
      return { default: messages }
    }
    catch (error) {
      return staticMessageLoaders['zh-TW']()
    }
  },
  'en': async () => {
    if (typeof window === 'undefined') {
      return staticMessageLoaders.en()
    }
    try {
      const messages = await fetchMessagesClient('en')
      return { default: messages }
    }
    catch (error) {
      return staticMessageLoaders.en()
    }
  },
  'ja': async () => {
    if (typeof window === 'undefined') {
      return staticMessageLoaders.ja()
    }
    try {
      const messages = await fetchMessagesClient('ja')
      return { default: messages }
    }
    catch (error) {
      return staticMessageLoaders.ja()
    }
  },
  'ko': async () => {
    if (typeof window === 'undefined') {
      return staticMessageLoaders.ko()
    }
    try {
      const messages = await fetchMessagesClient('ko')
      return { default: messages }
    }
    catch (error) {
      return staticMessageLoaders.ko()
    }
  },
}
