import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PremiumLoginCard } from './premium-login-card'

describe('premiumLoginCard Component', () => {
  it('renders login credentials inputs and visibility buttons', async () => {
    const handleSubmit = vi.fn()
    render(<PremiumLoginCard onSubmit={handleSubmit} />)

    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()

    const passwordInput = screen.getByPlaceholderText('••••••••')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Toggle password visibility
    const user = userEvent.setup()
    const toggleBtn = screen.getByRole('button', { name: /show password/i })
    await user.click(toggleBtn)

    expect(passwordInput).toHaveAttribute('type', 'text')
  })

  it('validates empty submissions on client-side and triggers no onSubmit callback', async () => {
    const handleSubmit = vi.fn()
    render(<PremiumLoginCard onSubmit={handleSubmit} />)

    const form = screen.getByRole('button', { name: /sign in/i }).closest('form')!
    fireEvent.submit(form)

    // Callback should not be triggered due to validation failure
    expect(handleSubmit).not.toHaveBeenCalled()
  })

  it('submits valid forms and passes arguments correctly', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    render(<PremiumLoginCard onSubmit={handleSubmit} />)

    const emailInput = screen.getByPlaceholderText('developer@antigravity.ai')
    const passwordInput = screen.getByPlaceholderText('••••••••')
    const submitBtn = screen.getByRole('button', { name: /sign in/i })

    // Fill inputs
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'secure1234')
    await user.click(submitBtn)

    expect(handleSubmit).toHaveBeenCalledWith('test@example.com', 'secure1234')
  })

  it('triggers onSocialLogin callbacks on social OAuth clicks', async () => {
    const user = userEvent.setup()
    const handleSubmit = vi.fn()
    const handleSocial = vi.fn()

    render(
      <PremiumLoginCard
        onSubmit={handleSubmit}
        onSocialLogin={handleSocial}
      />,
    )

    const googleBtn = screen.getByRole('button', { name: /google/i })
    await user.click(googleBtn)

    expect(handleSocial).toHaveBeenCalledWith('google')
  })
})
