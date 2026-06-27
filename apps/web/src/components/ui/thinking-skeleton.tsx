import { AnimatePresence, motion } from 'framer-motion'
import { Brain, ChevronDown, ChevronUp, Terminal, Search, Play, Cpu, Check, Loader2 } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'

export interface ThinkingSkeletonProps {
  isThinking: boolean
  logs?: string[]
  durationSeconds?: number
  className?: string
}

/**
 * ThinkingSkeleton component that visualizes AI reasoning chains, step logs, and streaming progress.
 */
export const ThinkingSkeleton: React.FC<ThinkingSkeletonProps> = ({
  isThinking,
  logs = [],
  durationSeconds,
  className,
}) => {
  // Hide complex/verbose terminal logs by default to keep the interface clean
  const [isExpanded, setIsExpanded] = React.useState(false)

  if (!isThinking)
    return null

  const formatDuration = (seconds?: number) => {
    if (seconds === undefined)
      return ''
    if (seconds < 60)
      return `(${seconds}s)`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `(${mins}m ${secs}s)`
  }

  // Parse the current active step and historical states based on log cues
  const getStepStates = () => {
    const hasScan = logs.some(l => l.includes('get_commit_code') || l.includes('outline') || l.includes('details') || l.toLowerCase().includes('github'))
    const hasDry = logs.some(l => l.includes('dry_run_script') || l.toLowerCase().includes('sandbox') || l.toLowerCase().includes('dry-run'))
    const hasCompile = logs.some(l => l.includes('compile_applet') || l.toLowerCase().includes('compile') || l.toLowerCase().includes('applet'))

    const lastLog = logs.length > 0 ? logs[logs.length - 1].toLowerCase() : ''

    let activeStepId = 'reason'
    if (lastLog.includes('get_commit_code') || lastLog.includes('outline') || lastLog.includes('details') || lastLog.includes('github')) {
      activeStepId = 'scan'
    } else if (lastLog.includes('dry_run_script') || lastLog.includes('sandbox') || lastLog.includes('dry-run')) {
      activeStepId = 'dry'
    } else if (lastLog.includes('compile_applet') || lastLog.includes('compile') || lastLog.includes('applet')) {
      activeStepId = 'compile'
    }

    // Compute status states
    let scanState: 'pending' | 'active' | 'completed' = 'pending'
    if (activeStepId === 'scan') {
      scanState = 'active'
    } else if (hasScan || hasDry || hasCompile) {
      scanState = 'completed'
    }

    let dryState: 'pending' | 'active' | 'completed' = 'pending'
    if (activeStepId === 'dry') {
      dryState = 'active'
    } else if (hasDry || hasCompile) {
      dryState = 'completed'
    }

    let compileState: 'pending' | 'active' | 'completed' = 'pending'
    if (activeStepId === 'compile') {
      compileState = 'active'
    } else if (hasCompile) {
      compileState = 'completed'
    }

    let reasonState: 'pending' | 'active' | 'completed' = 'pending'
    if (activeStepId === 'reason') {
      reasonState = 'active'
    }

    return {
      scan: scanState,
      dry: dryState,
      compile: compileState,
      reason: reasonState,
    }
  }

  const states = getStepStates()

  // Steps definition for visual timeline rendering
  const stepNodes = [
    { id: 'scan', label: 'Scan Code', icon: Search, state: states.scan },
    { id: 'dry', label: 'Sandbox Test', icon: Play, state: states.dry },
    { id: 'compile', label: 'Compile Applet', icon: Cpu, state: states.compile },
    { id: 'reason', label: 'Response', icon: Brain, state: states.reason },
  ]

  return (
    <div
      className={cn(
        'w-full max-w-[640px] rounded-2xl border border-stone-200/80 bg-white dark:border-[#223145] dark:bg-[#131d28] p-4.5 shadow-md transition-all duration-300',
        className,
      )}
    >
      {/* 1. Header with Title & Loader */}
      <div className="flex items-center justify-between gap-3 text-stone-600 dark:text-stone-400 select-none pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="flex items-center gap-2.5">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            className="w-5 h-5 flex items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-500"
          >
            <Loader2 className="w-3.5 h-3.5" />
          </motion.div>
          <span className="text-[13px] font-extrabold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
            Running Task Flow
            <span className="text-[11px] font-bold text-blue-500 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">
              {formatDuration(durationSeconds) || 'Active'}
            </span>
          </span>
        </div>

        {logs.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 text-[10px] font-bold text-stone-400 hover:text-blue-500 dark:text-stone-500 dark:hover:text-blue-400 transition-colors py-1 px-2 rounded-lg hover:bg-stone-50 dark:hover:bg-[#1b2735]"
          >
            <span>{isExpanded ? 'Hide' : 'Show'} Terminal Logs</span>
            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* 2. Redesigned Premium Visual Timeline Node Flow */}
      <div className="my-5 px-1">
        <div className="grid grid-cols-2 gap-3 md:flex md:items-center md:justify-between md:gap-2 select-none">
          {stepNodes.map((node, idx) => {
            const Icon = node.icon
            const isCompleted = node.state === 'completed'
            const isActive = node.state === 'active'
            const isPending = node.state === 'pending'

            return (
              <React.Fragment key={node.id}>
                {/* Visual Step Node */}
                <div className="flex items-center gap-3 md:flex-1 min-w-0">
                  <div className="relative shrink-0">
                    {/* Glowing outer animation for Active node */}
                    {isActive && (
                      <span className="absolute -inset-1 rounded-xl bg-blue-500/20 blur-xs animate-pulse" />
                    )}

                    {/* Node Core */}
                    <div
                      className={cn(
                        'w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 shadow-xs',
                        isCompleted
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 border-emerald-200 dark:border-emerald-900/60'
                          : isActive
                            ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-500 border-blue-300 dark:border-blue-800'
                            : 'bg-stone-50 dark:bg-stone-900/30 text-stone-400 dark:text-stone-600 border-stone-200 dark:border-stone-850'
                      )}
                    >
                      {isCompleted ? (
                        <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                      ) : isActive ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Step Label */}
                  <div className="min-w-0 text-left">
                    <p
                      className={cn(
                        'text-xs font-bold leading-tight truncate',
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isActive
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-stone-400 dark:text-stone-600'
                      )}
                    >
                      {node.label}
                    </p>
                    <span className="text-[9px] font-bold text-stone-400/80 dark:text-stone-600/80 block mt-0.5 uppercase tracking-wide">
                      {isCompleted ? 'Done' : isActive ? 'Running' : 'Waiting'}
                    </span>
                  </div>
                </div>

                {/* Connecting Line (Only between nodes in desktop flex mode) */}
                {idx < stepNodes.length - 1 && (
                  <div className="hidden md:block w-8 shrink-0">
                    <div
                      className={cn(
                        'h-[2px] w-full rounded-full transition-colors duration-300',
                        isCompleted
                          ? 'bg-emerald-500/85'
                          : 'bg-stone-200 dark:bg-stone-800'
                      )}
                    />
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* 3. Collapsible Verbose Execution Terminal Logs */}
      <AnimatePresence initial={false}>
        {isExpanded && logs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-xl bg-stone-950 p-3.5 border border-stone-850">
              <div className="flex items-center gap-2 text-stone-500 text-[10px] font-bold uppercase tracking-wider mb-2 select-none border-b border-stone-800/60 pb-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Console Exec Logs</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {logs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -4, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: Math.min(index * 0.03, 0.2) }}
                    className="flex items-start gap-2 text-left"
                  >
                    <span className="text-[10px] text-stone-600 select-none mt-0.5 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                    <span className="font-mono text-[10.5px] leading-relaxed text-stone-300 whitespace-pre-wrap break-all">
                      {log}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

ThinkingSkeleton.displayName = 'ThinkingSkeleton'
