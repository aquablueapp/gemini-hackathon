import * as Sentry from '@sentry/react'
import { StartClient } from '@tanstack/react-start/client'
import { startTransition, StrictMode } from 'react'

import { hydrateRoot } from 'react-dom/client'

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.1,
    release: import.meta.env.VITE_GIT_SHA,
    environment: import.meta.env.VITE_SENTRY_ENV || (import.meta.env.DEV ? 'development' : 'production'),
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  })
}

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
  )
})
