import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import * as LucideIcons from 'lucide-react'
import { Code, Trash2 } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'
import { getApiBaseUrl } from '~/lib/api-client'
import { Button } from './ui/button'
import { InteractiveGridList } from './ui/interactive-grid-list'

export interface Applet {
  id: string
  userId: string
  name: string
  description?: string
  icon: string
  color: string
  gcsPath: string
  dependencies: string[]
  createdAt: string
  updatedAt: string
}

interface AppletsGridProps {
  applets: Applet[]
  onRun: (id: string, name: string) => void
}

// Dynamically render a Lucide Icon by name
function DynamicIcon({ name, className }: { name: string, className?: string }) {
  const IconComponent = (LucideIcons as any)[name] || Code
  return <IconComponent className={className} />
}

/**
 * AppletsGrid component wrapping InteractiveGridList.
 */
export function AppletsGrid({ applets, onRun }: AppletsGridProps) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${getApiBaseUrl()}/apps/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        throw new Error('Failed to delete applet')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applets'] })
    },
  })

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this Applet?')) {
      deleteMutation.mutate(id)
    }
  }

  const handleEdit = (id: string) => {
    navigate({
      to: '/chat',
      search: { appId: id },
    })
  }

  if (applets.length === 0) {
    return (
      <div className="text-center py-16 bg-stone-50 dark:bg-stone-900/20 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800">
        <div className="w-12 h-12 bg-stone-100 dark:bg-stone-850 rounded-full flex items-center justify-center mx-auto mb-4 text-stone-400">
          <Code className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-stone-800 dark:text-stone-200 mb-1">No Applets compiled yet</h3>
        <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
          Chat with the AI Agent to build, verify, and compile your first automation workflow!
        </p>
        <Button onClick={() => navigate({ to: '/chat' })} className="font-bold">
          Start Chatting
        </Button>
      </div>
    )
  }

  // Predefined background color mapping for styling the icon
  const colorMap: Record<string, string> = {
    rose: 'text-rose-500 dark:text-rose-400',
    blue: 'text-blue-500 dark:text-blue-400',
    emerald: 'text-emerald-500 dark:text-emerald-400',
    amber: 'text-amber-500 dark:text-amber-400',
    violet: 'text-purple-500 dark:text-purple-400',
  }

  // Map database Applets to GridItem entities
  const gridItems = applets.map((applet) => {
    const colorClass = colorMap[applet.color] || colorMap.blue
    return {
      id: applet.id,
      title: applet.name,
      description: applet.description || 'No description provided.',
      tags: applet.dependencies.length > 0 ? applet.dependencies : ['Applet'],
      icon: <DynamicIcon name={applet.icon} className={cn('h-5 w-5', colorClass)} />,
      updatedAt: new Date(applet.updatedAt),
      status: 'idle' as const,
    }
  })

  // Extract all distinct dependency tags for tabs
  const allDeps = new Set<string>()
  applets.forEach(applet => applet.dependencies.forEach(d => allDeps.add(d)))

  return (
    <div className="space-y-4">
      <InteractiveGridList
        items={gridItems}
        availableTags={allDeps.size > 0 ? Array.from(allDeps) : ['Applet']}
        onItemClick={item => handleEdit(item.id)}
        onItemRun={item => onRun(item.id, item.title)}
      />

      <div className="flex justify-between items-center px-2 pt-2 border-t border-stone-100 dark:border-stone-900">
        <span className="text-[10px] text-stone-400 dark:text-stone-500 italic">
          * Click card to modify the workflow script. Use play button to run.
        </span>

        {/* List raw delete items if users want to purge compiled workflows */}
        <div className="flex gap-2.5">
          {applets.map(applet => (
            <button
              key={applet.id}
              onClick={e => handleDelete(e, applet.id)}
              disabled={deleteMutation.isPending}
              className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-red-500 dark:text-stone-500 dark:hover:text-red-400 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3 w-3" />
              <span className="truncate max-w-[80px]">
                Delete
                {applet.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
