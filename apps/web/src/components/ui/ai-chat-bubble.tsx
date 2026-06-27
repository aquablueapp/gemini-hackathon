import { Bot, Check, Copy, User } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'
import { A2uiRenderer } from './a2ui-renderer'

export interface Message {
  id: string
  role: 'user' | 'model'
  content: string
  timestamp?: Date
}

export interface AIChatBubbleProps {
  message: Message
  className?: string
  onCopySuccess?: () => void
}

/**
 * Parses markdown bold and inline code elements.
 */
function formatInlineText(text: string) {
  const regex = /(\*\*.*?\*\*|`.*?`|\[.*?\]\(https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9-_]+(?:\/\S*)?\)|https:\/\/docs\.google\.com\/presentation\/d\/[a-zA-Z0-9-_]+(?:\/\S*)?)/g
  const parts = text.split(regex)

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-stone-900 dark:text-stone-50">
          {part.slice(2, -2)}
        </strong>
      )
    }
    else if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-mono text-xs border border-stone-200 dark:border-stone-700"
        >
          {part.slice(1, -1)}
        </code>
      )
    }
    else if (part.startsWith('[') && part.includes('](https://docs.google.com/presentation/d/')) {
      const labelMatch = part.match(/\[(.*?)\]/)
      const urlMatch = part.match(/\((.*?)\)/)
      const label = labelMatch ? labelMatch[1] : 'Open in Google Slides'
      const url = urlMatch ? urlMatch[1] : ''
      return (
        <span key={index} className="inline-block mx-1 my-0.5">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {label}
          </a>
        </span>
      )
    }
    else if (part.startsWith('https://docs.google.com/presentation/d/')) {
      return (
        <span key={index} className="inline-block mx-1 my-0.5">
          <a
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer"
          >
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 12l3-3 3 3 4-4M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Open in Google Slides
          </a>
        </span>
      )
    }
    return part
  })
}

/**
 * Text block representing regular lines in markdown, split by newline.
 */
function TextBlock({ text }: { text: string }) {
  const lines = text.split('\n')
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} className="min-h-[1.25rem] mb-2 last:mb-0 leading-relaxed text-sm">
          {formatInlineText(line)}
        </p>
      ))}
    </>
  )
}

/**
 * Code block with copy actions and syntax container styling.
 */
function CodeBlock({
  code,
  language,
  onCopy,
}: {
  code: string
  language: string
  onCopy: (text: string) => void
}) {
  const [copied, setCopied] = React.useState(false)

  const handleCopy = () => {
    onCopy(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-3 overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 font-mono text-sm shadow-sm">
      <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 bg-stone-100/80 dark:bg-stone-900/80 px-4 py-1.5 text-xs text-stone-500 dark:text-stone-400">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied
            ? (
                <Check className="h-3.5 w-3.5 text-green-500" />
              )
            : (
                <Copy className="h-3.5 w-3.5" />
              )}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="text-xs text-stone-800 dark:text-stone-200">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  )
}

/**
 * AIChatBubble component that differentiates User prompts from Model completions.
 */
export const AIChatBubble: React.FC<AIChatBubbleProps> = ({
  message,
  className,
  onCopySuccess,
}) => {
  const isUser = message.role === 'user'

  const handleCopyToClipboard = (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        if (onCopySuccess) {
          onCopySuccess()
        }
      })
    }
  }

  const renderContent = () => {
    // Split content by markdown code block boundaries
    const parts = message.content.split(/(```[\s\S]*?```)/g)

    return parts.map((part, index) => {
      if (part.startsWith('```') && part.endsWith('```')) {
        const match = part.match(/```([\w+-]*)\n([\s\S]*?)```/)
        const language = match ? match[1] : ''
        const code = match ? match[2] : part.slice(3, -3)

        if (language === 'json+a2ui' || language === 'a2ui') {
          return (
            <A2uiRenderer
              key={index}
              payload={code.trim()}
            />
          )
        }

        return (
          <CodeBlock
            key={index}
            code={code.trim()}
            language={language}
            onCopy={handleCopyToClipboard}
          />
        )
      }
      else {
        return <TextBlock key={index} text={part} />
      }
    })
  }

  return (
    <div
      className={cn(
        'flex w-full gap-3 py-4 md:px-4',
        isUser ? 'flex-row-reverse' : 'flex-row',
        className,
      )}
    >
      {/* Icon / Avatar */}
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm',
          isUser
            ? 'bg-stone-100 text-stone-900 border-stone-200 dark:bg-stone-800 dark:text-stone-50 dark:border-stone-700'
            : 'bg-stone-900 text-stone-50 border-stone-800 dark:bg-stone-100 dark:text-stone-900 dark:border-stone-200',
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Bubble Container */}
      <div
        className={cn(
          'flex max-w-[85%] flex-col rounded-2xl px-4 py-2.5 shadow-sm border',
          isUser
            ? 'bg-stone-50 text-stone-900 border-stone-200 dark:bg-stone-900 dark:text-stone-50 dark:border-stone-800 rounded-tr-none'
            : 'bg-white text-stone-900 border-stone-200 dark:bg-stone-950 dark:text-stone-50 dark:border-stone-800 rounded-tl-none',
        )}
      >
        {/* Rendered Text & Code Blocks */}
        <div className="text-stone-800 dark:text-stone-200 space-y-1">
          {renderContent()}
        </div>

        {/* Timestamp */}
        {message.timestamp && (
          <span className="mt-1.5 self-end text-[10px] text-stone-400 dark:text-stone-500">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        )}
      </div>
    </div>
  )
}

AIChatBubble.displayName = 'AIChatBubble'
