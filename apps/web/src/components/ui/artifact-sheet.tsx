import * as DialogPrimitive from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import { Calendar, Eye, FileCode, FileSpreadsheet, FileText, HardDrive, X } from 'lucide-react'
import * as React from 'react'
import { cn } from '~/utils/cn'

export interface Artifact {
  id: string
  name: string
  type: 'script' | 'data' | 'log' | 'other'
  sizeBytes?: number
  content?: string
  updatedAt?: Date
}

export interface ArtifactSheetProps {
  artifacts: Artifact[]
  selectedArtifactId?: string
  onSelectArtifact?: (artifact: Artifact) => void
  className?: string
}

function formatBytes(bytes?: number) {
  if (bytes === undefined)
    return ''
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

/**
 * ArtifactSheet component listing outputs from the Sandbox, and sliding out preview drawers on item clicks.
 */
export const ArtifactSheet: React.FC<ArtifactSheetProps> = ({
  artifacts,
  selectedArtifactId,
  onSelectArtifact,
  className,
}) => {
  const [activeArtifact, setActiveArtifact] = React.useState<Artifact | null>(null)
  const [isOpen, setIsOpen] = React.useState(false)

  // React to prop changes
  React.useEffect(() => {
    if (selectedArtifactId) {
      const found = artifacts.find(a => a.id === selectedArtifactId)
      if (found) {
        setActiveArtifact(found)
        setIsOpen(true)
      }
    }
  }, [selectedArtifactId, artifacts])

  const handleSelect = (artifact: Artifact) => {
    setActiveArtifact(artifact)
    setIsOpen(true)
    if (onSelectArtifact) {
      onSelectArtifact(artifact)
    }
  }

  const getIcon = (type: Artifact['type']) => {
    switch (type) {
      case 'script':
        return <FileCode className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
      case 'data':
        return <FileSpreadsheet className="h-4.5 w-4.5 text-blue-500 shrink-0" />
      case 'log':
        return <FileText className="h-4.5 w-4.5 text-purple-500 shrink-0" />
      default:
        return <FileText className="h-4.5 w-4.5 text-stone-400 shrink-0" />
    }
  }

  return (
    <div className={cn('w-full flex flex-col gap-2', className)}>
      {/* File List */}
      <div className="overflow-hidden rounded-xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950 shadow-sm">
        <div className="flex items-center gap-2 border-b border-stone-100 bg-stone-50/50 px-4 py-2.5 dark:border-stone-800 dark:bg-stone-900/40">
          <HardDrive className="h-4 w-4 text-stone-500" />
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300">
            Sandbox Outputs
          </span>
        </div>
        <div className="divide-y divide-stone-100 dark:divide-stone-900">
          {artifacts.length === 0
            ? (
                <div className="flex flex-col items-center justify-center py-6 text-stone-400 dark:text-stone-500 select-none">
                  <span className="text-xs">No artifacts generated yet.</span>
                </div>
              )
            : (
                artifacts.map(art => (
                  <div
                    key={art.id}
                    onClick={() => handleSelect(art)}
                    className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-stone-50/80 dark:hover:bg-stone-900/40 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      {getIcon(art.type)}
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {art.name}
                        </span>
                        <span className="text-[10px] text-stone-400 dark:text-stone-500">
                          {art.type.toUpperCase()}
                          {' '}
                          •
                          {formatBytes(art.sizeBytes)}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-md border border-stone-200 bg-white text-stone-500 opacity-0 group-hover:opacity-100 hover:text-stone-900 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:text-stone-100 shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
        </div>
      </div>

      {/* Slide-out Drawer Sheet */}
      <AnimatePresence>
        {isOpen && activeArtifact && (
          <DialogPrimitive.Root open={isOpen} onOpenChange={setIsOpen} modal={true}>
            <DialogPrimitive.Portal forceMount>
              {/* Overlay Backdrop */}
              <DialogPrimitive.Overlay asChild>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs"
                />
              </DialogPrimitive.Overlay>

              {/* Side Drawer Content */}
              <DialogPrimitive.Content asChild aria-describedby={undefined}>
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 26, stiffness: 240 }}
                  className="fixed right-0 top-0 bottom-0 z-50 h-full w-full sm:w-[500px] border-l border-stone-200 bg-white p-6 shadow-2xl dark:border-stone-800 dark:bg-stone-950 focus:outline-none flex flex-col"
                >
                  {/* Drawer Header */}
                  <div className="flex items-start justify-between border-b border-stone-100 pb-4 dark:border-stone-900 shrink-0">
                    <div className="flex items-center gap-3 overflow-hidden">
                      {getIcon(activeArtifact.type)}
                      <div className="flex flex-col gap-0.5 overflow-hidden">
                        <DialogPrimitive.Title className="text-base font-semibold text-stone-900 dark:text-stone-50 truncate">
                          {activeArtifact.name}
                        </DialogPrimitive.Title>
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {formatBytes(activeArtifact.sizeBytes)}
                          {' '}
                          •
                          {activeArtifact.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    <DialogPrimitive.Close className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 dark:hover:bg-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors cursor-pointer">
                      <X className="h-4.5 w-4.5" />
                    </DialogPrimitive.Close>
                  </div>

                  {/* Metadata and Content */}
                  <div className="flex-1 overflow-y-auto pt-4 space-y-4">
                    {/* Timestamp log */}
                    {activeArtifact.updatedAt && (
                      <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          Modified at:
                          {new Date(activeArtifact.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Preview Area */}
                    <div className="rounded-lg border border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-900 p-4 font-mono text-xs overflow-x-auto">
                      {activeArtifact.content
                        ? (
                            <pre className="text-stone-800 dark:text-stone-200 leading-relaxed">
                              <code>{activeArtifact.content}</code>
                            </pre>
                          )
                        : (
                            <span className="text-stone-400 dark:text-stone-500 italic">
                              No content preview available for this file type.
                            </span>
                          )}
                    </div>
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          </DialogPrimitive.Root>
        )}
      </AnimatePresence>
    </div>
  )
}

ArtifactSheet.displayName = 'ArtifactSheet'
