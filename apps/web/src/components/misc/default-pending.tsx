import { Loader2 } from 'lucide-react'

export function DefaultPending() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] w-full p-8 text-center gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <h2 className="text-xl font-bold mt-4">Loading...</h2>
      <p className="text-stone-500 max-w-md">Please wait while we prepare your content.</p>
    </div>
  )
}
