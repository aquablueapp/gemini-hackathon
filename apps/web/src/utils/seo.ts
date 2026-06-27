import { defaultLocale as appDefaultLocale, supportedLocales as appLocales } from '~/lib/i18n/shared'

const SITE_URL = import.meta.env.VITE_APP_URL || 'http://localhost:3000'
const SITE_NAME = 'Aquablue'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`
const TWITTER_SITE = '@aquablue'

interface SeoOptions {
  title: string
  description?: string
  keywords?: string
  image?: string
  pathname?: string
  locale?: string
  ogType?: string
}

const supportedLocales = appLocales
const defaultLocale = appDefaultLocale

function buildUrl(pathname: string, locale?: string): string {
  const cleanPath = pathname === '/' ? '' : pathname
  if (!locale || locale === defaultLocale) {
    return `${SITE_URL}${cleanPath || '/'}`
  }
  return `${SITE_URL}/${locale}${cleanPath}`
}

export function seo({
  title,
  description,
  keywords,
  image,
  pathname = '/',
  locale,
  ogType = 'website',
}: SeoOptions) {
  const resolvedImage = image || DEFAULT_OG_IMAGE
  const canonicalUrl = buildUrl(pathname, locale)
  const ogLocale = locale || defaultLocale

  const meta = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { property: 'og:type', content: ogType },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: canonicalUrl },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:locale', content: ogLocale },
    { property: 'og:image', content: resolvedImage },
    { name: 'twitter:card', content: image ? 'summary_large_image' : 'summary' },
    { name: 'twitter:site', content: TWITTER_SITE },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: resolvedImage },
  ].filter(tag => 'content' in tag && !!tag.content)

  const links = [
    { rel: 'canonical', href: canonicalUrl },
    ...supportedLocales.map(l => ({
      rel: 'alternate',
      hrefLang: l,
      href: buildUrl(pathname, l),
    })),
    { rel: 'alternate', hrefLang: 'x-default', href: buildUrl(pathname) },
  ]

  return { meta, links }
}
