import { AnimatePresence, motion } from 'framer-motion'
import { AlertCircle, Mic, Square } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'

export interface VoiceMicInputProps {
  onVoiceInput: (blob: Blob) => void
  onError?: (error: Error) => void
  disabled?: boolean
  className?: string
}

/**
 * VoiceMicInput component that captures audio via MediaRecorder and shows high-fidelity CSS waveform animations.
 */
export const VoiceMicInput: React.FC<VoiceMicInputProps> = ({
  onVoiceInput,
  onError,
  disabled = false,
  className,
}) => {
  const [isRecording, setIsRecording] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const streamRef = React.useRef<MediaStream | null>(null)
  const chunksRef = React.useRef<Blob[]>([])

  // Cleanup media tracks on unmount
  React.useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const startRecording = async () => {
    setHasError(false)
    try {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices || !window.MediaRecorder) {
        throw new Error('Recording API is not supported in this browser environment.')
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        onVoiceInput(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    }
    catch (err: any) {
      setHasError(true)
      if (onError) {
        onError(err)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }

  const handleToggle = () => {
    if (isRecording) {
      stopRecording()
    }
    else {
      startRecording()
    }
  }

  // Animation variants for wave bars
  const waveBars = [1, 2, 3, 4, 5]

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={handleToggle}
        className={cn(
          'relative flex h-10 w-10 items-center justify-center rounded-full border transition-all focus:outline-none focus:ring-1 focus:ring-stone-400 dark:focus:ring-stone-700 cursor-pointer shadow-sm',
          isRecording
            ? 'bg-red-500 text-white border-red-600 hover:bg-red-600 animate-pulse'
            : hasError
              ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        title={isRecording ? 'Stop recording' : 'Start voice input'}
      >
        {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </button>

      {/* Visual feedback panel */}
      <AnimatePresence mode="wait">
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50/50 px-3.5 py-1.5 dark:border-stone-800 dark:bg-stone-900/40"
          >
            <div className="flex items-center gap-1.5 h-4 select-none">
              {waveBars.map(bar => (
                <motion.div
                  key={bar}
                  className="w-1 rounded-full bg-purple-500 dark:bg-purple-400"
                  initial={{ height: 4 }}
                  animate={{
                    height: [4, 16, 4],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    delay: bar * 0.12,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 animate-pulse">
              Listening...
            </span>
          </motion.div>
        )}

        {hasError && !isRecording && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400"
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Mic error</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

VoiceMicInput.displayName = 'VoiceMicInput'
