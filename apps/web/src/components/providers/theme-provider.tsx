import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { getCookie, removeCookie, setCookie } from '@/lib/cookies'

type Theme = 'dark' | 'light' | 'system'
type ResolvedTheme = Exclude<Theme, 'system'>

const DEFAULT_THEME = 'system'
const THEME_COOKIE_NAME = 'vite-ui-theme'
const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

interface ThemeProviderState {
  defaultTheme: Theme
  resolvedTheme: ResolvedTheme
  theme: Theme
  setTheme: (theme: Theme) => void
  resetTheme: () => void
}

const initialState: ThemeProviderState = {
  defaultTheme: DEFAULT_THEME,
  resolvedTheme: 'light',
  theme: DEFAULT_THEME,
  setTheme: () => null,
  resetTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = DEFAULT_THEME,
  storageKey = THEME_COOKIE_NAME,
  ...props
}: { children: React.ReactNode, defaultTheme?: Theme, storageKey?: string }) {
  const [theme, _setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined')
      return defaultTheme
    return (getCookie(storageKey) as Theme) || defaultTheme
  })

  const resolvedTheme = useMemo((): ResolvedTheme => {
    if (typeof window === 'undefined')
      return 'light'
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return theme as ResolvedTheme
  }, [theme])

  useEffect(() => {
    if (typeof window === 'undefined')
      return
    const root = window.document.documentElement
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = (currentResolvedTheme: ResolvedTheme) => {
      root.classList.remove('light', 'dark')
      root.classList.add(currentResolvedTheme)
    }

    const handleChange = () => {
      if (theme === 'system')
        applyTheme(mediaQuery.matches ? 'dark' : 'light')
    }

    applyTheme(resolvedTheme)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme, resolvedTheme])

  const setTheme = (newTheme: Theme) => {
    setCookie(storageKey, newTheme, THEME_COOKIE_MAX_AGE)
    _setTheme(newTheme)
  }

  const resetTheme = () => {
    removeCookie(storageKey)
    _setTheme(DEFAULT_THEME)
  }

  return (
    <ThemeProviderContext {...props} value={{ defaultTheme, resolvedTheme, resetTheme, theme, setTheme }}>
      {children}
    </ThemeProviderContext>
  )
}

export function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (!context)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
