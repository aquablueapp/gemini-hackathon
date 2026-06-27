import { useNavigate } from '@tanstack/react-router'
import { MessageSquare, Plus, Settings } from 'lucide-react'
import * as React from 'react'
import { ModeToggle } from '~/components/common/mode-toggle'
import { CredentialsConfig } from '~/components/CredentialsConfig'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '~/components/ui/dialog'
import { PremiumSidebar } from '~/components/ui/premium-sidebar'

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const [showSettings, setShowSettings] = React.useState(false)
  const navigate = useNavigate()

  // Sidebar navigation structure
  const sidebarGroups = [
    {
      title: 'Workspace',
      items: [
        { id: 'new-chat', label: 'New Chat', icon: <Plus className="w-4 h-4" /> },
      ],
    },
    {
      title: 'Recent Sessions',
      items: [
        {
          id: 'session-1',
          label: 'GCP Clean Up Script',
          icon: <MessageSquare className="w-4 h-4 text-stone-400 dark:text-stone-500" />,
        },
        {
          id: 'session-2',
          label: 'Deploy Firebase Rule',
          icon: <MessageSquare className="w-4 h-4 text-stone-400 dark:text-stone-500" />,
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          id: 'settings',
          label: 'Settings & API Keys',
          icon: <Settings className="w-4 h-4 text-stone-500" />,
        },
      ],
    },
  ]

  const userProfile = {
    name: 'Developer',
    email: 'developer@antigravity.ai',
  }

  const handleItemSelect = (item: any) => {
    if (item.id === 'new-chat') {
      navigate({ to: '/chat' })
    }
    else if (item.id === 'settings') {
      setShowSettings(true)
    }
    else if (item.id.startsWith('session-')) {
      navigate({ to: '/chat' })
    }
  }

  const handleLogout = () => {
    // Clear authorization cookie and redirect to login
    document.cookie = 'auth_session=; Max-Age=0; path=/'
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen w-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 overflow-hidden">
      {/* Premium sidebar module */}
      <PremiumSidebar
        groups={sidebarGroups}
        activeItemId="new-chat"
        userProfile={userProfile}
        onItemSelect={handleItemSelect}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden bg-stone-50 dark:bg-stone-950 relative">
        {/* Floating ModeToggle in the top right corner */}
        <div className="absolute top-4.5 right-6 z-40">
          <ModeToggle />
        </div>
        {children}
      </main>

      {/* Glassmorphic settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-xl p-0 overflow-hidden border-stone-200 dark:border-stone-800 bg-white/70 dark:bg-stone-900/70 backdrop-blur-xl shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Settings & Credentials Manager</DialogTitle>
            <DialogDescription>
              Configure API keys and credentials for subprocess runners.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[85vh] overflow-y-auto">
            <CredentialsConfig />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
