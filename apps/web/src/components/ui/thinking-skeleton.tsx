import { AnimatePresence, motion } from 'framer-motion'
import { Brain, ChevronDown, ChevronUp, Terminal } from 'lucide-react'
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
  const [isExpanded, setIsExpanded] = React.useState(false)

  // Auto-expand logs if a new log arrives
  React.useEffect(() => {
    if (logs.length > 0) {
      setIsExpanded(true)
    }
  }, [logs.length])

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

  return (
    <div
      className={cn(
        'w-full max-w-[640px] rounded-xl border border-stone-200 bg-stone-50/70 p-3 shadow-sm backdrop-blur-sm dark:border-stone-800 dark:bg-stone-900/40',
        className,
      )}
    >
      {/* Header / Toggle Control */}
      <div
        onClick={() => logs.length > 0 && setIsExpanded(!isExpanded)}
        className={cn(
          'flex items-center justify-between gap-3 text-stone-600 dark:text-stone-400 select-none',
          logs.length > 0 ? 'cursor-pointer hover:text-stone-900 dark:hover:text-stone-200' : '',
        )}
      >
        <div className="flex items-center gap-2">
          {/* Animated Brain Icon */}
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="shrink-0"
          >
            <Brain className="h-4.5 w-4.5 text-purple-500 dark:text-purple-400" />
          </motion.div>

          <span className="text-xs font-semibold tracking-wide">
            Thinking
            {formatDuration(durationSeconds)}
          </span>

          {/* Glowing loading dots */}
          <div className="flex items-center gap-1">
            <span className="h-1 w-1 rounded-full bg-purple-500/80 animate-bounce delay-75" />
            <span className="h-1 w-1 rounded-full bg-purple-500/80 animate-bounce delay-150" />
            <span className="h-1 w-1 rounded-full bg-purple-500/80 animate-bounce delay-300" />
          </div>
        </div>

        {logs.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] font-medium opacity-80">
            <span>
              {logs.length}
              {' '}
              steps
            </span>
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </div>
        )}
      </div>

      {/* Thinking Steps / Logs Panel */}
      <AnimatePresence initial={false}>
        {isExpanded && logs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 space-y-2 border-t border-stone-200/60 pt-3 dark:border-stone-800/60">
              {logs.map((log, index) => (
                <motion.div
                  key={index}
                  initial={{ x: -4, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: Math.min(index * 0.05, 0.3) }}
                  className="flex items-start gap-2.5 text-left"
                >
                  <Terminal className="mt-0.5 h-3 w-3 shrink-0 text-stone-400 dark:text-stone-500" />
                  <span className="font-mono text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
                    {log}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streaming placeholder bar (if no logs yet) */}
      {logs.length === 0 && (
        <div className="mt-3.5 space-y-2">
          <div className="h-2 w-3/4 rounded bg-stone-200 dark:bg-stone-800 animate-pulse" />
          <div className="h-2 w-1/2 rounded bg-stone-200/70 dark:bg-stone-800/70 animate-pulse delay-75" />
        </div>
      )}
    </div>
  )
}

ThinkingSkeleton.displayName = 'ThinkingSkeleton'
