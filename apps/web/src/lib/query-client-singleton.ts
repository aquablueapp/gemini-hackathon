import * as Sentry from '@sentry/react'
import { QueryClient } from '@tanstack/react-query'
import { CACHE_CONFIG } from './cache-config'

let queryClientInstance: QueryClient | null = null

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: CACHE_CONFIG.session.staleTime,
        gcTime: CACHE_CONFIG.session.gcTime,
        refetchOnWindowFocus: import.meta.env.PROD,
        retry: (failureCount, error) => {
          if (import.meta.env.DEV) {
            console.warn({ failureCount, error })
          }
          else {
            Sentry.addBreadcrumb({
              category: 'query_retry',
              message: 'Query failed and will retry or fail',
              level: 'warning',
              data: { failureCount, error_message: error instanceof Error ? error.message : String(error) },
            })
          }

          if (failureCount >= 0 && import.meta.env.DEV)
            return false
          if (failureCount > 3 && import.meta.env.PROD)
            return false

          return true
        },
      },
    },
  })
}

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always create a new QueryClient per request to prevent cross-request data leaks and serialisation deadlocks
    return createQueryClient()
  }

  // Client: reuse client-side singleton instance
  if (!queryClientInstance) {
    queryClientInstance = createQueryClient()
  }
  return queryClientInstance
}
