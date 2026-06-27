import type { Messages } from './lib/i18n/messages'
import type { Locale } from './lib/i18n/shared'
/**
 * Server Entry：始终返回 Promise<Response>，避免 Worker 对 undefined 调用 .then() 报错
 *
 * 原因：createStartHandler()(request) 在 Worker 环境下可能同步抛错或返回 undefined，
 * 若未 catch，上层会拿到 undefined 并对它 .then() 导致 "Cannot read properties of undefined (reading 'then')"
 */
import {
  createStartHandler,
  defaultStreamHandler,
  defineHandlerCallback,
} from '@tanstack/react-start/server'
import { createServerEntry } from '@tanstack/react-start/server-entry'
import en from './lib/i18n/messages/en'
import ja from './lib/i18n/messages/ja'
import ko from './lib/i18n/messages/ko'
import zhCn from './lib/i18n/messages/zh-CN'
import zhTw from './lib/i18n/messages/zh-TW'
import { createCookieHeader, handleLocaleMiddleware } from './lib/i18n/server'

import { defaultLocale, normalizeLocale, supportedLocales } from './lib/i18n/shared'

/**
 * 处理 i18n API 请求
 * 路径: /api/i18n/$locale
 */
async function handleI18nApi(request: Request): Promise<Response | null> {
  const url = new URL(request.url)

  if (request.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Allow': 'GET',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const match = /^\/api\/i18n\/([a-z]{2}(?:-[A-Za-z]{2})?)$/.exec(url.pathname)
  if (!match) {
    return null
  }

  const locale = normalizeLocale(match[1])
  if (!locale) {
    return new Response(JSON.stringify({ error: 'Invalid locale' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  const messages: Record<Locale, Messages> = {
    'zh-CN': zhCn as any,
    'zh-TW': zhTw as any,
    'en': en as any,
    'ja': ja as any,
    'ko': ko as any,
  }

  const cacheControl = import.meta.env.DEV
    ? 'no-store'
    : 'public, max-age=3600, s-maxage=3600'

  return new Response(JSON.stringify(messages[locale]), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
      'Vary': 'Accept-Language',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function fallback500(): Response {
  return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
    status: 500,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

/**
 * SEO 静态端点：robots.txt / sitemap.xml / llms.txt
 */
const SITE_URL = 'https://www.bukai.ai'
const SUPPORTED_LOCALES = supportedLocales
const DEFAULT_LOCALE = defaultLocale

const PUBLIC_PATHS = [
  '/',
  '/discovery',
]

function handleSeoEndpoints(request: Request): Response | null {
  const url = new URL(request.url)

  if (url.pathname === '/robots.txt') {
    const body = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /auth/
Disallow: /api/
Disallow: /logout

Sitemap: ${SITE_URL}/sitemap.xml
`
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  if (url.pathname === '/sitemap.xml') {
    const urls = PUBLIC_PATHS.map((path) => {
      const cleanPath = path === '/' ? '' : path
      const alternates = SUPPORTED_LOCALES.map((locale) => {
        const href = locale === DEFAULT_LOCALE
          ? `${SITE_URL}${cleanPath || '/'}`
          : `${SITE_URL}/${locale}${cleanPath}`
        return `    <xhtml:link rel="alternate" hreflang="${locale}" href="${href}" />`
      }).join('\n')
      const xDefault = `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE_URL}${cleanPath || '/'}" />`

      return `  <url>
    <loc>${SITE_URL}${cleanPath || '/'}</loc>
${alternates}
${xDefault}
    <changefreq>weekly</changefreq>
  </url>`
    }).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }

  if (url.pathname === '/llms.txt') {
    const body = `# Aquablue
> A modern Edge-native full-stack aquablue built with Hono and TanStack Start.

## Key Pages
- [Home](${SITE_URL}/): Welcome page
- [Admin](${SITE_URL}/admin): Admin control panel
`
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  }

  return null
}

/**
 * 自定义 handler：在 defaultStreamHandler 前执行 SEO 端点、i18n API、locale 重定向与 cookie
 * @see https://tanstack.com/start/latest/docs/framework/react/guide/server-entry-point
 */
const customHandler = defineHandlerCallback((ctx) => {
  return (async () => {
    const request = (ctx as { request: Request }).request

    // SEO static endpoints (robots.txt, sitemap.xml, llms.txt)
    const seoResponse = handleSeoEndpoints(request)
    if (seoResponse)
      return seoResponse

    const i18nResponse = await handleI18nApi(request)
    if (i18nResponse)
      return i18nResponse
    const { redirect, setCookie } = handleLocaleMiddleware(request)
    if (redirect)
      return redirect
    const streamResult = await defaultStreamHandler(ctx)
    if (streamResult == null) {
      console.error('defaultStreamHandler returned null/undefined')
      return fallback500()
    }

    let response: Response
    if (streamResult instanceof Response) {
      response = streamResult
    }
    else if (
      typeof streamResult === 'object'
      && 'response' in streamResult
      && streamResult.response instanceof Response
    ) {
      response = streamResult.response
    }
    else {
      console.error('defaultStreamHandler returned invalid response format:', streamResult)
      return fallback500()
    }

    if (setCookie) {
      const cookieValue = createCookieHeader(setCookie.name, setCookie.value)
      response.headers.append('Set-Cookie', cookieValue)
    }
    return response
  })()
})

const startHandler = createStartHandler(customHandler)

const entry = createServerEntry({
  fetch(request: Request): Promise<Response> {
    let result: Response | Promise<Response> | undefined
    try {
      result = startHandler(request)
    }
    catch (e) {
      console.error('SSR Entry handler sync crash:', e)
      return Promise.resolve(fallback500())
    }
    return Promise.resolve(result).then(
      r => (r != null && r instanceof Response ? r : fallback500()),
      (e) => {
        console.error('SSR Entry handler async crash:', e)
        return fallback500()
      },
    )
  },
})

export default entry
