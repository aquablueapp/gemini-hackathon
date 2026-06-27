// import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { DefaultCatchBoundary } from '~/components/errors/default-catch-boundary'
import { NotFound404 } from '~/components/errors/not-found-404'
import { DefaultPending } from '~/components/misc/default-pending'
import { getQueryClient } from '~/lib/query-client-singleton'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const queryClient = getQueryClient()

  const router = createRouter({
    routeTree,
    context: {
      queryClient: queryClient as any,
    },
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultErrorComponent: ({ error, reset }) => (
      <DefaultCatchBoundary error={error} reset={reset} />
    ),
    defaultNotFoundComponent: () => <NotFound404 />,
    defaultPendingComponent: () => <DefaultPending />,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
