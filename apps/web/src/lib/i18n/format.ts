/**
 * 日期、数字格式化 Helper
 *
 * 基于 use-intl / Intl 的 locale 一致格式化，避免 SSR 与客户端因 locale 或
 * 默认格式不同导致 hydration mismatch。
 *
 * 参考：
 * - https://next-intl.dev/docs/usage/dates-times
 * - https://next-intl.dev/docs/usage/numbers
 *
 * 使用方式：
 * - 在组件内：使用 useFormat()，返回的 formatter 已绑定当前 locale
 * - 在非 hook 上下文（如 column 定义、工具函数）：使用 formatDateTime / formatNumber 并传入 locale（如 useLocale() 的值）
 */

import { useFormatter } from 'use-intl'

// ---------------------------------------------------------------------------
// 默认格式选项（与 use-intl / Intl 一致，保证 SSR 与客户端输出一致）
// ---------------------------------------------------------------------------

const DEFAULT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
}

// ---------------------------------------------------------------------------
// 纯函数：传入 locale，用于非 hook 上下文（如 createColumns、工具函数）
// ---------------------------------------------------------------------------

/**
 * 按指定 locale 格式化日期时间
 * 用于无法使用 useFormat 的上下文（如列定义、接收 locale 参数的函数）
 */
export function formatDateTime(
  value: string | Date | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (value == null)
    return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime()))
    return '-'
  return date.toLocaleString(locale, { ...DEFAULT_DATE_TIME_OPTIONS, ...options })
}

/**
 * 按指定 locale 格式化数字
 * 用于无法使用 useFormat 的上下文
 */
export function formatNumber(
  value: number | null | undefined,
  locale: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null || Number.isNaN(value))
    return '-'
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * 按指定 locale 格式化货币
 */
export function formatCurrency(
  value: number | null | undefined,
  locale: string,
  currency: string,
  options?: Intl.NumberFormatOptions,
): string {
  if (value == null || Number.isNaN(value))
    return '-'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    ...options,
  }).format(value)
}

// ---------------------------------------------------------------------------
// Hook：在组件内使用，自动使用 IntlProvider 的 locale，SSR 与客户端一致
// ---------------------------------------------------------------------------

/**
 * 返回基于当前 locale 的格式化方法，用于组件内。
 * 底层使用 use-intl 的 useFormatter()，与 next-intl 文档一致。
 *
 * @example
 * const { formatDateTime, formatNumber } = useFormat()
 * return <span>{formatDateTime(row.original.createdAt)}</span>
 */
export function useFormat() {
  const format = useFormatter()

  return {
    /** 日期时间：格式与 formatDateTime 纯函数一致，但使用当前 locale */
    formatDateTime: (
      value: string | Date | null | undefined,
      options?: Intl.DateTimeFormatOptions,
    ) => {
      if (value == null)
        return '-'
      const date = new Date(value)
      if (Number.isNaN(date.getTime()))
        return '-'
      const merged = { ...DEFAULT_DATE_TIME_OPTIONS, ...options }
      // use-intl 的 dateTime 只接受 timeZoneName: 'long' | 'short'，与 Intl 的完整类型不完全一致
      return format.dateTime(date, merged as Parameters<typeof format.dateTime>[1])
    },
    /** 数字 */
    formatNumber: (value: number | null | undefined, options?: Intl.NumberFormatOptions) => {
      if (value == null || Number.isNaN(value))
        return '-'
      return format.number(value, options as any)
    },
  }
}
