import type { AppType } from 'api/client'
import * as Sentry from '@sentry/react'
import { hc } from 'hono/client'

export function getApiBaseUrl(): string {
  // Use globalThis.process to bypass Vite compile-time static env replacement
  const g = globalThis as any
  const runtimeApiUrl = g.process?.env?.API_URL || g.process?.env?.VITE_API_URL
  if (runtimeApiUrl) {
    return runtimeApiUrl
  }
  if (typeof window !== 'undefined') {
    // @ts-ignore
    if (window.__API_URL__) {
      // @ts-ignore
      return window.__API_URL__
    }
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:7667'
}

const API_BASE_URL = getApiBaseUrl()

export type Client = ReturnType<typeof hc<AppType>>

export function hcWithType(...args: Parameters<typeof hc>): Client {
  return hc<AppType>(...args)
}

async function globalInterceptorFetch(input: RequestInfo | URL, init?: RequestInit) {
  let targetInput = input
  if (typeof window !== 'undefined') {
    const dynamicBase = getApiBaseUrl()
    if (dynamicBase && !dynamicBase.includes('localhost:7667')) {
      if (typeof input === 'string') {
        if (input.startsWith('http://localhost:7667')) {
          targetInput = input.replace('http://localhost:7667', dynamicBase)
        }
      }
      else if (input instanceof URL) {
        if (input.href.startsWith('http://localhost:7667')) {
          targetInput = new URL(input.href.replace('http://localhost:7667', dynamicBase))
        }
      }
      else if (input instanceof Request) {
        if (input.url.startsWith('http://localhost:7667')) {
          const newUrl = input.url.replace('http://localhost:7667', dynamicBase)
          targetInput = new Request(newUrl, input)
        }
      }
    }
  }

  const response = await fetch(targetInput, init)
  if (!response.ok) {
    const apiRequestId = response.headers.get('X-Request-Id')
    Sentry.addBreadcrumb({
      category: 'api_call',
      message: `API request failed: ${response.status}`,
      level: 'error',
      data: { api_request_id: apiRequestId, url: targetInput.toString(), status: response.status },
    })
  }
  return response
}

export function createAuthenticatedFetch(signal?: AbortSignal) {
  if (!signal) {
    return globalInterceptorFetch
  }
  return (input: RequestInfo | URL, init?: RequestInit) =>
    globalInterceptorFetch(input, {
      ...init,
      signal,
    })
}

export const apiClient = hcWithType(API_BASE_URL, {
  fetch: globalInterceptorFetch,
})

export const authApiClient = hcWithType(API_BASE_URL, {
  fetch: globalInterceptorFetch,
})
