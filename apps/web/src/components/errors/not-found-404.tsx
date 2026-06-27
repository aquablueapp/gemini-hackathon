import { Link } from '@tanstack/react-router'
import { motion } from 'framer-motion'
import * as React from 'react'
import { useTranslations } from 'use-intl'
import { Button } from '~/components/ui/button'
import { getCurrentLocale } from '~/lib/i18n/client'
import { defaultLocale } from '~/lib/i18n/shared'
import { IntlProvider } from '../providers/intl-provider'

const PRIMARY_ORB_HORIZONTAL_OFFSET = 40
const PRIMARY_ORB_VERTICAL_OFFSET = 20

function NotFound404Base({ children }: { children?: React.ReactNode }) {
  const t = useTranslations()
  const locale = getCurrentLocale()

  const homePath = locale !== defaultLocale ? `/${locale}/` : '/'

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
        <h1 className="font-extrabold text-8xl mb-4 bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-xl font-bold mb-2">Page Not Found</p>
        <p className="text-stone-500 mb-8">{children || 'The page you are looking for does not exist.'}</p>
        <div className="flex gap-4">
          <Link to={homePath as any}>
            <Button>Go Home</Button>
          </Link>
          <Button
            variant="outline"
            onClick={(e: any) => {
              e.preventDefault()
              if (window.history.length > 1)
                window.history.back()
              else window.location.href = homePath
            }}
          >
            Go Back
          </Button>
        </div>
      </div>
    </div>
  )
}

export function NotFound404({ children }: { children?: React.ReactNode }) {
  return (
    <IntlProvider>
      <NotFound404Base>{children}</NotFound404Base>
    </IntlProvider>
  )
}
