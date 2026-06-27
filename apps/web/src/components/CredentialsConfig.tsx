import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Key, Lock, Plus, ShieldCheck } from 'lucide-react'
import * as React from 'react'
import { getApiBaseUrl } from '~/lib/api-client'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Label } from './ui/label'

export function CredentialsConfig() {
  const queryClient = useQueryClient()
  const [service, setService] = React.useState('')
  const [secret, setSecret] = React.useState('')
  const [successMsg, setSuccessMsg] = React.useState<string | null>(null)

  // Fetch configured credentials (metadata list of services)
  const { data: configured = [], isLoading } = useQuery<string[]>({
    queryKey: ['credentials'],
    queryFn: async () => {
      const res = await fetch(`${getApiBaseUrl()}/credentials`)
      if (!res.ok)
        throw new Error('Failed to fetch credentials')
      return res.json()
    },
  })

  // Save credential mutation
  const saveMutation = useMutation({
    mutationFn: async (payload: { service: string, secret: string }) => {
      const res = await fetch(`${getApiBaseUrl()}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok)
        throw new Error('Failed to save credential')
      return res.json() as Promise<{ success: boolean }>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] })
      setSuccessMsg(`Credential for "${service}" successfully encrypted and stored.`)
      setService('')
      setSecret('')
      setTimeout(() => setSuccessMsg(null), 5000)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!service.trim() || !secret.trim())
      return
    saveMutation.mutate({
      service: service.trim().toLowerCase(),
      secret: secret.trim(),
    })
  }

  // Pre-configured typical services for quick selection
  const typicalServices = ['gmail', 'google', 'polymarket', 'openai', 'anthropic']

  return (
    <Card className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
      <CardHeader className="border-b border-stone-100 dark:border-stone-850 p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-xl font-black">Credential Manager</CardTitle>
            <CardDescription className="text-stone-500 text-xs">
              Securely encrypt and inject tokens or API keys into sandboxed subprocesses.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 flex flex-col gap-6">
        {/* Active credentials list */}
        <div>
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Active Service Connections
          </h3>
          {isLoading
            ? (
                <div className="text-xs text-stone-400 font-mono animate-pulse">Loading connections...</div>
              )
            : configured.length === 0
              ? (
                  <div className="text-xs text-stone-500 py-3 px-4 bg-stone-50 dark:bg-stone-950/30 rounded-lg border border-stone-150 dark:border-stone-850">
                    No service keys or OAuth credentials bound yet.
                  </div>
                )
              : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {configured.map(svc => (
                      <div
                        key={svc}
                        className="flex items-center justify-between px-3 py-2 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-900/30 rounded-lg text-xs"
                      >
                        <span className="font-mono font-bold capitalize text-stone-700 dark:text-stone-300">{svc}</span>
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          <span>Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 border-t border-stone-100 dark:border-stone-850 pt-6">
          <h3 className="text-sm font-bold text-stone-800 dark:text-stone-200 flex items-center gap-2">
            <Plus className="w-4 h-4 text-amber-500" />
            Bind New Secret Key
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="service-name" className="text-xs font-bold text-stone-600 dark:text-stone-400">
                Service Identifier
              </Label>
              <Input
                id="service-name"
                value={service}
                onChange={e => setService(e.target.value)}
                placeholder="e.g. gmail, openai"
                className="text-xs font-mono"
                required
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                {typicalServices.map(svc => (
                  <button
                    key={svc}
                    type="button"
                    onClick={() => setService(svc)}
                    className="px-2 py-0.5 text-[10px] bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-750 text-stone-600 dark:text-stone-400 rounded transition-colors"
                  >
                    {svc}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="secret-value" className="text-xs font-bold text-stone-600 dark:text-stone-400">
                Credential Secret (OAuth Token / API Key)
              </Label>
              <Input
                id="secret-value"
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder="••••••••••••••••••••••••"
                className="text-xs font-mono"
                required
              />
            </div>
          </div>

          {successMsg && (
            <div className="text-xs p-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-200/50 dark:border-emerald-900/30 font-medium">
              {successMsg}
            </div>
          )}

          <Button
            type="submit"
            disabled={saveMutation.isPending || !service || !secret}
            className="w-full flex items-center justify-center gap-2 text-xs py-2 bg-stone-900 hover:bg-stone-800 text-stone-100 dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900 font-bold"
          >
            <Key className="w-4 h-4" />
            {saveMutation.isPending ? 'Encrypting & Storing...' : 'Secure & Save Key'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
