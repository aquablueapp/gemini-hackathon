import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { toast } from 'sonner'
import { useTranslations } from 'use-intl'
import { PremiumLoginCard } from '~/components/ui/premium-login-card'
import { setCookie } from '~/lib/cookies'
import { seo } from '~/utils/seo'
import { getPageMeta } from '~/utils/seo-meta'

export const Route = createFileRoute('/{-$locale}/_public/login')({
  head: ({ params }: any) => {
    const locale = params.locale
    const meta = getPageMeta('/login', locale)
    return seo({
      ...meta,
      pathname: '/login',
      locale,
    })
  },
  component: LoginPage,
})

function LoginPage() {
  const t = useTranslations('login')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleLoginSubmit = (email: string, password: string) => {
    setLoading(true)
    setError(null)

    // Simulate mock cookie sign-in validation matching old demo logic
    setTimeout(() => {
      // Retain the prefilled credentials logic ('test' / 'test234')
      if (email === 'test' || email === 'test@example.com' || (email === 'test' && password === 'test234')) {
        setCookie('auth_session', 'demo_logged_in', 60 * 60 * 24 * 7)
        toast.success('Signed in successfully!')
        window.location.href = '/dashboard'
      }
      else {
        setError(t('loginError') || 'Invalid username or password')
        setLoading(false)
      }
    }, 600)
  }

  const handleSocialLogin = (provider: string) => {
    toast.success(`Signing in with ${provider}...`)
    // Mock successful OAuth flow redirect
    setTimeout(() => {
      setCookie('auth_session', 'demo_logged_in', 60 * 60 * 24 * 7)
      window.location.href = '/dashboard'
    }, 450)
  }

  return (
    <main className="flex-1 flex items-center justify-center py-16 md:py-24 bg-gradient-to-b from-[#edf7ff] via-white to-[#d8ecff]/20 dark:from-[#0f161f] dark:via-stone-950 dark:to-stone-950 px-4 relative">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/10 dark:bg-blue-600/5 rounded-full blur-3xl pointer-events-none z-0" />

      <PremiumLoginCard
        onSubmit={handleLoginSubmit}
        onSocialLogin={handleSocialLogin}
        isLoading={loading}
        error={error}
        className="relative z-10"
      />
    </main>
  )
}
