import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { type Artifact, ArtifactSheet } from './artifact-sheet'

describe('artifactSheet Component', () => {
  const artifacts: Artifact[] = [
    {
      id: 'art-1',
      name: 'index.ts',
      type: 'script',
      sizeBytes: 1536,
      content: 'console.log("hello world");',
      updatedAt: new Date('2026-06-07T12:00:00Z'),
    },
    {
      id: 'art-2',
      name: 'data.csv',
      type: 'data',
      sizeBytes: 512,
      content: 'id,name\n1,Alice',
    },
  ]

  it('renders artifacts list with correct details', () => {
    render(<ArtifactSheet artifacts={artifacts} />)

    expect(screen.getByText('index.ts')).toBeInTheDocument()
    expect(screen.getByText(/SCRIPT\s*•\s*1\.5 KB/)).toBeInTheDocument()

    expect(screen.getByText('data.csv')).toBeInTheDocument()
    expect(screen.getByText(/DATA\s*•\s*512 B/)).toBeInTheDocument()
  })

  it('slides out sheet drawer with contents on item click', async () => {
    const user = userEvent.setup()
    const handleSelect = vi.fn()

    render(<ArtifactSheet artifacts={artifacts} onSelectArtifact={handleSelect} />)

    // Verify drawer content is initially hidden
    expect(screen.queryByText('console.log("hello world");')).not.toBeInTheDocument()

    // Click index.ts
    const row = screen.getByText('index.ts')
    await user.click(row)

    // Verify onSelectArtifact was called
    expect(handleSelect).toHaveBeenCalledWith(artifacts[0])

    // Drawer should slide in showing preview code and timestamps
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('console.log("hello world");')).toBeInTheDocument()

    // Click Close Button (find by Radix close button)
    const closeBtn = screen.getByRole('button', { name: '' })
    await user.click(closeBtn)

    // Drawer should close (wait for exit animation to unmount dialog)
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
