import * as React from 'react'
import { useTranslations } from 'use-intl'
import { LocaleSwitcher } from '~/components/common/locale-switcher'
import { LocalizedLink } from '~/components/common/localized-link'
import { ModeToggle } from '~/components/common/mode-toggle'
import { Button } from '~/components/ui/button'
import { getCookie, removeCookie } from '~/lib/cookies'

export function SaasPublicLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('HomePage')
  const [isLoggedIn, setIsLoggedIn] = React.useState(false)

  React.useEffect(() => {
    const session = getCookie('auth_session')
    setIsLoggedIn(session === 'demo_logged_in')
  }, [])

  const handleSignOut = () => {
    removeCookie('auth_session')
    setIsLoggedIn(false)
    window.location.href = '/'
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-stone-200/80 dark:border-stone-800/80 bg-stone-50/80 dark:bg-stone-950/80 backdrop-blur-md">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <LocalizedLink to="/" className="flex items-center gap-2 font-black text-xl tracking-tight select-none">
            <span className="text-2xl text-blue-500">⚡️</span>
            <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">aquablue</span>
          </LocalizedLink>

          {/* Center Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-stone-600 dark:text-stone-300">
            <LocalizedLink to="/" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('features') || 'Features'}
            </LocalizedLink>
            <LocalizedLink to="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {t('aboutUs') || 'About Us'}
            </LocalizedLink>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            <ModeToggle />
            <LocaleSwitcher />

            <LocalizedLink to="/dashboard">
              <Button size="sm" className="font-bold px-4 rounded-xl shadow-sm transition-all active:scale-[0.98] bg-blue-600 hover:bg-blue-700 text-white border-0">
                {t('console') || 'Console'}
              </Button>
            </LocalizedLink>
          </div>
        </div>
      </header>

      {/* Main content body */}
      <main className="flex-1 flex flex-col w-full">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-stone-200 dark:border-stone-800 bg-stone-100/50 dark:bg-stone-900/10 py-8">
        <div className="container mx-auto max-w-6xl px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-1.5 font-bold text-sm tracking-tight text-stone-700 dark:text-stone-300">
              <span>⚡️</span>
              <span>aquablue</span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md">
              Designed by the Tokyo Shinjuku Team for the June 27th Hackathon.
            </p>
          </div>
          <div className="text-xs text-stone-400 dark:text-stone-500">
            &copy;
            {' '}
            {new Date().getFullYear()}
            {' '}
            aquablue. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
