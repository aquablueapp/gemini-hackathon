import type { Locale } from '~/lib/i18n/shared'
import { useLocation, useParams } from '@tanstack/react-router'
import * as React from 'react'
import {
  IntlProvider as BaseIntlProvider,
  getClientLocale,
  getCurrentLocale,
  loadMessages,
} from '~/lib/i18n/client'
import { defaultLocale, isValidLocale } from '~/lib/i18n/shared'

const messageCache: Map<string, Promise<any>> = new Map()

export function IntlProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const pathname = location.pathname
  const routeParams = useParams({ strict: false })
  const routeLocale = routeParams.locale as Locale | undefined

  const normalizeLocale = React.useCallback((rawLocale: string | undefined): Locale => {
    if (rawLocale && isValidLocale(rawLocale)) {
      return rawLocale
    }
    return defaultLocale
  }, [])

  const [locale, setLocale] = React.useState<Locale>(() => {
    if (routeLocale && isValidLocale(routeLocale)) {
      return routeLocale
    }
    if (typeof window !== 'undefined') {
      const detectedLocale = getClientLocale(pathname)
      return normalizeLocale(detectedLocale)
    }
    else {
      try {
        const detectedLocale = getCurrentLocale()
        return normalizeLocale(detectedLocale)
      }
      catch (error) {
        console.warn('Failed to get locale in SSR, using default:', error)
        return defaultLocale
      }
    }
  })

  React.useEffect(() => {
    if (routeLocale && isValidLocale(routeLocale) && routeLocale !== locale) {
      setLocale(routeLocale)
    }
  }, [routeLocale, locale])

  React.useEffect(() => {
    if (routeLocale || typeof window === 'undefined')
      return

    const updateLocale = () => {
      const newLocale = normalizeLocale(getClientLocale(pathname))
      setLocale(prevLocale => prevLocale !== newLocale ? newLocale : prevLocale)
    }

    // Sync once on mount / pathname change
    updateLocale()

    // Listen for browser back/forward navigation
    const handlePopState = () => setTimeout(updateLocale, 0)
    window.addEventListener('popstate', handlePopState)

    // Poll for cookie changes since auth pages don't have URL locale
    const intervalId = setInterval(updateLocale, 1000)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      clearInterval(intervalId)
    }
  }, [pathname, routeLocale, normalizeLocale])

  const messagePromise = React.useMemo(() => {
    let promise = messageCache.get(locale)
    if (!promise) {
      promise = loadMessages(locale)
      messageCache.set(locale, promise)
    }
    return promise
  }, [locale])

  const messages = React.use(messagePromise)

  return (
    <BaseIntlProvider locale={locale} messages={messages} timeZone="UTC">
      {children}
    </BaseIntlProvider>
  )
}
