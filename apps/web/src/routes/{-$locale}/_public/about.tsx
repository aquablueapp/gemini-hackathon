import { createFileRoute } from '@tanstack/react-router'
import * as React from 'react'
import { useTranslations } from 'use-intl'
import { Card, CardContent, CardHeader } from '~/components/ui/card'
import { seo } from '~/utils/seo'
import { getPageMeta } from '~/utils/seo-meta'

export const Route = createFileRoute('/{-$locale}/_public/about')({
  head: ({ params }: any) => {
    const locale = params.locale
    const meta = getPageMeta('/about', locale)
    return seo({
      ...meta,
      pathname: '/about',
      locale,
    })
  },
  component: AboutPage,
})

function AboutPage() {
  const t = useTranslations('about')

  return (
    <main className="flex-1 py-16 md:py-24 bg-gradient-to-b from-[#edf7ff] via-white to-[#d8ecff]/20 dark:from-[#0f161f] dark:via-stone-950 dark:to-stone-950">
      <div className="container mx-auto max-w-3xl px-4 flex flex-col gap-12">

        {/* About Header */}
        <header className="text-center flex flex-col gap-4">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {t('title') || 'About Us'}
          </h1>
          <p className="text-stone-500 dark:text-stone-400 max-w-xl mx-auto font-medium">
            {t('subtitle') || 'Learn more about the team behind aquablue.'}
          </p>
        </header>

        {/* Content Cards */}
        <div className="flex flex-col gap-8">

          {/* Team Section */}
          <Card className="p-8 border border-[#d9e1e8] dark:border-[#223145] bg-white/85 dark:bg-[#131d28]/60 backdrop-blur-md rounded-3xl shadow-2xs">
            <CardHeader className="p-0 pb-4">
              <div className="text-stone-400 dark:text-stone-500 text-xs font-bold tracking-wider uppercase mb-1">
                👥 Who We Are
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
                {t('teamTitle') || 'Tokyo Shinjuku Hackathon Team'}
              </h2>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                {t('teamDesc') || 'We are a team of three participating in the Tokyo Shinjuku Hackathon on June 27th.'}
              </p>
            </CardContent>
          </Card>

          {/* Mission Section */}
          <Card className="p-8 border border-[#d9e1e8] dark:border-[#223145] bg-white/85 dark:bg-[#131d28]/60 backdrop-blur-md rounded-3xl shadow-2xs">
            <CardHeader className="p-0 pb-4">
              <div className="text-stone-400 dark:text-stone-500 text-xs font-bold tracking-wider uppercase mb-1">
                🎯 What We Build
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-stone-800 dark:text-stone-100">
                {t('missionTitle') || 'Our Mission'}
              </h2>
            </CardHeader>
            <CardContent className="p-0">
              <p className="text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                {t('missionDesc') || 'Our project, aquablue, intelligently plans and executes users\' daily tasks. We aim to provide secure, efficient, and custom-tailored workflows, allowing subsequent tasks to run with high automation, low latency, and minimal cost.'}
              </p>
            </CardContent>
          </Card>

        </div>
      </div>
    </main>
  )
}
