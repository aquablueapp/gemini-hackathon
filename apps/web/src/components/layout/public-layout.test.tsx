import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PublicLayout } from './public-layout'

// Mock the TanStack Router asynchronously to avoid hoisting references issues
vi.mock('@tanstack/react-router', async () => {
  const React = await import('react')
  return {
    Link: React.forwardRef<HTMLAnchorElement, any>(({ to, children, ...props }, ref) => (
      <a href={to} ref={ref} {...props}>{children}</a>
    )),
    useParams: vi.fn().mockReturnValue({ locale: 'en' }),
    useNavigate: vi.fn().mockReturnValue(vi.fn()),
  }
})

// Mock use-intl
vi.mock('use-intl', () => ({
  useLocale: vi.fn().mockReturnValue('en'),
  useTranslations: vi.fn().mockReturnValue((key: string) => key),
}))

// Mock the fetch call in CredentialsConfig
global.fetch = vi.fn()

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
}

describe('publicLayout', () => {
  it('should render the left sidebar with New Chat and Settings buttons', () => {
    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <PublicLayout>
          <div>Main Content</div>
        </PublicLayout>
      </QueryClientProvider>,
    )

    // The left sidebar should have a "New Chat" button
    expect(screen.getByRole('button', { name: /new chat/i })).toBeInTheDocument()

    // The settings gear button should be present in the sidebar
    expect(screen.getByRole('button', { name: /settings/i })).toBeInTheDocument()
  })

  it('should open the CredentialsConfig settings modal when the gear button is clicked', async () => {
    // Mock the fetch for credentials query
    ;(fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    })

    const user = userEvent.setup()

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <PublicLayout>
          <div>Main Content</div>
        </PublicLayout>
      </QueryClientProvider>,
    )

    // Initially, the Credential Manager should NOT be visible
    expect(screen.queryByText('Credential Manager')).not.toBeInTheDocument()

    // Click settings button
    const settingsBtn = screen.getByRole('button', { name: /settings/i })
    await user.click(settingsBtn)

    // The settings modal should be in the DOM
    expect(await screen.findByText('Credential Manager')).toBeInTheDocument()
    expect(screen.getByText(/Securely encrypt and inject tokens/i)).toBeInTheDocument()
  })
})
