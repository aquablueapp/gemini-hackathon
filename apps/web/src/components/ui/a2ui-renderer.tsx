import * as React from 'react'
import { cn } from '~/utils/cn'
import { getApiBaseUrl } from '~/lib/api-client'

export interface A2uiPayload {
  type: string
  props: Record<string, any>
  children?: A2uiPayload[]
}

const CredentialFormBox: React.FC<{ service: string, title?: string, description?: string }> = ({
  service,
  title,
  description,
}) => {
  const [secret, setSecret] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [saved, setSaved] = React.useState(false)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!secret.trim())
      return

    setLoading(true)
    try {
      const res = await fetch(`${getApiBaseUrl()}/credentials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: service.toLowerCase(),
          secret: secret.trim(),
        }),
      })

      if (res.ok) {
        setSaved(true)
        setSecret('')
        import('sonner').then(({ toast }) => {
          toast.success(`Credential for ${service} saved and encrypted successfully!`)
        })
      }
      else {
        throw new Error('Failed to save')
      }
    }
    catch (err) {
      import('sonner').then(({ toast }) => {
        toast.error(`Error saving credential: ${err instanceof Error ? err.message : String(err)}`)
      })
    }
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="my-3 p-5 rounded-2xl border border-stone-200/85 bg-white/75 shadow-xs dark:border-stone-800/60 dark:bg-stone-950/60 backdrop-blur-xs text-left">
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </span>
        <h4 className="text-sm font-bold text-stone-900 dark:text-stone-50">
          {title || `Connect to ${service.toUpperCase()}`}
        </h4>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
        {description || `Please enter your API Key or OAuth Access Token for ${service} to securely store it in your Credentials Manager.`}
      </p>

      {saved
        ? (
            <div className="flex items-center gap-2 p-3 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/40 rounded-xl text-xs font-semibold">
              <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Connection active! You can now ask the agent to retry the task.</span>
            </div>
          )
        : (
            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="password"
                value={secret}
                onChange={e => setSecret(e.target.value)}
                placeholder={`Enter your ${service} API key or token...`}
                required
                className="flex-1 h-9 rounded-lg border border-stone-200 dark:border-stone-800 bg-white/50 dark:bg-stone-900/50 px-3 text-xs outline-hidden focus:border-stone-400 dark:focus:border-stone-750 text-stone-850 dark:text-stone-50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !secret.trim()}
                className="h-9 px-3 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-850 dark:bg-stone-50 dark:text-stone-950 dark:hover:bg-stone-150 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {loading ? 'Saving...' : 'Connect'}
              </button>
            </form>
          )}
    </div>
  )
}

/**
 * A2uiRenderer renders standard A2UI components specified in JSON format
 * directly into high-fidelity React interactive views (Cards, Tables, Buttons).
 */
export const A2uiRenderer: React.FC<{ payload: string | object }> = ({ payload }) => {
  let data: A2uiPayload

  try {
    data = typeof payload === 'string' ? JSON.parse(payload) : (payload as A2uiPayload)
  }
  catch (err) {
    return (
      <div className="p-3 text-xs text-red-500 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
        Failed to parse A2UI Payload:
        {' '}
        {err instanceof Error ? err.message : String(err)}
      </div>
    )
  }

  const renderComponent = (node: A2uiPayload, index: number = 0): React.ReactNode => {
    if (!node || !node.type)
      return null

    switch (node.type) {
      case 'CredentialForm': {
        const { service, title, description } = node.props || {}
        return (
          <CredentialFormBox
            key={index}
            service={service || ''}
            title={title}
            description={description}
          />
        )
      }

      case 'GoogleOAuth': {
        const { title, description } = node.props || {}
        return (
          <div
            key={index}
            className="my-3 p-5 rounded-2xl border border-stone-200/85 bg-white/75 shadow-xs dark:border-stone-800/60 dark:bg-stone-950/60 backdrop-blur-xs text-left"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </span>
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-50">
                {title || 'Google Slides Access Required'}
              </h4>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-4">
              {description || 'To create or edit presentation slides, please authorize access to your Google Slides account via Google OAuth 2.0.'}
            </p>
            <button
              onClick={() => {
                const API_BASE_URL = getApiBaseUrl()
                window.location.href = `${API_BASE_URL}/auth/google`
              }}
              className="h-9 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer inline-flex items-center gap-1.5"
              type="button"
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-6.887 4.114-4.694 0-8.503-3.809-8.503-8.503s3.809-8.503 8.503-8.503c2.083 0 3.978.778 5.428 2.227l3.12-3.12C18.17 1.83 15.394 1 12.24 1 5.922 1 1 5.922 1 12.24s4.922 11.24 11.24 11.24c6.302 0 11.24-4.938 11.24-11.24 0-.756-.09-1.503-.255-2.227H12.24z"/>
              </svg>
              Connect Google Slides
            </button>
          </div>
        )
      }

      case 'Card': {
        const { title, description, badge } = node.props || {}
        return (
          <div
            key={index}
            className="my-3 p-5 rounded-2xl border border-stone-200/85 bg-white/75 shadow-xs dark:border-stone-800/60 dark:bg-stone-950/60 backdrop-blur-xs hover:shadow-sm transition-all duration-200 text-left"
          >
            {badge && (
              <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 mb-2 select-none">
                {badge}
              </span>
            )}
            {title && (
              <h4 className="text-sm font-bold text-stone-900 dark:text-stone-50">
                {title}
              </h4>
            )}
            {description && (
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                {description}
              </p>
            )}
            {node.children && node.children.length > 0 && (
              <div className="mt-4 space-y-2">
                {node.children.map((child, i) => renderComponent(child, i))}
              </div>
            )}
          </div>
        )
      }

      case 'Table': {
        const { headers, rows } = node.props || {}
        return (
          <div key={index} className="my-3 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 shadow-2xs">
            <table className="min-w-full divide-y divide-stone-200 dark:divide-stone-850 text-left text-xs">
              <thead className="bg-stone-50 dark:bg-stone-900/60 font-semibold text-stone-700 dark:text-stone-300">
                <tr>
                  {headers?.map((h: string, idx: number) => (
                    <th key={idx} className="px-4 py-2.5 font-bold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-150 dark:divide-stone-850 bg-white/80 dark:bg-stone-950/40 text-stone-600 dark:text-stone-400">
                {rows?.map((row: any[], rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/10">
                    {row.map((val: any, cIdx: number) => (
                      <td key={cIdx} className="px-4 py-2 font-mono text-[11px]">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      case 'Button': {
        const { label, variant, action } = node.props || {}
        const handleClick = () => {
          if (action) {
            import('sonner').then(({ toast }) => {
              toast.success(`A2UI Action Triggered: ${action}`)
            })
          }
        }
        return (
          <button
            key={index}
            onClick={handleClick}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer mr-2 last:mr-0 inline-flex items-center justify-center',
              variant === 'primary'
                ? 'bg-stone-900 text-stone-50 hover:bg-stone-850 dark:bg-stone-50 dark:text-stone-950 dark:hover:bg-stone-150'
                : 'border border-stone-250 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300 dark:hover:bg-stone-850',
            )}
          >
            {label || 'Action'}
          </button>
        )
      }

      case 'Text': {
        const { content, variant } = node.props || {}
        return (
          <p
            key={index}
            className={cn(
              'text-xs leading-relaxed text-left',
              variant === 'muted' ? 'text-stone-400 dark:text-stone-500' : 'text-stone-600 dark:text-stone-300',
            )}
          >
            {content}
          </p>
        )
      }

      case 'Select': {
        const { label, options, placeholder } = node.props || {}
        const [selectedValue, setSelectedValue] = React.useState('')

        const handleSubmit = () => {
          if (!selectedValue)
            return
          window.dispatchEvent(new CustomEvent('a2ui-action', {
            detail: {
              action: 'send_message',
              value: `我选择的项目仓库是：${selectedValue}`,
            },
          }))
        }

        return (
          <div key={index} className="my-3 p-4 rounded-xl border border-stone-200/85 bg-white/75 shadow-xs dark:border-stone-800/60 dark:bg-stone-950/60 backdrop-blur-xs text-left">
            {label && <label className="block text-xs font-bold mb-2 text-stone-700 dark:text-stone-300">{label}</label>}
            <div className="flex gap-2">
              <select
                value={selectedValue}
                onChange={e => setSelectedValue(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-stone-200 dark:border-stone-850 bg-white/50 dark:bg-stone-900/50 px-3 text-xs outline-hidden focus:border-stone-400 dark:focus:border-stone-750 text-stone-800 dark:text-stone-200"
              >
                <option value="">{placeholder || '请选择一个仓库...'}</option>
                {options?.map((opt: any, idx: number) => {
                  const val = typeof opt === 'string' ? opt : opt.value
                  const lbl = typeof opt === 'string' ? opt : opt.label
                  return <option key={idx} value={val}>{lbl}</option>
                })}
              </select>
              <button
                onClick={handleSubmit}
                disabled={!selectedValue}
                className="h-9 px-3 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-850 dark:bg-stone-50 dark:text-stone-950 dark:hover:bg-stone-150 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center"
              >
                确认选择
              </button>
            </div>
          </div>
        )
      }

      default:
        return (
          <div key={index} className="p-2 text-xs text-stone-500 bg-stone-50 dark:bg-stone-900/20 border border-stone-200 dark:border-stone-800 rounded-lg">
            Unsupported A2UI Component:
            {' '}
            {node.type}
          </div>
        )
    }
  }

  return <div className="a2ui-payload-container">{renderComponent(data)}</div>
}
