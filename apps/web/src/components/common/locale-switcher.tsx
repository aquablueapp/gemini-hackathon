import { Check, Globe } from 'lucide-react'
import * as React from 'react'
import { useLocale } from 'use-intl'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { setLocaleCookie } from '~/lib/i18n/client'
import { defaultLocale, type Locale, localeNames, supportedLocales } from '~/lib/i18n/shared'

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale

  const handleAction = (locale: Locale) => {
    setLocaleCookie(locale)

    const newLocalePath = locale === defaultLocale ? '' : `/${locale}`
    const currentPath = window.location.pathname
    const regex = new RegExp(`^/(${supportedLocales.join('|')})`)
    let pathWithoutLocale = currentPath.replace(regex, '')
    if (!pathWithoutLocale.startsWith('/'))
      pathWithoutLocale = `/${pathWithoutLocale}`

    if (pathWithoutLocale.startsWith('/auth')) {
      window.location.reload()
      return
    }

    const newPath = `${newLocalePath}${pathWithoutLocale === '/' && newLocalePath !== '' ? '' : pathWithoutLocale}`
    window.location.href = newPath + window.location.search + window.location.hash
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Language selection">
          <Globe className="w-5 h-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {supportedLocales.map(locale => (
          <DropdownMenuItem
            key={locale}
            onSelect={() => handleAction(locale as Locale)}
            className="flex items-center justify-between min-w-[120px]"
          >
            <span>{localeNames[locale as Locale]}</span>
            {currentLocale === locale && <Check className="w-4 h-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
