import { LocalizedLink } from '~/components/common/localized-link'

export function Footer() {
  return (
    <footer className="border-t border-divider/40 bg-background mt-auto">
      <div className="mx-auto max-w-6xl px-4 lg:px-6">
        <div className="flex flex-col gap-8 py-10 md:flex-row md:justify-between">
          <div className="flex flex-col gap-3 max-w-xs">
            <LocalizedLink to="/" className="inline-flex items-center gap-2 font-semibold text-foreground">
              <span className="text-lg font-bold tracking-tight">Aquablue</span>
            </LocalizedLink>
            <p className="text-sm text-stone-500 leading-relaxed">
              A modern Edge-native full-stack aquablue built with Hono and TanStack Start.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
          </div>
        </div>

        <div className="h-px bg-divider/40" />

        <div className="flex flex-wrap items-center justify-between gap-4 py-5">
          <p className="text-xs text-stone-500">
            &copy;
            {' '}
            {new Date().getFullYear()}
            {' '}
            Aquablue. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
