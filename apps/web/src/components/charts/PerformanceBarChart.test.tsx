import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import PerformanceBarChart from './PerformanceBarChart'

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

describe('PerformanceBarChart', () => {
  const mockData = [
    { name: 'Unoptimized (Latency)', value: 1200, type: 'before' as const },
    { name: 'Optimized (Latency)', value: 300, type: 'after' as const },
  ]

  it('renders without crashing with mock data', () => {
    const { container } = render(<PerformanceBarChart data={mockData} />)
    expect(container).toBeDefined()
    const wrapper = container.querySelector('.recharts-wrapper')
    expect(wrapper).not.toBeNull()
  })

  it('renders fallback when no data is provided', () => {
    const { container } = render(<PerformanceBarChart data={[]} />)
    expect(container.textContent).toContain('No Data Available')
  })
})
