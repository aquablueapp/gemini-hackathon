import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, redirect } from '@tanstack/react-router'
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ClipboardList,
  Mic,
  Paperclip,
  Play,
  Plus,
  Send,
  Square,
  Terminal,
  UserPlus,
  Volume2,
  X,
} from 'lucide-react'
import * as React from 'react'
import { useTranslations } from 'use-intl'
import { A2uiRenderer } from '~/components/ui/a2ui-renderer'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { PremiumSidebar } from '~/components/ui/premium-sidebar'
import { ThinkingSkeleton } from '~/components/ui/thinking-skeleton'
import { WorkflowGraph } from '~/components/WorkflowGraph'
import CategoryPieChart from '~/components/charts/CategoryPieChart'
import PerformanceBarChart from '~/components/charts/PerformanceBarChart'

import { apiClient, getApiBaseUrl } from '~/lib/api-client'
import { getCookie } from '~/lib/cookies'

// Define query options for applets fetching
export const appletsQueryOptions = queryOptions({
  queryKey: ['applets'],
  queryFn: async () => {
    const res = await apiClient.apps.$get()
    if (!res.ok) {
      throw new Error('Failed to fetch applets')
    }
    return res.json()
  },
})

export const Route = createFileRoute('/dashboard')({
  beforeLoad: () => {
    // Client-side demo login guard redirecting to /login
    if (typeof window !== 'undefined') {
      const session = getCookie('auth_session')
      if (session !== 'demo_logged_in') {
        throw redirect({ to: '/{-$locale}/login', params: { locale: 'en' } })
      }
    }
  },
  loader: ({ context }: any) => {
    if (typeof window === 'undefined') {
      return null
    }
    return context.queryClient.ensureQueryData(appletsQueryOptions)
  },
  component: DashboardPage,
})

interface Message {
  id: string
  role: 'user' | 'model' | 'tool'
  content: string
  affectedItems?: string[]
  isCompiling?: boolean
  isCompiled?: boolean
}

interface LogLine {
  line: string
  type: 'stdout' | 'stderr'
}

const DEFAULT_MODEL_ID = 'gemini-2.5-flash'

