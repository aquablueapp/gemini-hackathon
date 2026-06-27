import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AIChatBubble, type Message } from './ai-chat-bubble'

describe('aIChatBubble Component', () => {
  beforeEach(() => {
    // Define clean clipboard mock
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders user message aligned correctly', () => {
    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Clear emails',
    }

    const { container } = render(<AIChatBubble message={message} />)

    // Verify it renders user text
    expect(screen.getByText('Clear emails')).toBeInTheDocument()
    // Verify avatar contains User icon container class
    expect(container.querySelector('.bg-stone-100')).toBeInTheDocument()
  })

  it('renders model message with parsed markdown text', () => {
    const message: Message = {
      id: '2',
      role: 'model',
      content: '**Successfully** completed `task` running.',
    }

    render(<AIChatBubble message={message} />)

    // Verify strong tag is parsed and rendered
    const boldEl = screen.getByText('Successfully')
    expect(boldEl.tagName).toBe('STRONG')

    // Verify inline code is parsed and rendered
    const codeEl = screen.getByText('task')
    expect(codeEl.tagName).toBe('CODE')
  })

  it('supports clipboard copying of fenced code block', async () => {
    const message: Message = {
      id: '3',
      role: 'model',
      content: 'Here is the code:\n```typescript\nconst a = 1;\n```',
    }

    const handleCopySuccess = vi.fn()
    render(<AIChatBubble message={message} onCopySuccess={handleCopySuccess} />)

    // Verify code block is rendered
    expect(screen.getByText('typescript')).toBeInTheDocument()
    expect(screen.getByText('const a = 1;')).toBeInTheDocument()

    // Trigger copy click
    const copyButton = screen.getByRole('button', { name: /copy/i })
    fireEvent.click(copyButton)

    // Assert clipboard writeText was called immediately
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const a = 1;')

    // Wait for the Promise .then() microtask to resolve and invoke callback
    await waitFor(() => {
      expect(handleCopySuccess).toHaveBeenCalledOnce()
    })
  })
})
