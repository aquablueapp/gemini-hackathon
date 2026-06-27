import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import CategoryPieChart from './CategoryPieChart'

// Mock ResponsiveContainer since Recharts' ResponsiveContainer relies on offsetWidth/offsetHeight which are 0 in test environment.
vi.mock('recharts', async () => {
  const original = await vi.importActual('recharts')
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: '100%', height: '100%' }} data-testid="responsive-container">{children}</div>
    ),
  }
})

describe('CategoryPieChart', () => {
  const mockData = [
    { name: 'Git Commits', value: 45 },
    { name: 'Google Docs', value: 30 },
    { name: 'Slack Sync', value: 15 },
    { name: 'Other Ref', value: 10 },
  ]

  it('renders without crashing with mock data', () => {
    const { container } = render(<CategoryPieChart data={mockData} />)
    expect(container).toBeDefined()
    const wrapper = container.querySelector('.recharts-wrapper')
    expect(wrapper).not.toBeNull()
  })

  it('renders fallback when no data is provided', () => {
    const { container } = render(<CategoryPieChart data={[]} />)
    expect(container.textContent).toContain('No Data Available')
  })
})