function CodeBlockWithActions({ code, language }: { code: string, language: string }) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `script.${language || 'txt'}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 font-mono text-[11px] shadow-sm text-left w-full">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900/80 px-4 py-1.5 text-xs text-stone-500 dark:text-stone-400">
        <span>{language || 'code'}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 hover:text-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer font-bold uppercase tracking-wider"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
          <span className="text-stone-350 dark:text-stone-700">|</span>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 hover:text-stone-800 dark:hover:text-stone-100 transition-colors cursor-pointer font-bold uppercase tracking-wider"
          >
            Download
          </button>
        </div>
      </div>
      <div className="p-3 overflow-x-auto bg-stone-950 text-stone-250">
        <pre className="text-xs leading-relaxed">
          <code>{code.trim()}</code>
        </pre>
      </div>
    </div>
  )
}

function TerminalConsole({ logs }: { logs: string }) {
  const [isExpanded, setIsExpanded] = React.useState(true)
  const terminalEndRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isExpanded])

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-950 font-mono text-xs shadow-md text-left w-full max-w-full">
      <div className="flex items-center justify-between border-b border-stone-850 bg-stone-900 px-4 py-2 text-[9px] text-stone-400 select-none">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-amber-500 fill-current animate-pulse" />
          <span className="font-bold text-stone-250">Execution Sandbox Terminal</span>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[9px] uppercase font-bold text-stone-400 hover:text-stone-250 cursor-pointer"
        >
          {isExpanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {isExpanded && (
        <div className="p-4 overflow-x-auto bg-stone-950 text-stone-250 max-h-60 overflow-y-auto flex flex-col gap-0.5 leading-relaxed">
          {logs.trim().split('\n').map((line, idx) => {
            if (line.startsWith('$')) {
              return (
                <div key={idx} className="text-blue-400 font-bold">
                  {line}
                </div>
              )
            }
            if (line.toLowerCase().includes('error') || line.toLowerCase().includes('fail') || line.toLowerCase().includes('exception')) {
              return (
                <div key={idx} className="text-rose-400">
                  {line}
                </div>
              )
            }
            return (
              <div key={idx} className="text-stone-300">
                {line}
              </div>
            )
          })}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  )
}

function renderMessageContent(content: string) {
  if (!content)
    return null
  const parts = content.split(/(```[\s\S]*?```)/g)

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const match = part.match(/```([\w+-]*)\n([\s\S]*?)```/)
      const language = match ? match[1] : ''
      const code = match ? match[2] : part.slice(3, -3)

      if (language === 'json+a2ui' || language === 'a2ui') {
        return (
          <A2uiRenderer key={index} payload={code.trim()} />
        )
      }

      if (language === 'logs') {
        return (
          <TerminalConsole key={index} logs={code.trim()} />
        )
      }

      if (language === 'workflow-json') {
        return (
          <WorkflowGraph key={index} data={code.trim()} />
        )
      }

      if (language === 'affected_items') {
        return null
      }

      return (
        <CodeBlockWithActions key={index} code={code} language={language} />
      )
    }

    const lines = part.split('\n')
    return (
      <React.Fragment key={index}>
        {lines.map((line, i) => (
          <p key={i} className="min-h-[1.25rem] mb-1 last:mb-0">
            {line}
          </p>
        ))}
      </React.Fragment>
    )
  })
}

function getLatestWorkflowPlan(messages: Message[]) {
  for (let i = messages.length - 1; i >= 0; i--) {
    const match = messages[i].content.match(/```workflow-json\n([\s\S]*?)```/)
    if (match?.[1]) {
      return match[1].trim()
    }
  }
  return null
}

export function DashboardPage() {
  const t = useTranslations('dashboard')
  const queryClient = useQueryClient()
  const { data: applets = [] } = useQuery({
    ...appletsQueryOptions,
    enabled: typeof window !== 'undefined',
  })

  // System states
  const [activeMode, setActiveMode] = React.useState<'employee' | 'develop'>('employee')
  const [selectedEmployeeId, setSelectedEmployeeId] = React.useState<string | null>(null)

  // AI Chat States
  const [sessionId, setSessionId] = React.useState('session_placeholder')
  const [messages, setMessages] = React.useState<Message[]>([])
  const [input, setInput] = React.useState('')
  const [isStreaming, setIsStreaming] = React.useState(false)
  const [localSessions, setLocalSessions] = React.useState<{ id: string, label: string }[]>([])
  const [selectedModel, setSelectedModel] = React.useState('gemini-omni')
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [attachedFile, setAttachedFile] = React.useState<{ base64: string, mimeType: string, name: string } | null>(null)

  // Voice Recording States
  const [isRecording, setIsRecording] = React.useState(false)
  const [recordingDuration, setRecordingDuration] = React.useState(0)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const audioChunksRef = React.useRef<Blob[]>([])
  const recordingTimerRef = React.useRef<any>(null)

  // Tool & Agent Thinking States
  const [thinkingLogs, setThinkingLogs] = React.useState<string[]>([])
  const [isThinking, setIsThinking] = React.useState(false)
  const [thinkingDuration, setThinkingDuration] = React.useState(0)
  const [activeModelMsgId, setActiveModelMsgId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let interval: any
    if (isThinking) {
      interval = setInterval(() => {
        setThinkingDuration(prev => prev + 1)
      }, 1000)
    }
    else {
      setThinkingDuration(0)
    }
    return () => clearInterval(interval)
  }, [isThinking])

  // Terminal Runner States (Embedded Log Viewer)
  const [runningAppId, setRunningAppId] = React.useState<string | null>(null)
  const [runningAppName, setRunningAppName] = React.useState<string | null>(null)
  const [terminalLogs, setTerminalLogs] = React.useState<LogLine[]>([])
  const [terminalStatus, setTerminalStatus] = React.useState<'idle' | 'running' | 'success' | 'failed'>('idle')
  const [terminalExitCode, setTerminalExitCode] = React.useState<number | null>(null)
  const [terminalError, setTerminalError] = React.useState<string | null>(null)
  const [reportResult, setReportResult] = React.useState<Record<string, unknown> | null>(null)
  const [activeTerminalTab, setActiveTerminalTab] = React.useState<'logs' | 'analytics'>('logs')

  const timelineEndRef = React.useRef<HTMLDivElement>(null)
  const terminalEndRef = React.useRef<HTMLDivElement>(null)
  const eventSourceRef = React.useRef<EventSource | null>(null)

  const { data: performanceData } = useQuery<{
    algorithm: string
    metrics: {
      before_optimization: { avg_latency_ms: number }
      after_optimization: { avg_latency_ms: number }
    }
    improvement_summary: {
      speedup_ratio: string
      memory_saved_pct: string
      cpu_idle_gain_pct: string
    }
  }>({
    queryKey: ['mockPerformance'],
    queryFn: async () => {
      const API_BASE_URL = getApiBaseUrl()
      const res = await fetch(`${API_BASE_URL}/dev/mock-performance`)
      if (!res.ok) throw new Error('Failed to fetch mock performance')
      return res.json()
    },
    enabled: terminalStatus === 'success',
  })

  const selectedEmployee = React.useMemo(
    () => (applets as any[]).find(applet => applet.id === selectedEmployeeId) || null,
    [applets, selectedEmployeeId],
  )

  const latestWorkflowPlan = React.useMemo(() => getLatestWorkflowPlan(messages), [messages])

  // Client-side hydration safety checks
  React.useEffect(() => {
    if (sessionId === 'session_placeholder') {
      setSessionId(`session_${Date.now()}`)
    }

    const saved = localStorage.getItem('aquablue_sessions')
    const sessions = saved ? JSON.parse(saved) : []
    
    // Default seeded historical sessions in Firestore
    const defaultSessions = [
      { id: 'session_gcp_clean', label: 'GCP Cloud Run Cleanup' },
      { id: 'session_firebase_deploy', label: 'Firebase Safety Rules' },
    ]

    let hasUpdated = false
    for (const defSess of defaultSessions) {
      if (!sessions.some((s: any) => s.id === defSess.id)) {
        sessions.push(defSess)
        hasUpdated = true
      }
    }

    setLocalSessions(sessions)
    if (hasUpdated || !saved) {
      localStorage.setItem('aquablue_sessions', JSON.stringify(sessions))
    }
  }, [])

  React.useEffect(() => {
    const employees = applets as any[]
    if (employees.length === 0) {
      setSelectedEmployeeId(null)
      return
    }

    if (!selectedEmployeeId || !employees.some(employee => employee.id === selectedEmployeeId)) {
      const nextEmployeeId = employees[0].id
      setSelectedEmployeeId(nextEmployeeId)
      if (activeMode === 'employee') {
        setSessionId(nextEmployeeId)
      }
      return
    }

    if (activeMode === 'employee' && sessionId !== selectedEmployeeId) {
      setSessionId(selectedEmployeeId)
    }
  }, [activeMode, applets, selectedEmployeeId, sessionId])

  // Load session messages when sessionId changes
  React.useEffect(() => {
    if (!sessionId || sessionId === 'session_placeholder') {
      setMessages([])
      return
    }
    // If it's a newly generated session (session_ + numeric timestamp), show welcome message
    const timestampPart = sessionId.replace('session_', '')
    if (sessionId.startsWith('session_') && !isNaN(Number(timestampPart))) {
      const savedMessages = localStorage.getItem(`aquablue_session_messages_${sessionId}`)
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
        return
      }

      setMessages([
        {
          id: 'init-msg',
          role: 'model',
          content: t('welcomeMessage') || 'Hello! I am your Aquablue Agent. I can help you build automated tasks, dry-run python scripts inside a sandbox, and compile them into Applets. What would you like to build today?',
        },
      ])
      return
    }

    // Otherwise, fetch session events from the backend API
    const fetchSessionEvents = async () => {
      try {
        const API_BASE_URL = getApiBaseUrl()
        const response = await fetch(`${API_BASE_URL}/agent/sessions/${sessionId}/events`)
        if (response.ok) {
          const data = await response.json()
          if (data && data.length > 0) {
            setMessages(data)
            return
          }
        }
      }
      catch (err) {
        console.error('Failed to load session events:', err)
      }

      const savedMessages = localStorage.getItem(`aquablue_session_messages_${sessionId}`)
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages))
        return
      }

      // Fallback to welcome message if no events found
      setMessages([
        {
          id: 'init-msg',
          role: 'model',
          content: t('welcomeMessage') || 'Hello! I am your Aquablue Agent. I can help you build automated tasks, dry-run python scripts inside a sandbox, and compile them into Applets. What would you like to build today?',
        },
      ])
    }

    fetchSessionEvents()
  }, [sessionId, t])

  // Save session messages to local storage whenever they change and streaming finishes
  React.useEffect(() => {
    if (messages.length > 0 && !isStreaming && !sessionId.startsWith('session_gcp') && !sessionId.startsWith('session_firebase')) {
      localStorage.setItem(`aquablue_session_messages_${sessionId}`, JSON.stringify(messages))
    }
  }, [messages, isStreaming, sessionId])

  // Scroll chat timeline to bottom
  React.useEffect(() => {
    if (timelineEndRef.current) {
      timelineEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isStreaming, activeMode])

  // Scroll terminal logs to bottom
  React.useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [terminalLogs])

  // Cleanup EventSource on unmount or runningAppId change
  React.useEffect(() => {
    if (runningAppId) {
      startTerminalStream(runningAppId)
    }
    else {
      stopTerminalStream()
    }
    return () => stopTerminalStream()
  }, [runningAppId])

  // ----------------------------------------------------
  // LOGIC: Sandbox Subprocess Runner
  // ----------------------------------------------------
  const stopTerminalStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
  }

  const startTerminalStream = (id: string) => {
    stopTerminalStream()
    setTerminalLogs([])
    setTerminalStatus('running')
    setTerminalExitCode(null)
    setTerminalError(null)
    setReportResult(null)
    setActiveTerminalTab('logs')

    const sseUrl = `${getApiBaseUrl()}/apps/${id}/run`
    const source = new EventSource(sseUrl)
    eventSourceRef.current = source

    source.addEventListener('log', (event) => {
      try {
        const data = JSON.parse(event.data) as { line: string, type: 'stdout' | 'stderr' }
        setTerminalLogs(prev => [...prev, { line: data.line, type: data.type }])
      }
      catch (err) {
        console.error('Failed to parse SSE log event', err)
      }
    })

    source.addEventListener('node-status', (event) => {
      try {
        window.dispatchEvent(new CustomEvent('node-status', { detail: event.data }))
      }
      catch (err) {
        console.error('Failed to dispatch node-status custom event', err)
      }
    })

    source.addEventListener('result', (event) => {
      try {
        const data = JSON.parse(event.data) as {
          status: 'success' | 'failed'
          exitCode?: number
          error?: string
        }
        setTerminalStatus(data.status)
        if (data.exitCode !== undefined) {
          setTerminalExitCode(data.exitCode)
        }
        if (data.error) {
          setTerminalError(data.error)
        }
        stopTerminalStream()
      }
      catch (err) {
        console.error('Failed to parse SSE result event', err)
        setTerminalStatus('failed')
        stopTerminalStream()
      }
    })

    source.addEventListener('report-result', (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>
        setReportResult(data)
      }
      catch (err) {
        console.error('Failed to parse SSE report-result event', err)
      }
    })

    source.onerror = (err) => {
      console.error('EventSource encountered error', err)
      setTerminalLogs(prev => [...prev, { line: 'System connection interrupted or script execution ended.', type: 'stderr' }])
      setTerminalStatus('failed')
      stopTerminalStream()
    }
  }

  const handleRun = (id: string, name: string) => {
    startTerminalStream(id)
    setRunningAppId(id)
    setRunningAppName(name)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const commaIdx = result.indexOf(',')
      if (commaIdx !== -1) {
        const base64 = result.substring(commaIdx + 1)
        setAttachedFile({
          base64,
          mimeType: file.type,
          name: file.name,
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      audioChunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()
        reader.onloadend = () => {
          const result = reader.result as string
          const commaIdx = result.indexOf(',')
          if (commaIdx !== -1) {
            const base64 = result.substring(commaIdx + 1)
            setAttachedFile({
              base64,
              mimeType: 'audio/webm',
              name: `voice_message_${Date.now()}.webm`,
            })
          }
        }
        reader.readAsDataURL(audioBlob)

        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setIsRecording(true)
      setRecordingDuration(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      alert('Microphone access denied or error starting recording.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current)
      recordingTimerRef.current = null
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ----------------------------------------------------
  // LOGIC: AI Chat Execution
  // ----------------------------------------------------
  const handleSend = async (textToSend?: string) => {
    const messageText = textToSend || input
    const currentAttachedFile = attachedFile

    if (!messageText.trim() && !currentAttachedFile)
      return

    if (!textToSend) {
      setInput('')
    }
    setAttachedFile(null)

    let finalMessageText = messageText
    if (currentAttachedFile && !messageText.trim()) {
      finalMessageText = `Analyze uploaded task recording/screenshot: ${currentAttachedFile.name}`
    }

    const userMsg: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: currentAttachedFile
        ? `${finalMessageText}\n\n📎 *[Attached File: ${currentAttachedFile.name}]*`
        : finalMessageText,
    }

    setMessages(prev => [...prev, userMsg])
    setIsStreaming(true)
    setThinkingLogs([])
    setIsThinking(true)
    setThinkingDuration(0)

    // Add to local sessions if it is a new session
    if (!localSessions.some(s => s.id === sessionId)) {
      const label = finalMessageText.length > 25 ? `${finalMessageText.substring(0, 25)}...` : finalMessageText
      const newSession = { id: sessionId, label }
      const updated = [newSession, ...localSessions]
      setLocalSessions(updated)
      localStorage.setItem('aquablue_sessions', JSON.stringify(updated))
    }

    const modelMsgId = `model_${Date.now()}`
    setMessages(prev => [...prev, { id: modelMsgId, role: 'model', content: '' }])
    setActiveModelMsgId(modelMsgId)

    try {
      const API_BASE_URL = getApiBaseUrl()
      const response = await fetch(`${API_BASE_URL}/agent/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: finalMessageText,
          sessionId,
          model: selectedModel,
          ...(currentAttachedFile ? {
            file: {
              base64: currentAttachedFile.base64,
              mimeType: currentAttachedFile.mimeType,
            }
          } : {}),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch streaming chat')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      const processedTools = new Set<string>()

      let fullModelText = ''
      let detectedAffectedItems: string[] | undefined
      let isCompiledSuccessfully = false

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6).trim()
              if (!jsonStr)
                continue

              try {
                const event = JSON.parse(jsonStr)

                // 拦截并解析 functionCall
                if (event.content && event.content.parts) {
                  event.content.parts.forEach((p: any) => {
                    if (p.functionCall) {
                      const callId = p.functionCall.id || p.functionCall.name
                      const cacheKey = `${callId}_call`
                      if (!processedTools.has(cacheKey)) {
                        processedTools.add(cacheKey)
                        const toolName = p.functionCall.name
                        const toolFriendlyNames: Record<string, string> = {
                          get_commit_code_outline: '提取代码变更大纲',
                          get_commit_code_details: '获取代码修改详情',
                          dry_run_script: '在沙盒中执行测试',
                          compile_applet: '编译打包 AI 智能体应用',
                          get_weather: '查询天气',
                          get_current_time: '查询当前时间'
                        }
                        const friendlyName = toolFriendlyNames[toolName] || toolName
                        const argsStr = p.functionCall.args ? JSON.stringify(p.functionCall.args) : ''
                        const logText = argsStr 
                          ? `🛠 正在调用 ${toolName} (${friendlyName})，参数: ${argsStr}...`
                          : `🛠 正在调用 ${toolName} (${friendlyName})...`
                        setThinkingLogs(prev => [...prev, logText])
                      }
                    }
                  })
                }

                // 拦截并解析 functionResponse
                if (event.content && event.content.parts) {
                  event.content.parts.forEach((p: any) => {
                    if (p.functionResponse) {
                      const respId = p.functionResponse.id || p.functionResponse.name
                      const cacheKey = `${respId}_resp`
                      if (!processedTools.has(cacheKey)) {
                        processedTools.add(cacheKey)
                        const toolName = p.functionResponse.name
                        const toolFriendlyNames: Record<string, string> = {
                          get_commit_code_outline: '提取代码变更大纲',
                          get_commit_code_details: '获取代码修改详情',
                          dry_run_script: '在沙盒中执行测试',
                          compile_applet: '编译打包 AI 智能体应用',
                          get_weather: '查询天气',
                          get_current_time: '查询当前时间'
                        }
                        const friendlyName = toolFriendlyNames[toolName] || toolName
                        setThinkingLogs(prev => [...prev, `✅ ${toolName} (${friendlyName}) 执行完成。`])
                      }
                    }
                  })
                }

                if (event.content && event.content.parts) {
                  const textPart = event.content.parts.map((p: any) => p.text || '').join('')
                  if (event.partial === false) {
                    fullModelText = textPart
                  }
                  else {
                    fullModelText += textPart
                  }

                  setMessages(prev =>
                    prev.map(msg =>
                      msg.id === modelMsgId ? { ...msg, content: fullModelText } : msg,
                    ),
                  )
                }

                if (fullModelText.toLowerCase().includes('compiled and saved')
                  || fullModelText.toLowerCase().includes('successfully compiled')) {
                  isCompiledSuccessfully = true
                }
              }
              catch (e) {
                // Ignore json parsing failures
              }
            }
          }
        }
      }

      // Try to parse dynamic affected items from fullModelText
      const affectedMatch = fullModelText.match(/```affected_items\n([\s\S]*?)```/)
      if (affectedMatch && affectedMatch[1]) {
        try {
          detectedAffectedItems = JSON.parse(affectedMatch[1].trim())
        }
        catch (err) {
          console.warn('Failed to parse dynamic affected items', err)
        }
      }

      if (!detectedAffectedItems && (fullModelText.includes('dry_run_script') || fullModelText.toLowerCase().includes('dry-run'))) {
        detectedAffectedItems = [
          'Old Spam Email 1 (From: promo@ad.com - Subject: 50% Off Today)',
          'Old Spam Email 2 (From: newsletter@info.org - Subject: Weekly Newsletter)',
          'Old Spam Email 3 (From: alert@security.net - Subject: Alert: Account Info Update)',
        ]
      }

      setMessages(prev =>
        prev.map(msg =>
          msg.id === modelMsgId
            ? {
                ...msg,
                content: fullModelText || 'Done processing.',
                affectedItems: detectedAffectedItems,
                isCompiled: isCompiledSuccessfully,
              }
            : msg,
        ),
      )

      // Invalidate query to pull the newly compiled Applet if compilation happened
      if (isCompiledSuccessfully) {
        queryClient.invalidateQueries({ queryKey: ['applets'] })
      }
    }
    catch (err) {
      console.error(err)
      setIsThinking(false)
      setMessages(prev =>
        prev.map(msg =>
          msg.id === modelMsgId
            ? { ...msg, content: 'Error: Failed to communicate with Aquablue Agent.' }
            : msg,
        ),
      )
    }
    finally {
      setIsStreaming(false)
      setIsThinking(false)
      setActiveModelMsgId(null)
    }
  }

  React.useEffect(() => {
    const handleA2uiAction = (e: Event) => {
      const customEvent = e as CustomEvent
      const { action, value } = customEvent.detail || {}
      if (action === 'send_message') {
        handleSend(value)
      }
    }
    window.addEventListener('a2ui-action', handleA2uiAction)
    return () => {
      window.removeEventListener('a2ui-action', handleA2uiAction)
    }
  }, [handleSend])

  const handleConfirmAction = () => {
    handleSend('Confirm the action and compile this python script into a static Applet.')
  }

  const handleNewEmployee = () => {
    setSessionId(`session_${Date.now()}`)
    setActiveMode('develop')
  }

  const handleItemRename = (id: string, newLabel: string) => {
    const updated = localSessions.map(s => s.id === id ? { ...s, label: newLabel } : s)
    setLocalSessions(updated)
    localStorage.setItem('aquablue_sessions', JSON.stringify(updated))
  }

  const handleItemDelete = (id: string) => {
    const updated = localSessions.filter(s => s.id !== id)
    setLocalSessions(updated)
    localStorage.setItem('aquablue_sessions', JSON.stringify(updated))
    if (sessionId === id) {
      setSessionId(`session_${Date.now()}`)
      setActiveMode('develop')
    }
  }

  // Sidebar navigation structure config
  const sidebarGroups = [
    {
      title: 'AI Employees',
      action: {
        id: 'new-ai-employee',
        label: 'New AI Employee',
        icon: <UserPlus className="w-3.5 h-3.5" />,
      },
      items: [
        ...(applets as any[]).map(employee => ({
          id: employee.id,
          label: employee.name,
          icon: <Bot className="w-4 h-4" />,
          badge: employee.dependencies?.length ? String(employee.dependencies.length) : undefined,
        })),
      ],
    },
    {
      title: 'Recent Sessions',
      items: localSessions.map(session => ({
        id: session.id,
        label: session.label,
        icon: <ClipboardList className="w-4 h-4" />,
        editable: true,
      })),
    },
  ]

  const handleItemSelect = (item: any) => {
    if (item.id === 'new-ai-employee') {
      handleNewEmployee()
    }
    else {
      const isEmployee = (applets as any[]).some(emp => emp.id === item.id)
      if (isEmployee) {
        setActiveMode('employee')
        setSelectedEmployeeId(item.id)
        setSessionId(item.id)
      }
      else {
        setActiveMode('develop')
        setSelectedEmployeeId(null)
        setSessionId(item.id)
      }
      setRunningAppId(null)
    }
  }

  const getActiveItemId = () => {
    if (activeMode === 'develop') {
      if (sessionId && sessionId !== 'session_placeholder' && !sessionId.startsWith('session_temp')) {
        const isSessionId = localSessions.some(s => s.id === sessionId)
        if (isSessionId) {
          return sessionId
        }
      }
      return 'new-ai-employee'
    }
    return selectedEmployeeId || undefined
  }

  const renderChatSurface = ({
    title,
    subtitle,
    showBackButton = false,
  }: {
    title: string
    subtitle?: string
    showBackButton?: boolean
  }) => (
    <div className="flex-1 flex flex-col h-full overflow-hidden animate-in fade-in duration-300">
      <div className="h-16 flex items-center justify-between px-6 py-4 bg-[#f3faff] dark:bg-[#131d28] border-b border-[#d9e1e8] dark:border-[#223145] shrink-0">
        <div className="flex items-center gap-4 min-w-0 flex-1 mr-4">
          {showBackButton && (
            <Button
              variant="ghost"
              onClick={() => setActiveMode('employee')}
              className="p-1.5 hover:bg-white/35 dark:hover:bg-[#131b26]/50 rounded-full shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-650 dark:text-stone-300" />
            </Button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-[17px] font-extrabold leading-5 text-stone-900 dark:text-stone-50">{title}</h1>
            {subtitle && <p className="truncate text-[13px] font-semibold leading-4 text-zinc-500 dark:text-stone-400 mt-1">{subtitle}</p>}
          </div>
        </div>

        {/* Model Selector Dropdown from Google I/O 2026 */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="model-select" className="text-xs font-bold text-stone-400 dark:text-stone-500 select-none">Model:</label>
          <select
            id="model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="text-xs font-bold bg-[#eef6ff] dark:bg-[#1b2b3c] text-stone-700 dark:text-stone-200 rounded-xl px-3 py-1.5 border-0 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs select-none transition-colors"
          >
            <option value="gemini-3.5-flash">Gemini 3.5 Flash (Medium) ⭐</option>
            <option value="gemini-3.5-pro">Gemini 3.5 Pro (Large) 🔥</option>
            <option value="gemini-omni">Gemini Omni ✨</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
            <option value="gemini-2.0-flash-thinking">Gemini 2.0 Thinking</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-2xl ${
              msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'
            }`}
          >
            <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${
              msg.role === 'user'
                ? 'bg-gradient-to-b from-[#6ca7ff] to-[#4384e7] text-white rounded-tr-none font-bold'
                : 'bg-white text-zinc-700 border border-[#d9e1e8] rounded-tl-none dark:bg-[#131d28] dark:text-stone-200 dark:border-[#223145]'
            } ${(isThinking && msg.id === activeModelMsgId) ? 'w-full min-w-[280px] md:min-w-[450px] max-w-[600px] border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/40' : ''}`}
            >
              {msg.content && renderMessageContent(msg.content)}
              {(!msg.content && !isThinking) && (
                <div className="flex gap-1 items-center py-1">
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-stone-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              )}
              {(isThinking && msg.id === activeModelMsgId) && (
                <ThinkingSkeleton
                  isThinking={isThinking}
                  logs={thinkingLogs}
                  durationSeconds={thinkingDuration}
                  className={`border-0 bg-transparent p-0 shadow-none backdrop-blur-none dark:border-0 dark:bg-transparent w-full max-w-full ${msg.content ? "mt-3 border-t border-stone-200/50 dark:border-stone-800/50 pt-3" : ""}`}
                />
              )}
            </div>

            {msg.affectedItems && (
              <div className="mt-3 w-full bg-white dark:bg-[#131d28] border border-[#d9e1e8] dark:border-[#223145] rounded-xl p-4 shadow-sm animate-in zoom-in-95 duration-200">
                <h4 className="text-sm font-bold text-stone-700 dark:text-stone-300 mb-2 flex items-center gap-1.5">
                  <Play className="w-3.5 h-3.5 text-amber-500 fill-current" />
                  Dry-Run Preview (Affected Data List)
                </h4>
                <p className="text-xs text-stone-500 mb-3">
                  The Python script successfully simulated execution. Confirming will compile this applet for production.
                </p>
                <div className="bg-stone-50 dark:bg-stone-950 p-3 rounded-lg border border-stone-150 dark:border-stone-850 flex flex-col gap-2 font-mono text-xs text-stone-600 dark:text-stone-400">
                  {msg.affectedItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-amber-500">▶</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2 justify-end">
                  <Button
                    onClick={handleConfirmAction}
                    size="sm"
                    className="text-sm bg-gradient-to-b from-[#6ca7ff] to-[#4384e7] hover:opacity-90 text-white font-bold"
                  >
                    Confirm Action
                  </Button>
                </div>
              </div>
            )}

            {msg.isCompiled && (
              <div className="mt-3 w-full bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl p-4 shadow-sm flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400 mb-1">
                    AI Employee Created
                  </h4>
                  <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mb-3">
                    Your new employee has been securely compiled and added to the sidebar.
                  </p>
                  <Button
                    onClick={() => { setActiveMode('employee') }}
                    size="sm"
                    className="text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                  >
                    View AI Employees
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={timelineEndRef} />
      </div>

      <div className="bg-white dark:bg-[#131d28] border-t border-[#d9e1e8] dark:border-[#223145] flex flex-col shrink-0">
        {attachedFile && (
          <div className="px-5 py-2.5 border-b border-[#e9f1f8] dark:border-[#1d2a3a] flex items-center justify-between bg-[#f8fbff] dark:bg-[#162332] animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center gap-3 min-w-0">
              {attachedFile.mimeType.startsWith('image/') ? (
                <div className="w-9 h-9 rounded-lg border border-[#d9e1e8] dark:border-[#223145] bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center">
                  <img src={`data:${attachedFile.mimeType};base64,${attachedFile.base64}`} alt={attachedFile.name} className="w-full h-full object-cover" />
                </div>
              ) : attachedFile.mimeType.startsWith('video/') ? (
                <div className="w-9 h-9 rounded-lg border border-[#d9e1e8] dark:border-[#223145] bg-stone-100 shrink-0 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <Play className="w-3 h-3 text-white fill-current" />
                  </div>
                  <video src={`data:${attachedFile.mimeType};base64,${attachedFile.base64}`} className="w-full h-full object-cover" />
                </div>
              ) : attachedFile.mimeType.startsWith('audio/') ? (
                <div className="w-9 h-9 rounded-lg border border-[#d9e1e8] dark:border-[#223145] bg-[#fff3f3] dark:bg-[#201515] shrink-0 flex items-center justify-center text-red-500">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-lg border border-[#d9e1e8] dark:border-[#223145] bg-blue-100 dark:bg-blue-950 shrink-0 flex items-center justify-center text-blue-500">
                  <Paperclip className="w-4 h-4" />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate max-w-xs">{attachedFile.name}</p>
                <p className="text-[10px] font-semibold text-zinc-500 dark:text-stone-500 uppercase font-mono mt-0.5">{attachedFile.mimeType}</p>
              </div>
            </div>
            <button
              onClick={() => setAttachedFile(null)}
              className="p-1 hover:bg-[#e6effc] dark:hover:bg-[#1d2a3c] text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 rounded-full transition-colors cursor-pointer"
              title="Remove attachment"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {isRecording ? (
          <div className="h-14 px-5 flex items-center justify-between gap-3 bg-red-50/50 dark:bg-red-950/10 border-t border-red-100/30 dark:border-red-950/20">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[13px] font-bold text-red-600 dark:text-red-400 tracking-wide font-mono animate-pulse">
                Recording Voice Message... ({formatDuration(recordingDuration)})
              </span>
            </div>
            <button
              onClick={stopRecording}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 dark:bg-red-950 dark:hover:bg-red-900 text-red-600 dark:text-red-400 transition-colors shadow-xs hover:scale-105 active:scale-95 duration-150"
              title="Stop and Attach Voice Message"
              type="button"
            >
              <Square className="w-3.5 h-3.5 shrink-0 fill-current" />
            </button>
          </div>
        ) : (
          <div className="h-14 px-5 flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*,video/*,audio/*"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="text-zinc-500 hover:text-blue-500 disabled:text-zinc-350 dark:disabled:text-stone-800 transition-colors p-1"
              title="Attach Screen Recording, Screenshot, or Audio"
              type="button"
            >
              <Paperclip className="w-5 h-5 shrink-0" />
            </button>
            <button
              onClick={startRecording}
              disabled={isStreaming}
              className="text-zinc-500 hover:text-red-500 disabled:text-zinc-350 dark:disabled:text-stone-800 transition-colors p-1"
              title="Record Voice Message"
              type="button"
            >
              <Mic className="w-5 h-5 shrink-0" />
            </button>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder={isStreaming ? 'Agent is thinking...' : t('describeTask') || 'Describe a task...'}
              disabled={isStreaming}
              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-zinc-650 dark:text-stone-300 outline-hidden placeholder:text-zinc-400 dark:placeholder:text-stone-600"
            />
            <button
              onClick={() => handleSend()}
              disabled={isStreaming || (!input.trim() && !attachedFile)}
              className="text-blue-500 hover:text-blue-600 disabled:text-zinc-200 dark:disabled:text-stone-800 transition-colors"
              type="button"
              aria-label="Send message"
            >
              <Send className="w-6 h-6 shrink-0" />
            </button>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex h-screen w-screen bg-[#edf7ff] dark:bg-[#0f161f] text-stone-900 dark:text-stone-100 overflow-hidden font-sans">

      {/* ----------------------------------------------------
          LEFT SIDEBAR: Premium dynamic console navigation
          ---------------------------------------------------- */}
      <PremiumSidebar
        groups={sidebarGroups}
        activeItemId={getActiveItemId()}
        onItemSelect={handleItemSelect}
        onItemRename={handleItemRename}
        onItemDelete={handleItemDelete}
      />

      {/* ----------------------------------------------------
          CENTER PANEL: Dynamic Applets Grid / Chat Area + Terminal
          ---------------------------------------------------- */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-[#edf7ff] dark:bg-[#0f161f] relative border-r border-[#d9e1e8] dark:border-[#223145]">

        {activeMode === 'employee' ? (
          /* ===================================================
             EMPLOYEE STATE: Selected AI employee or first-run empty state
             =================================================== */
          (applets as any[]).length === 0
            ? (
                <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in duration-300">
                  <header className="h-16 flex items-center px-6 py-4 bg-[#f3faff] dark:bg-[#131d28] border-b border-[#d9e1e8] dark:border-[#223145] shrink-0">
                    <div>
                      <h1 className="text-xl font-black tracking-tight text-stone-800 dark:text-stone-100">
                        AI Employees
                      </h1>
                      <p className="text-sm text-stone-500">
                        Add an employee from the sidebar to start.
                      </p>
                    </div>
                  </header>
                  <div className="flex-1 overflow-y-auto p-6 md:p-10">
                    <div className="h-full min-h-[520px] flex items-center justify-center">
                      <button
                        type="button"
                        onClick={handleNewEmployee}
                        className="group flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-250 bg-white px-8 py-16 text-center shadow-sm transition-all hover:border-blue-400 hover:bg-blue-50/40 hover:shadow-md active:scale-[0.99] dark:border-stone-800 dark:bg-stone-900/40 dark:hover:border-blue-700 dark:hover:bg-blue-950/20"
                      >
                        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-500/20 transition-transform group-hover:scale-105">
                          <UserPlus className="h-9 w-9" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-stone-900 dark:text-stone-50">
                          Add your first AI employee
                        </h2>
                        <p className="mt-2 max-w-sm text-sm leading-6 text-stone-500 dark:text-stone-400">
                          Create an AI employee that can plan, test, and run a repeatable workflow for you.
                        </p>
                        <span className="mt-6 inline-flex items-center gap-2 rounded-xl bg-stone-900 px-5 py-3 text-sm font-bold text-white dark:bg-stone-100 dark:text-stone-950">
                          <Plus className="h-4 w-4" />
                          New AI Employee
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            : selectedEmployee
              ? (
                  renderChatSurface({
                    title: selectedEmployee.name,
                    subtitle: selectedEmployee.description || 'Chat with this AI employee.',
                  })
                )
              : null
        ) : (
          /* ===================================================
             DEVELOPMENT STATE: AI Interactive Aquablue
             =================================================== */
          renderChatSurface({
            title: localSessions.find(s => s.id === sessionId)?.label || 'New AI Employee',
            subtitle: `Session: ${sessionId.substring(8, 16)}...`,
            showBackButton: true,
          })
        )}

        {/* ===================================================
           EMBEDDED BOTTOM TERMINAL: sliding pane
           =================================================== */}
        {runningAppId && (() => {
          const pieData = (reportResult?.pieData || reportResult?.categories)
            ? (reportResult.pieData || reportResult.categories) as { name: string; value: number }[]
            : [
                { name: 'Git Commits', value: 45 },
                { name: 'Google Docs', value: 30 },
                { name: 'Slack Sync', value: 15 },
                { name: 'Other Ref', value: 10 },
              ]

          const barData = performanceData ? [
            { name: 'Unoptimized (Latency)', value: performanceData.metrics.before_optimization.avg_latency_ms, type: 'before' as const },
            { name: 'Optimized (Latency)', value: performanceData.metrics.after_optimization.avg_latency_ms, type: 'after' as const },
          ] : []

          const speedup = performanceData?.improvement_summary?.speedup_ratio || '—'
          const memorySaved = performanceData?.improvement_summary?.memory_saved_pct || '—'
          const cpuGain = performanceData?.improvement_summary?.cpu_idle_gain_pct || '—'

          return (
            <div className={`border-t border-stone-200 dark:border-stone-800 bg-stone-950 text-stone-100 flex flex-col z-20 shrink-0 relative animate-in slide-in-from-bottom duration-300 transition-all ${
              activeTerminalTab === 'analytics' ? 'h-[480px]' : 'h-64'
            }`}>
              {/* Terminal Header */}
              <div className="h-10 flex items-center justify-between px-4 bg-stone-900 border-b border-stone-850 select-none">
                <div className="flex items-center gap-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    terminalStatus === 'running'
                      ? 'bg-amber-500 animate-pulse'
                      : terminalStatus === 'success'
                        ? 'bg-emerald-500'
                        : terminalStatus === 'failed' ? 'bg-rose-500' : 'bg-stone-500'
                  }`}
                  />
                  <span className="font-mono text-sm font-bold text-stone-300">
                    sandbox://
                    {runningAppName || 'applet'}
                  </span>
                  <span className="text-xs text-stone-500 font-mono">
                    (
                    {t('terminalTitle') || 'Terminal'}
                    )
                  </span>
                </div>

                {/* Tab switching bar if reportResult is present or execution finished successfully */}
                {(reportResult || terminalStatus === 'success') && (
                  <div className="flex items-center bg-stone-950/80 p-0.5 rounded-lg border border-stone-800">
                    <button
                      onClick={() => setActiveTerminalTab('logs')}
                      className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                        activeTerminalTab === 'logs'
                          ? 'bg-stone-800 text-stone-100 font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Console Logs
                    </button>
                    <button
                      onClick={() => setActiveTerminalTab('analytics')}
                      className={`px-3 py-1 rounded-md text-xs font-mono transition-colors ${
                        activeTerminalTab === 'analytics'
                          ? 'bg-stone-800 text-stone-100 font-bold'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Analytics View
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setRunningAppId(null)}
                  className="text-stone-500 hover:text-stone-200 transition-colors p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Terminal Tab Content */}
              {activeTerminalTab === 'logs' ? (
                <div className="flex-1 p-4 overflow-y-auto font-mono text-xs bg-stone-950 flex flex-col gap-0.5 leading-relaxed">
                  <div className="text-stone-600">// Initializing isolated sandbox via uv run...</div>
                  {terminalLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={log.type === 'stderr' ? 'text-rose-400' : 'text-emerald-400'}
                    >
                      {log.line}
                    </div>
                  ))}
                  {terminalStatus === 'running' && (
                    <div className="text-amber-500 animate-pulse">█ Running...</div>
                  )}
                  <div ref={terminalEndRef} />
                </div>
              ) : (
                <div className="flex-1 p-6 overflow-y-auto bg-stone-950 text-stone-200 flex flex-col md:flex-row gap-6 items-stretch">
                  {/* Category Pie Chart Panel */}
                  <div className="flex-1 min-w-[250px] bg-stone-900/50 backdrop-blur-md border border-stone-800 rounded-xl p-4 flex flex-col">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 font-mono">
                      Technological Classification
                    </h3>
                    <div className="flex-1 h-[220px]">
                      <CategoryPieChart data={pieData} />
                    </div>
                  </div>

                  {/* Performance Bar Chart Panel */}
                  <div className="flex-1 min-w-[250px] bg-stone-900/50 backdrop-blur-md border border-stone-800 rounded-xl p-4 flex flex-col">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-3 font-mono">
                      Latency Performance (ms)
                    </h3>
                    <div className="flex-1 h-[220px]">
                      {performanceData ? (
                        <PerformanceBarChart data={barData} />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm text-stone-500 font-mono">
                          No performance metrics loaded
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary metrics block */}
                  <div className="w-full md:w-64 bg-gradient-to-br from-stone-900/80 to-stone-950 border border-stone-850 rounded-xl p-5 flex flex-col justify-between shadow-xl">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-4 font-mono">
                        Optimization Summary
                      </h3>
                      <div className="space-y-4">
                        <div>
                          <div className="text-[10px] uppercase text-stone-500 font-mono tracking-wider">Speedup Ratio</div>
                          <div className="text-3xl font-extrabold text-emerald-400 font-mono mt-0.5">
                            {speedup}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-stone-500 font-mono tracking-wider">Memory Saved</div>
                          <div className="text-2xl font-bold text-blue-400 font-mono mt-0.5">
                            {memorySaved}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] uppercase text-stone-500 font-mono tracking-wider">CPU Idle Gain</div>
                          <div className="text-lg font-bold text-stone-300 font-mono mt-0.5">
                            {cpuGain}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-stone-800/80 text-[10px] text-stone-500 font-mono leading-relaxed">
                      Powered by sandbox benchmarks. Optimizations were successfully compiled and verified by automated regression test suites.
                    </div>
                  </div>
                </div>
              )}

              {/* Terminal Status Bar */}
              <div className="h-10 px-4 bg-stone-900 border-t border-stone-850 flex items-center justify-between shrink-0 select-none text-xs text-stone-400 font-mono">
                <div className="flex items-center gap-4">
                  <span>
                    Status:
                    <strong className="uppercase text-stone-200">{terminalStatus}</strong>
                  </span>
                  {terminalExitCode !== null && (
                    <span>
                      Exit:
                      <strong className="text-stone-200">{terminalExitCode}</strong>
                    </span>
                  )}
                </div>
                {terminalStatus !== 'running' && (
                  <button
                    onClick={() => startTerminalStream(runningAppId)}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Restart</span>
                  </button>
                )}
              </div>
            </div>
          )
        })()}

      </main>

      {/* ----------------------------------------------------
          RIGHT SIDEBAR: AI employee plan only
          ---------------------------------------------------- */}
      <aside className="w-[340px] border-l border-[#d9e1e8] dark:border-[#223145] bg-white dark:bg-[#131d28] flex flex-col shrink-0 z-20 h-full">
        <div className="h-16 flex items-center justify-between gap-3 border-b border-[#d9e1e8] dark:border-[#223145] px-5 shrink-0">
          <div className="flex min-w-0 items-center gap-2">
            <ClipboardList className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="min-w-0">
              <h2 className="text-[17px] font-extrabold text-zinc-950 dark:text-stone-50">Work Plan</h2>
              <p className="truncate text-xs text-stone-500">Constructed by the AI employee</p>
            </div>
          </div>
          <Button
            onClick={() => selectedEmployee && handleRun(selectedEmployee.id, selectedEmployee.name)}
            disabled={!latestWorkflowPlan || !selectedEmployee}
            title={!latestWorkflowPlan ? 'Run is available after the AI employee constructs a plan.' : undefined}
            className="h-10 shrink-0 rounded-xl bg-[#6ca7ff] hover:bg-[#4384e7] px-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
            Run
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          {latestWorkflowPlan
            ? (
                <WorkflowGraph data={latestWorkflowPlan} />
              )
            : (
                <div className="flex h-full min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-stone-250 bg-stone-50/60 p-6 text-center dark:border-stone-800 dark:bg-stone-900/20">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white text-stone-400 shadow-sm ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-800">
                    <ClipboardList className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-stone-800 dark:text-stone-100">No plan yet</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-500 dark:text-stone-400">
                    Once the AI employee outlines a workflow, its plan will appear here.
                  </p>
                </div>
              )}
        </div>
      </aside>

    </div>
  )
}
