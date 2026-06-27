import { AlertCircle, CheckCircle, Play, X } from 'lucide-react'
import * as React from 'react'
import { getApiBaseUrl } from '~/lib/api-client'
import { Button } from './ui/button'

interface LogLine {
  line: string
  type: 'stdout' | 'stderr'
}

interface LogDrawerProps {
  isOpen: boolean
  appId: string | null
  appName: string | null
  onClose: () => void
}

export function LogDrawer({ isOpen, appId, appName, onClose }: LogDrawerProps) {
  const [logs, setLogs] = React.useState<LogLine[]>([])
  const [status, setStatus] = React.useState<'idle' | 'running' | 'success' | 'failed'>('idle')
  const [exitCode, setExitCode] = React.useState<number | null>(null)
  const [errorSummary, setErrorSummary] = React.useState<string | null>(null)

  const terminalEndRef = React.useRef<HTMLDivElement>(null)
  const eventSourceRef = React.useRef<EventSource | null>(null)

  React.useEffect(() => {
    if (isOpen && appId) {
      startStream(appId)
    }
    else {
      stopStream()
    }
    return () => stopStream()
  }, [isOpen, appId])

  React.useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs])

  const stopStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const startStream = (id: string) => {
    stopStream()
    setLogs([])
    setStatus('running')
    setExitCode(null)
    setErrorSummary(null)

    // Build API url for SSE logs stream
    const sseUrl = `${getApiBaseUrl()}/apps/${id}/run`
    const source = new EventSource(sseUrl)
    eventSourceRef.current = source

    source.addEventListener('log', (event) => {
      try {
        const data = JSON.parse(event.data) as { line: string, type: 'stdout' | 'stderr' }
        setLogs(prev => [...prev, { line: data.line, type: data.type }])
      }
      catch (err) {
        console.error('Failed to parse SSE log event', err)
      }
    })

    source.addEventListener('result', (event) => {
      try {
        const data = JSON.parse(event.data) as {
          status: 'success' | 'failed'
          exitCode?: number
          error?: string
        }
        setStatus(data.status)
        if (data.exitCode !== undefined) {
          setExitCode(data.exitCode)
        }
        if (data.error) {
          setErrorSummary(data.error)
        }
        stopStream()
      }
      catch (err) {
        console.error('Failed to parse SSE result event', err)
        setStatus('failed')
        stopStream()
      }
    })

    source.onerror = (err) => {
      console.error('EventSource encountered error', err)
      setLogs(prev => [...prev, { line: 'System connection interrupted or script execution ended.', type: 'stderr' }])
      setStatus('failed')
      stopStream()
    }
  }

  if (!isOpen)
    return null

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:max-w-xl bg-stone-950 text-stone-100 shadow-2xl flex flex-col z-50 border-l border-stone-800 transition-transform duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-800 bg-stone-900">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            status === 'running'
              ? 'bg-amber-500 animate-pulse'
              : status === 'success'
                ? 'bg-emerald-500'
                : status === 'failed' ? 'bg-rose-500' : 'bg-stone-500'
          }`}
          />
          <div>
            <h2 className="font-mono text-sm font-bold tracking-tight">
              sandbox://
              {appName || 'app'}
            </h2>
            <p className="text-xs text-stone-400">Sandbox subprocess runtime viewer</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={onClose}
          className="p-1 hover:bg-stone-800 rounded-full text-stone-400 hover:text-stone-100"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      {/* Terminal logs area */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto bg-stone-950 flex flex-col gap-1 leading-relaxed selection:bg-stone-800 selection:text-emerald-400">
        <div className="text-stone-500 mb-2">// Initializing sandbox session via `uv run`...</div>
        {logs.map((log, idx) => (
          <div
            key={idx}
            className={log.type === 'stderr' ? 'text-rose-400' : 'text-emerald-400'}
          >
            {log.line}
          </div>
        ))}
        {status === 'running' && (
          <div className="text-amber-500 animate-pulse mt-1">█ Running...</div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Status footer */}
      <div className="p-4 border-t border-stone-800 bg-stone-900 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-stone-400">
          <span>
            Status:
            <strong className="uppercase font-mono text-stone-200">{status}</strong>
          </span>
          {exitCode !== null && (
            <span>
              Exit Code:
              <strong className="font-mono text-stone-200">{exitCode}</strong>
            </span>
          )}
        </div>

        {errorSummary && (
          <div className="text-xs p-3 bg-rose-950/40 text-rose-300 rounded border border-rose-900/50 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{errorSummary}</span>
          </div>
        )}

        {status === 'success' && (
          <div className="text-xs p-3 bg-emerald-950/40 text-emerald-300 rounded border border-emerald-900/50 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>Execution completed successfully in the isolated sandbox.</span>
          </div>
        )}

        {status !== 'running' && (
          <Button
            onClick={() => appId && startStream(appId)}
            className="w-full flex items-center justify-center gap-2 font-mono text-sm py-2 bg-stone-100 hover:bg-stone-200 text-stone-900 font-bold"
          >
            <Play className="w-4 h-4 fill-current" />
            Restart Applet
          </Button>
        )}
      </div>
    </div>
  )
}
