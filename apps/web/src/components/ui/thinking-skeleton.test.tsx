import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { ThinkingSkeleton } from './thinking-skeleton'

describe('thinkingSkeleton Component', () => {
  it('renders nothing when isThinking is false', () => {
    const { container } = render(
      <ThinkingSkeleton isThinking={false} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders progress and animation when isThinking is true', () => {
    render(<ThinkingSkeleton isThinking={true} durationSeconds={12} />)

    // Use regular expression matchers to handle joint text nodes
    expect(screen.getByText(/Thinking/)).toBeInTheDocument()
    expect(screen.getByText(/\(12s\)/)).toBeInTheDocument()
  })

  it('allows expanding and collapsing subagent step logs', async () => {
    const user = userEvent.setup()
    const logs = ['Accessing sandbox...', 'Writing credentials.json', 'Done.']

    render(<ThinkingSkeleton isThinking={true} logs={logs} />)

    // Verify step list is automatically expanded when logs are passed
    expect(screen.getByText('Accessing sandbox...')).toBeInTheDocument()
    expect(screen.getByText('Writing credentials.json')).toBeInTheDocument()

    // Collapse logs by clicking the interactive header
    const header = screen.getByText(/Thinking/).closest('div')!
    await user.click(header)

    // Verify it is collapsed (wait for framer-motion exit transition to finish unmounting)
    await waitFor(() => {
      expect(screen.queryByText('Accessing sandbox...')).not.toBeInTheDocument()
    })
  })
})
