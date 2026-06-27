interface PageMeta {
  title: string
  description: string
}

export function getPageMeta(pathname: string, locale?: string): PageMeta {
  // Return generic aquablue metas
  return {
    title: 'Aquablue — Full-Stack Edge-Native Aquablue',
    description: 'A modern, type-safe full-stack aquablue based on Hono and TanStack Start.',
  }
}
