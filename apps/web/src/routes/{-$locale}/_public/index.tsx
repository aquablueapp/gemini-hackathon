import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { useTranslations } from 'use-intl'
import { LocalizedLink } from '~/components/common/localized-link'
import { Button } from '~/components/ui/button'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { getCookie } from '~/lib/cookies'
import { seo } from '~/utils/seo'
import { getPageMeta } from '~/utils/seo-meta'

export const Route = createFileRoute('/{-$locale}/_public/')({
  head: ({ params }: any) => {
    const locale = params.locale
    const meta = getPageMeta('/', locale)
    return seo({
      ...meta,
      pathname: '/',
      locale,
    })
  },
  component: HomePage,
})

function HomePage() {
  const t = useTranslations('HomePage')
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  React.useEffect(() => {
    const session = getCookie('auth_session')
    setIsLoggedIn(session === 'demo_logged_in')
  }, [])

  return (
    <main className="flex-1 flex flex-col items-center justify-center py-12 md:py-24 relative overflow-hidden bg-gradient-to-b from-[#edf7ff] via-white to-[#d8ecff]/20 dark:from-[#0f161f] dark:via-stone-950 dark:to-stone-950">

      {/* Background Decorative Gradient Circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-cyan-400/5 dark:bg-cyan-600/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Hero Section */}
      <section className="relative z-10 w-full max-w-4xl mx-auto text-center px-4 flex flex-col items-center gap-6 mb-16 md:mb-24">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#d8ecff]/60 dark:bg-blue-900/40 text-blue-750 dark:text-blue-400 border border-[#a5b4c3]/40 dark:border-blue-800/30 animate-pulse">
          🚀 Shinjuku Hackathon Project
        </div>
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight leading-none bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 bg-clip-text text-transparent">
          {t('title') || 'aquablue'}
        </h1>
        <p className="text-lg md:text-xl text-stone-500 dark:text-stone-400 max-w-2xl font-medium leading-relaxed">
          {t('subtitle') || 'Intelligent task planning and secure custom workflows.'}
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-4">
          <LocalizedLink to={isLoggedIn ? '/dashboard' : '/login'} className="block">
            <Button size="lg" className="font-bold px-8 py-6 rounded-2xl shadow-lg shadow-blue-500/20 dark:shadow-blue-900/10 hover:shadow-xl hover:shadow-blue-500/30 dark:hover:shadow-blue-900/25 transition-all bg-gradient-to-b from-[#6ca7ff] to-[#4384e7] hover:opacity-95 text-white border-0 active:scale-95 text-base">
              {t('getStarted') || 'Get Started'}
            </Button>
          </LocalizedLink>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-4 mb-8">

        {/* Feature 1 */}
        <Card className="p-8 border border-[#d9e1e8] dark:border-[#223145] bg-white/85 dark:bg-[#131d28]/60 backdrop-blur-md rounded-3xl transition-all hover:-translate-y-1 hover:shadow-sm shadow-2xs">
          <CardHeader className="flex flex-col gap-3 p-0">
            <div className="w-12 h-12 bg-[#b28a58] rounded-2xl flex items-center justify-center text-2xl text-white shadow-xs">⚡️</div>
            <h2 className="text-xl font-bold tracking-tight text-stone-850 dark:text-stone-100">
              {t('fastTitle') || 'Fast by default'}
            </h2>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
              {t('fastDesc') || 'Powered by Vite and Cloudflare Workers for extreme deployment efficiency.'}
            </p>
          </CardContent>
        </Card>

        {/* Feature 2 */}
        <Card className="p-8 border border-[#d9e1e8] dark:border-[#223145] bg-white/85 dark:bg-[#131d28]/60 backdrop-blur-md rounded-3xl transition-all hover:-translate-y-1 hover:shadow-sm shadow-2xs">
          <CardHeader className="flex flex-col gap-3 p-0">
            <div className="w-12 h-12 bg-[#8b5a33] rounded-2xl flex items-center justify-center text-2xl text-white shadow-xs">🔒</div>
            <h2 className="text-xl font-bold tracking-tight text-stone-850 dark:text-stone-100">
              {t('secureTitle') || 'Secure Sandbox'}
            </h2>
          </CardHeader>
          <CardContent className="p-0 pt-4">
            <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">
              {t('secureDesc') || 'Type-safe workflows executed safely inside constrained sandboxes.'}
            </p>
          </CardContent>
        </Card>

      </section>
    </main>
  )
}
