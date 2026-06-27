import type { ErrorComponentProps } from '@tanstack/react-router'
import * as Sentry from '@sentry/react'
import { rootRouteId, useMatch, useRouter } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import * as React from 'react'
import { LocalizedLink } from '~/components/common/localized-link'
import { Button } from '~/components/ui/button'

const PRIMARY_ORB_HORIZONTAL_OFFSET = 40
const PRIMARY_ORB_VERTICAL_OFFSET = 20

function DefaultCatchBoundaryBase({ error, reset }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({ strict: false, select: state => state.id === rootRouteId })

  if (import.meta.env.DEV)
    console.warn(error)
  else
    Sentry.captureException(error)

  const handleReset = React.useCallback(() => {
    if (reset)
      reset()
    else router.invalidate()
  }, [reset, router])

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1),transparent_70%)] text-foreground">
      <div aria-hidden className="-z-10 absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ x: [0, PRIMARY_ORB_HORIZONTAL_OFFSET, -PRIMARY_ORB_HORIZONTAL_OFFSET, 0], y: [0, PRIMARY_ORB_VERTICAL_OFFSET, -PRIMARY_ORB_VERTICAL_OFFSET, 0], rotate: [0, 10, -10, 0] }}
          className="absolute top-1/2 left-1/3 size-90 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 blur-3xl"
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 4, ease: 'easeInOut' }}
        />
        <motion.div
          animate={{ x: [0, -PRIMARY_ORB_HORIZONTAL_OFFSET, PRIMARY_ORB_HORIZONTAL_OFFSET, 0], y: [0, -PRIMARY_ORB_VERTICAL_OFFSET, PRIMARY_ORB_VERTICAL_OFFSET, 0] }}
          className="absolute right-1/4 bottom-1/3 size-120 rounded-full bg-gradient-to-br from-indigo-400/10 to-pink-400/10 blur-3xl"
          transition={{ repeat: Number.POSITIVE_INFINITY, duration: 4, ease: 'easeInOut' }}
        />
      </div>

      <div className="flex flex-col items-center text-center p-8 max-w-xl mx-auto backdrop-blur-sm bg-white/50 dark:bg-stone-900/50 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-xl">
        <h1 className="font-extrabold text-8xl mb-4 bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
          500
        </h1>
        <p className="text-xl font-bold mb-2">Something went wrong</p>
        <p className="text-stone-500 mb-8">
          {import.meta.env.DEV ? (error.message || 'An unexpected error occurred.') : 'An unexpected error occurred. Our team has been notified.'}
        </p>
        <div className="flex gap-4">
          <Button variant="primary" onClick={handleReset}>Try Again</Button>
          {isRoot
            ? (
                <LocalizedLink to="/">
                  <Button variant="outline">Go Home</Button>
                </LocalizedLink>
              )
            : (
                <LocalizedLink to="/">
                  <Button variant="outline" onClick={(e: any) => { e.preventDefault(); window.history.back() }}>
                    Go Back
                  </Button>
                </LocalizedLink>
              )}
        </div>
      </div>
    </div>
  )
}

export function DefaultCatchBoundary({ error, reset }: ErrorComponentProps) {
  return <DefaultCatchBoundaryBase error={error} reset={reset} />
}
