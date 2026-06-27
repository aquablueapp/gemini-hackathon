import * as React from 'react'
import { LocaleSwitcher } from '~/components/common/locale-switcher'
import { LocalizedLink } from '~/components/common/localized-link'
import { ModeToggle } from '~/components/common/mode-toggle'
import { Button } from '~/components/ui/button'

export function Header() {
  return (
    <div className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-6">
          <LocalizedLink to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
            <span className="text-primary text-2xl">⚡️</span>
            <span>Aquablue</span>
          </LocalizedLink>
        </div>
        <div className="flex items-center gap-3">
          <ModeToggle />
          <LocaleSwitcher />
          <LocalizedLink to="/dashboard">
            <Button size="sm">Dashboard</Button>
          </LocalizedLink>
        </div>
      </div>
    </div>
  )
}
