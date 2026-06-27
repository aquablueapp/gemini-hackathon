import type { ComponentProps } from 'react'
import type { Locale } from '~/lib/i18n/shared'
import type { FileRouteTypes } from '~/routeTree.gen'
import { Link, useParams } from '@tanstack/react-router'
import { defaultLocale } from '~/lib/i18n/shared'

type AllTo = FileRouteTypes['to']
type StripLocalePrefix<T extends string> = T extends '/{-$locale}' ? '/' : T extends `/{-$locale}${infer Rest}` ? Rest : T
export type LocalizedTo = StripLocalePrefix<AllTo> | (string & {})

type LinkProps = ComponentProps<typeof Link>
interface LocalizedLinkProps extends Omit<LinkProps, 'to' | 'params'> {
  to: LocalizedTo
  params?: Record<string, any>
}

export function LocalizedLink({ to, params, ...props }: LocalizedLinkProps) {
  const routeParams = useParams({ strict: false })
  const locale = (routeParams.locale as Locale | undefined) ?? defaultLocale
  const defaultLocaleValue = defaultLocale

  const toString = to as string
  const isPrefixed = toString.startsWith('/{-$locale}')
  let fullPath: string = toString

  if (!isPrefixed) {
    const localizedAttempt = toString === '/' ? '/{-$locale}' : `/{-$locale}${toString}`
    const globalPaths = ['/auth', '/dashboard']
    const isGlobal = globalPaths.some(p => toString.startsWith(p))
    if (!isGlobal) {
      fullPath = localizedAttempt
    }
  }

  const needsLocaleParam = fullPath.includes('{-$locale}')
  const finalParams = {
    ...(params || {}),
    ...(needsLocaleParam && locale !== defaultLocaleValue ? { locale } : {}),
  }

  return <Link {...(props as any)} to={fullPath as any} params={finalParams as any} />
}
