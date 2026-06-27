import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayoutDashboard, Settings } from 'lucide-react'
import { describe, expect, it, vi } from 'vitest'
import { PremiumSidebar, type SidebarGroup } from './premium-sidebar'

describe('premiumSidebar Component', () => {
  const groups: SidebarGroup[] = [
    {
      title: 'General',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard /> },
        { id: 'settings', label: 'Settings', icon: <Settings />, badge: 'New' },
      ],
    },
  ]

  const userProfile = {
    name: 'Yinlei',
    email: 'yinlei@example.com',
  }

  it('renders sidebar groups, titles, and link text', () => {
    render(<PremiumSidebar groups={groups} activeItemId="dashboard" userProfile={userProfile} />)

    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByText('New')).toBeInTheDocument()
    expect(screen.getByText('Yinlei')).toBeInTheDocument()
  })

  it('allows clicking items to invoke select callback', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()

    render(
      <PremiumSidebar
        groups={groups}
        activeItemId="dashboard"
        userProfile={userProfile}
        onItemSelect={handleSelect}
      />,
    )

    const settingsBtn = screen.getByText('Settings')
    await user.click(settingsBtn)

    expect(handleSelect).toHaveBeenCalledOnce()
    expect(handleSelect.mock.calls[0][0].id).toBe('settings')
  })

  it('renders text-only Aqua Blue brand without collapse controls', () => {
    render(<PremiumSidebar groups={groups} activeItemId="dashboard" userProfile={userProfile} />)

    expect(screen.getByText('Aqua Blue')).toBeInTheDocument()
    expect(screen.getByText('General')).toBeInTheDocument()
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.queryByTitle('Collapse sidebar')).not.toBeInTheDocument()
    expect(screen.queryByTitle('Expand sidebar')).not.toBeInTheDocument()
  })
})
