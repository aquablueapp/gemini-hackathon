import * as React from 'react'

const LazyReactFlow = React.lazy(() => import('./ReactFlowWrapper'))

export function WorkflowGraph({ data }: { data: string }) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="w-full h-80 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 flex items-center justify-center text-xs text-stone-400 font-mono">
        Loading interactive workflow...
      </div>
    )
  }

  return (
    <React.Suspense fallback={(
      <div className="w-full h-80 rounded-xl bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-850 flex items-center justify-center text-xs text-stone-400 font-mono">
        Loading interactive workflow...
      </div>
    )}
    >
      <LazyReactFlow data={data} />
    </React.Suspense>
  )
}
