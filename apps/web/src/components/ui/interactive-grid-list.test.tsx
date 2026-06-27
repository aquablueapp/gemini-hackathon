import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { type GridItem, InteractiveGridList } from './interactive-grid-list'

describe('interactiveGridList Component', () => {
  const items: GridItem[] = [
    {
      id: 'applet-1',
      title: 'Gmail Scraper Applet',
      description: 'Scrapes inbox for spam patterns.',
      tags: ['Gmail', 'Production'],
      status: 'idle',
    },
    {
      id: 'applet-2',
      title: 'Polymarket Arbitrage',
      description: 'Polls price spreads for tokens.',
      tags: ['Crypto', 'Drafts'],
      status: 'running',
    },
  ]

  it('renders grid cards and tag tabs correctly', () => {
    render(<InteractiveGridList items={items} />)

    expect(screen.getByText('Gmail Scraper Applet')).toBeInTheDocument()
    expect(screen.getByText('Polymarket Arbitrage')).toBeInTheDocument()

    // Verify tag tabs list
    expect(screen.getByText('All')).toBeInTheDocument()
    expect(screen.getByText('Gmail')).toBeInTheDocument()
    expect(screen.getByText('Crypto')).toBeInTheDocument()
  })

  it('filters grid cards when tag button is clicked', async () => {
    const user = userEvent.setup()
    render(<InteractiveGridList items={items} />)

    // Initially both elements are present
    expect(screen.getByText('Gmail Scraper Applet')).toBeInTheDocument()
    expect(screen.getByText('Polymarket Arbitrage')).toBeInTheDocument()

    // Click 'Gmail' filter tab
    const gmailTab = screen.getByRole('button', { name: 'Gmail' })
    await user.click(gmailTab)

    // Arbitrage item should be filtered out
    expect(screen.getByText('Gmail Scraper Applet')).toBeInTheDocument()
    expect(screen.queryByText('Polymarket Arbitrage')).not.toBeInTheDocument()
  })

  it('triggers onItemRun callback on action click', async () => {
    const user = userEvent.setup()
    const handleRun = vi.fn()

    render(<InteractiveGridList items={items} onItemRun={handleRun} />)

    // Run action is typically hidden/rendered inside card actions
    const runBtn = screen.getAllByRole('button', { name: /run/i })[0]
    await user.click(runBtn)

    expect(handleRun).toHaveBeenCalledOnce()
    expect(handleRun.mock.calls[0][0].id).toBe('applet-1')
  })
})
