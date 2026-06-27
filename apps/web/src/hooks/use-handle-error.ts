import type { Locale } from '~/lib/i18n/shared'
import * as Sentry from '@sentry/react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { useLocale } from 'use-intl'
import { AUTH_ROUTES, getAuthRoute } from '~/lib/auth/routes'
import { extractErrorCode, getErrorMessage } from '~/lib/handle-server-error'

export function useHandleError() {
  const locale = useLocale() as Locale
  const navigate = useNavigate()

  return (error: unknown) => {
    // 获取 HTTP 状态
    let status: number | null = null
    if (error && typeof error === 'object' && 'response' in error) {
      status = (error as any).response?.status
    }

    const errorCode = extractErrorCode(error)

    Sentry.captureException(error, {
      extra: {
        source: 'use_handle_error',
        status,
        errorCode,
      },
    })

    if (status === 401) {
      toast.error(getErrorMessage(locale, 'unauthorized'))
      const redirect = typeof window !== 'undefined' ? window.location.href : ''
      navigate({
        to: `${getAuthRoute(AUTH_ROUTES.signIn)}` as any,
        search: ((prev: any) => ({ ...prev, redirect })) as any,
        replace: true,
      })
      return
    }

    if (status === 403) {
      toast.error(getErrorMessage(locale, 'forbidden'))
      return
    }

    const errMsg = getErrorMessage(locale, errorCode)
    toast.error(errMsg)
  }
}
