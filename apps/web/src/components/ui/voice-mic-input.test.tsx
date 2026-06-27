import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VoiceMicInput } from './voice-mic-input'

describe('voiceMicInput Component', () => {
  const mockTrack = { stop: vi.fn() }
  const mockStream = {
    getTracks: () => [mockTrack],
  }

  // Define Mock MediaRecorder implementation
  class MockMediaRecorder {
    state = 'inactive'
    static instances: MockMediaRecorder[] = []
    ondataavailable?: (e: { data: Blob }) => void
    onstop?: () => void

    constructor(stream: MediaStream) {
      MockMediaRecorder.instances.push(this)
    }

    start() {
      this.state = 'recording'
    }

    stop() {
      this.state = 'inactive'
      // Mock returning a simple webm audio blob
      if (this.ondataavailable) {
        this.ondataavailable({ data: new Blob(['audio data'], { type: 'audio/webm' }) })
      }
      if (this.onstop) {
        this.onstop()
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    MockMediaRecorder.instances = []

    // Mock global mediaDevices API
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    })

    // Mock global MediaRecorder API
    Object.defineProperty(window, 'MediaRecorder', {
      writable: true,
      value: MockMediaRecorder,
    })
  })

  it('toggles recording state and displays wave animation', async () => {
    const user = userEvent.setup()
    const handleVoiceInput = vi.fn()

    render(<VoiceMicInput onVoiceInput={handleVoiceInput} />)

    // Initially should not be listening
    expect(screen.queryByText('Listening...')).not.toBeInTheDocument()

    const button = screen.getByRole('button')
    await user.click(button)

    // Verify stream was requested
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledOnce()

    // Listening label and animation wave should be visible
    expect(screen.getByText('Listening...')).toBeInTheDocument()

    // Stop recording by clicking again
    await user.click(button)

    // Verify callbacks are triggered on stop
    expect(handleVoiceInput).toHaveBeenCalledOnce()
    expect(handleVoiceInput.mock.calls[0][0]).toBeInstanceOf(Blob)
    expect(mockTrack.stop).toHaveBeenCalledOnce()
  })

  it('triggers error callback when recording permission is rejected', async () => {
    const user = userEvent.setup()
    const handleVoiceInput = vi.fn()
    const handleError = vi.fn()

    // Re-mock to reject permission
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new Error('Permission denied'))

    render(<VoiceMicInput onVoiceInput={handleVoiceInput} onError={handleError} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(handleError).toHaveBeenCalledOnce()
    expect(handleError.mock.calls[0][0].message).toBe('Permission denied')
    expect(screen.getByText('Mic error')).toBeInTheDocument()
  })
})
