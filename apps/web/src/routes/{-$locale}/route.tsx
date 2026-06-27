import { createFileRoute, notFound, Outlet } from '@tanstack/react-router'
import { isValidLocale } from '~/lib/i18n/shared'

export const Route = createFileRoute('/{-$locale}')({
  beforeLoad: ({ params }) => {
    const locale = params.locale
    // 如果提供了非法 locale，显示 404 错误
    if (locale && !isValidLocale(locale)) {
      throw notFound()
    }
    return { locale }
  },
  component: Outlet,
})
