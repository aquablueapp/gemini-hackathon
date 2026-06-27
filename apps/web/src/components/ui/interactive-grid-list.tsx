import { motion } from 'framer-motion'
import { Calendar, Play, Sparkles, Tag } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'

export interface GridItem {
  id: string
  title: string
  description: string
  tags: string[]
  icon?: React.ReactNode
  updatedAt?: Date
  status?: 'idle' | 'running' | 'failed'
}

export interface InteractiveGridListProps {
  items: GridItem[]
  onItemClick?: (item: GridItem) => void
  onItemRun?: (item: GridItem, event: React.MouseEvent) => void
  availableTags?: string[]
  className?: string
}

/**
 * InteractiveGridList component representing workflow Applets with filter tabs.
 */
export const InteractiveGridList: React.FC<InteractiveGridListProps> = ({
  items,
  onItemClick,
  onItemRun,
  availableTags = [],
  className,
}) => {
  const [selectedTag, setSelectedTag] = React.useState('All')

  // Auto-extract tags from items if not provided
  const tags = React.useMemo(() => {
    if (availableTags.length > 0)
      return ['All', ...availableTags]
    const extracted = new Set<string>()
    items.forEach(item => item.tags.forEach(t => extracted.add(t)))
    return ['All', ...Array.from(extracted)]
  }, [items, availableTags])

  const filteredItems = React.useMemo(() => {
    if (selectedTag === 'All')
      return items
    return items.filter(item => item.tags.includes(selectedTag))
  }, [items, selectedTag])

  return (
    <div className={cn('w-full flex flex-col gap-4', className)}>
      {/* Tags Filter Tabs Bar */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-stone-200 pb-3 dark:border-stone-800 shrink-0">
        <div className="flex items-center gap-1 text-stone-400 dark:text-stone-500 mr-2 select-none">
          <Tag className="h-4 w-4" />
          <span className="text-xs font-semibold">Tags:</span>
        </div>
        {tags.map((tag) => {
          const isActive = tag === selectedTag
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={cn(
                'relative rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer select-none border',
                isActive
                  ? 'bg-stone-900 text-stone-50 border-stone-900 dark:bg-stone-50 dark:text-stone-950 dark:border-stone-50 shadow-xs'
                  : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 dark:bg-stone-950 dark:border-stone-850 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100',
              )}
            >
              {tag}
            </button>
          )
        })}
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.map(item => (
          <motion.div
            key={item.id}
            whileHover={{ y: -3 }}
            onClick={() => onItemClick?.(item)}
            className="group relative flex flex-col justify-between rounded-xl border border-stone-200 bg-white p-4 shadow-xs transition-all hover:shadow-md dark:border-stone-850 dark:bg-stone-950 hover:border-stone-300 dark:hover:border-stone-750 cursor-pointer text-left"
          >
            <div>
              {/* Header Icon & Status */}
              <div className="flex items-center justify-between gap-3 mb-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-stone-50 border border-stone-100 text-stone-800 dark:bg-stone-900 dark:border-stone-800 dark:text-stone-100 shadow-2xs">
                  {item.icon ? item.icon : <Sparkles className="h-4.5 w-4.5" />}
                </div>

                {item.status && (
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                      item.status === 'running'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-950/40 dark:text-blue-300'
                        : item.status === 'failed'
                          ? 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-700/10 dark:bg-red-950/40 dark:text-red-300'
                          : 'bg-stone-100 text-stone-600 dark:bg-stone-900 dark:text-stone-400',
                    )}
                  >
                    {item.status}
                  </span>
                )}
              </div>

              {/* Title & Desc */}
              <h4 className="text-sm font-semibold text-stone-900 dark:text-stone-50 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {item.title}
              </h4>
              <p className="mt-1 text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Footer Meta */}
            <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 dark:border-stone-900">
              <div className="flex items-center gap-1.5 text-[10px] text-stone-400 dark:text-stone-500">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {item.updatedAt
                    ? new Date(item.updatedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Updated recently'}
                </span>
              </div>

              {/* Action Hover Trigger */}
              {onItemRun && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onItemRun(item, e)
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-900 text-stone-50 opacity-0 group-hover:opacity-100 hover:scale-105 active:scale-95 transition-all shadow-xs cursor-pointer dark:bg-stone-100 dark:text-stone-950 shrink-0"
                  title="Run Applet"
                >
                  <Play className="h-3.5 w-3.5 fill-current" />
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

InteractiveGridList.displayName = 'InteractiveGridList'
