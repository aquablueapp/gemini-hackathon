import type { QueryClient } from '@tanstack/react-query'
import type { Locale } from '~/lib/i18n/shared'
import { QueryClientProvider } from '@tanstack/react-query'
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from '@tanstack/react-router'
import * as React from 'react'
import { Toaster } from 'sonner'
// Aquablue 错误边界预留，如果您有自定义的组件请替换，这里用原生 fallback
import { DefaultCatchBoundary } from '~/components/errors/default-catch-boundary'
import { NotFound404 } from '~/components/errors/not-found-404'
import { DefaultPending } from '~/components/misc/default-pending'
import { ThemeProvider } from '~/components/providers/theme-provider'

import { IntlProvider as BaseIntlProvider, getCurrentLocale, loadMessages } from '~/lib/i18n/client'
import { defaultLocale } from '~/lib/i18n/shared'
import appCss from '~/styles/app.css?url'

interface RouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  loader: async () => {
    let locale: Locale = defaultLocale
    try {
      locale = getCurrentLocale()
    }
    catch (e) {
      // Ignore
    }
    const messages = await loadMessages(locale)
    const apiUrl = typeof window === 'undefined'
      ? (process.env.PUBLIC_API_URL || process.env.VITE_API_URL || process.env.API_URL || '')
      : ((window as any).__API_URL__ || '')
    return {
      locale,
      messages,
      apiUrl,
    }
  },
  errorComponent: props => (
    <RootDocumentForError>
      <DefaultCatchBoundary {...props} />
    </RootDocumentForError>
  ),
  notFoundComponent: () => (
    <RootDocumentForError>
      <NotFound404 />
    </RootDocumentForError>
  ),
  pendingComponent: () => (
    <RootDocumentForError>
      <DefaultPending />
    </RootDocumentForError>
  ),
  component: RootComponent,
})

function RootComponent() {
  const { locale, messages, apiUrl } = Route.useLoaderData()
  const { queryClient } = Route.useRouteContext()

  if (typeof window !== 'undefined' && apiUrl) {
    (window as any).__API_URL__ = apiUrl
  }

  return (
    <RootDocument locale={locale} apiUrl={apiUrl}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <BaseIntlProvider locale={locale} messages={messages} timeZone="UTC">
            <Outlet />
            <Toaster richColors position="top-right" />
          </BaseIntlProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </RootDocument>
  )
}

/**
 * 专用于错误和 404 页面的根文档。
 * 在 SSR 期间发生错误时，如果试图执行动态 Locale 探测（getCurrentLocale），
 * 很容易发生 Context 缺失或引发 Hydration 失败。
 * 所以错误页严格使用 defaultLocale 兜底。
 */
function RootDocumentForError({ children }: { children: React.ReactNode }) {
  return (
    <html lang={defaultLocale} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <React.Suspense fallback={<div>Loading...</div>}>
          {children}
        </React.Suspense>
        <Scripts />
      </body>
    </html>
  )
}

/**
 * 正常页面的根文档，负责执行正常的国际化探嗅。
 */
function RootDocument({ children, locale, apiUrl }: { children: React.ReactNode, locale: Locale, apiUrl?: string }) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <HeadContent />
        {apiUrl && (
          <script dangerouslySetInnerHTML={{ __html: `window.__API_URL__ = ${JSON.stringify(apiUrl)};` }} />
        )}
      </head>
      <body>
        <React.Suspense fallback={<div>Loading...</div>}>
          {children}
        </React.Suspense>
        <Scripts />
      </body>
    </html>
  )
}
