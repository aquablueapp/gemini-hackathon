import { Check, LogOut, Pencil, Trash2, X } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'

export interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  badge?: string
  editable?: boolean
}

export interface SidebarGroup {
  title: string
  action?: SidebarItem
  items: SidebarItem[]
}

export interface UserProfile {
  name: string
  email: string
  avatarUrl?: string
}

export interface PremiumSidebarProps {
  groups: SidebarGroup[]
  activeItemId?: string
  userProfile?: UserProfile
  onItemSelect?: (item: SidebarItem) => void
  onItemRename?: (id: string, newLabel: string) => void
  onItemDelete?: (id: string) => void
  onLogout?: () => void
  className?: string
}

/**
 * PremiumSidebar component with employee navigation and account card states.
 */
export const PremiumSidebar: React.FC<PremiumSidebarProps> = ({
  groups,
  activeItemId,
  userProfile,
  onItemSelect,
  onItemRename,
  onItemDelete,
  onLogout,
  className,
}) => {
  const [editingItemId, setEditingItemId] = React.useState<string | null>(null)
  const [editingLabel, setEditingLabel] = React.useState('')

  return (
    <aside
      className={cn(
        'relative flex h-screen w-[260px] flex-col border-r border-[#a5b4c3] bg-[#d8ecff] dark:border-[#223145] dark:bg-[#131b26] shrink-0 select-none',
        className,
      )}
    >
      {/* Header Logotype */}
      <div className="flex h-16 items-center border-b border-[#a5b4c3]/70 px-5 dark:border-[#223145]/70 overflow-hidden shrink-0 pt-3">
        <div className="flex items-center overflow-hidden">
          <span className="truncate text-[22px] font-black text-blue-700 [text-shadow:0_1px_0_rgba(255,255,255,0.45)] dark:text-blue-400 dark:[text-shadow:0_1px_0_rgba(0,0,0,0.45)]">
            Aqua Blue
          </span>
        </div>
      </div>

      {/* Group List Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {groups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-2.5">
            <div className="flex items-center justify-between gap-2 px-2">
              <h3 className="min-w-0 truncate pl-1 text-[13px] font-semibold text-zinc-600 dark:text-stone-400">
                {group.title}
              </h3>
              {group.action && (
                <button
                  type="button"
                  onClick={() => onItemSelect?.(group.action!)}
                  className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-stone-200/80 bg-white/50 px-2 text-xs font-bold text-stone-700 shadow-2xs transition-colors hover:bg-white/80 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300 dark:hover:bg-stone-900"
                  title={group.action.label}
                >
                  {group.action.icon}
                  <span>New</span>
                </button>
              )}
            </div>

            {/* Links */}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = item.id === activeItemId
                const isEditing = editingItemId === item.id

                if (isEditing) {
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium bg-white/70 dark:bg-stone-900 border border-stone-200 dark:border-stone-850',
                      )}
                    >
                      <div className="shrink-0 text-stone-400">
                        {item.icon}
                      </div>
                      <input
                        type="text"
                        value={editingLabel}
                        onChange={e => setEditingLabel(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (editingLabel.trim()) {
                              onItemRename?.(item.id, editingLabel.trim())
                            }
                            setEditingItemId(null)
                          }
                          else if (e.key === 'Escape') {
                            setEditingItemId(null)
                          }
                        }}
                        className="flex-1 bg-transparent border-0 p-0 text-sm focus:ring-0 focus:outline-hidden text-stone-900 dark:text-stone-100"
                        autoFocus
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (editingLabel.trim()) {
                            onItemRename?.(item.id, editingLabel.trim())
                          }
                          setEditingItemId(null)
                        }}
                        className="p-0.5 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setEditingItemId(null)
                        }}
                        className="p-0.5 text-stone-400 hover:text-stone-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )
                }

                const renderIcon = () => {
                  if (item.id.startsWith('applet')) {
                    return (
                      <div className={cn(
                        'flex size-7 shrink-0 items-center justify-center rounded-full text-white text-[11px] font-bold transition-colors',
                        isActive ? 'bg-[#8b5a33]' : 'bg-[#b28a58]'
                      )}>
                        {item.label.charAt(0)}
                      </div>
                    )
                  }
                  return (
                    <div className={cn(
                      'shrink-0 flex items-center justify-center size-7 rounded-full transition-colors',
                      isActive 
                        ? 'text-stone-100 bg-stone-800/20 dark:text-stone-900 dark:bg-stone-200' 
                        : 'text-zinc-650 bg-white/20 dark:text-stone-400 dark:bg-stone-900/40'
                    )}>
                      {item.icon}
                    </div>
                  )
                }

                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    title={item.label}
                    onClick={() => onItemSelect?.(item)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onItemSelect?.(item)
                      }
                    }}
                    className={cn(
                      'flex h-[48px] w-full items-center gap-3 px-3 text-left text-[14px] font-bold transition-all cursor-pointer group justify-start relative focus:outline-hidden rounded-md',
                      isActive
                        ? 'bg-gradient-to-b from-[#6ca7ff] to-[#4384e7] text-white shadow-xs'
                        : 'text-zinc-950 hover:bg-white/35 dark:text-stone-300 dark:hover:bg-white/10',
                    )}
                  >
                    {renderIcon()}

                    <span className={cn('truncate flex-1 text-left', item.editable && 'pr-10')}>{item.label}</span>

                    {item.editable && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-inherit px-1 rounded-md">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingItemId(item.id)
                            setEditingLabel(item.label)
                          }}
                          className={cn(
                            'p-1 rounded-md hover:bg-white/25 cursor-pointer',
                            isActive ? 'text-white/80 hover:text-white' : 'text-stone-400 hover:text-stone-700 dark:hover:text-stone-250',
                          )}
                          title="Rename session"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onItemDelete?.(item.id)
                          }}
                          className={cn(
                            'p-1 rounded-md hover:bg-red-50/20 cursor-pointer',
                            isActive ? 'text-white/80 hover:text-white' : 'text-stone-400 hover:text-red-650 dark:hover:text-red-400',
                          )}
                          title="Delete session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {item.badge && !item.editable && (
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-xs font-semibold tracking-wide shrink-0',
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white/40 text-zinc-700 dark:bg-stone-800 dark:text-stone-400',
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer User Profile Card */}
      {userProfile && (
        <div className="border-t border-stone-100 p-3 dark:border-stone-900 shrink-0 bg-stone-50/50 dark:bg-stone-900/10">
          <div className="flex items-center justify-between gap-2 overflow-hidden">
            <div className="flex items-center gap-3 overflow-hidden flex-1">
              {/* User Avatar */}
              <div className="flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 font-bold border border-purple-200 dark:border-purple-900/50 shadow-xs">
                {userProfile.avatarUrl
                  ? (
                      <img
                        src={userProfile.avatarUrl}
                        alt={userProfile.name}
                        className="h-full w-full rounded-full object-cover"
                      />
                    )
                  : (
                      userProfile.name.charAt(0).toUpperCase()
                    )}
              </div>

              <div className="flex flex-col overflow-hidden text-left">
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                  {userProfile.name}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500 truncate">
                  {userProfile.email}
                </span>
              </div>
            </div>

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-200 transition-colors cursor-pointer shrink-0"
                title="Logout account"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  )
}

PremiumSidebar.displayName = 'PremiumSidebar'
