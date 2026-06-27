'use client'

import { Check, Monitor, Moon, Sun } from 'lucide-react'
import * as React from 'react'
import { useTheme } from '~/components/providers/theme-provider'
import { Button } from '~/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          <Sun className="h-[20px] w-[20px] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[20px] w-[20px] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onSelect={() => setTheme('light')}
          className="flex items-center justify-between min-w-[120px]"
        >
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            <span>Light</span>
          </div>
          {theme === 'light' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme('dark')}
          className="flex items-center justify-between min-w-[120px]"
        >
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            <span>Dark</span>
          </div>
          {theme === 'dark' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => setTheme('system')}
          className="flex items-center justify-between min-w-[120px]"
        >
          <div className="flex items-center gap-2">
            <Monitor className="h-4 w-4" />
            <span>System</span>
          </div>
          {theme === 'system' && <Check className="h-4 w-4" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
