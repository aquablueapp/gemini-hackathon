import { Brain, Check, ChevronDown, Sparkles } from 'lucide-react'
import * as React from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import { cn } from '~/utils/cn'

export interface AIModel {
  id: string
  name: string
  description: string
  isThinking?: boolean
}

export interface RichModelSelectorProps {
  models: AIModel[]
  selectedModelId: string
  onSelect: (modelId: string) => void
  className?: string
  placeholder?: string
}

/**
 * RichModelSelector component that provides reasoning labels and model capability description.
 */
export const RichModelSelector: React.FC<RichModelSelectorProps> = ({
  models,
  selectedModelId,
  onSelect,
  className,
  placeholder = 'Select a model...',
}) => {
  const selectedModel = models.find(m => m.id === selectedModelId)

  // Renders the icon based on whether it is a thinking/reasoning model
  const renderModelIcon = (isThinking?: boolean) => {
    return isThinking
      ? (
          <Sparkles className="h-4 w-4 text-purple-500 dark:text-purple-400 shrink-0" />
        )
      : (
          <Brain className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0" />
        )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            'flex h-10 w-full max-w-[280px] items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm shadow-sm transition-colors hover:bg-stone-50 focus:outline-none focus:ring-1 focus:ring-stone-400 dark:border-stone-800 dark:bg-stone-950 dark:hover:bg-stone-900 dark:focus:ring-stone-700 cursor-pointer',
            className,
          )}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            {selectedModel
              ? (
                  <>
                    {renderModelIcon(selectedModel.isThinking)}
                    <span className="truncate font-medium text-stone-900 dark:text-stone-100">
                      {selectedModel.name}
                    </span>
                    {selectedModel.isThinking && (
                      <span className="hidden sm:inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-400/20">
                        Thinking
                      </span>
                    )}
                  </>
                )
              : (
                  <span className="text-stone-500 dark:text-stone-400">{placeholder}</span>
                )}
          </div>
          <ChevronDown className="h-4 w-4 text-stone-500 shrink-0" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className="w-[300px] border border-stone-200 bg-white p-1 shadow-lg dark:border-stone-800 dark:bg-stone-950 rounded-xl"
      >
        {models.map((model) => {
          const isSelected = model.id === selectedModelId
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onSelect(model.id)}
              className={cn(
                'flex items-start gap-3 rounded-lg px-2.5 py-2 transition-colors cursor-pointer text-left',
                isSelected
                  ? 'bg-stone-100/80 dark:bg-stone-900'
                  : 'hover:bg-stone-50 dark:hover:bg-stone-900/50',
              )}
            >
              {/* Left Model Icon */}
              <div className="mt-0.5 shrink-0">{renderModelIcon(model.isThinking)}</div>

              {/* Title & Description */}
              <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-semibold text-stone-900 dark:text-stone-100">
                    {model.name}
                  </span>
                  {model.isThinking && (
                    <span className="inline-flex items-center rounded bg-purple-50 px-1.5 py-0.5 text-[9px] font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-950/40 dark:text-purple-300 dark:ring-purple-400/20 shrink-0">
                      Thinking
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-500 dark:text-stone-400 leading-normal">
                  {model.description}
                </span>
              </div>

              {/* Checked Indicator */}
              {isSelected && (
                <Check className="h-4 w-4 text-stone-900 dark:text-stone-50 shrink-0 mt-0.5" />
              )}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

RichModelSelector.displayName = 'RichModelSelector'
