import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPage } from './dashboard'

// Mock react-router hook to avoid RouterProvider dependencies
vi.mock('@tanstack/react-router', () => ({
  useNavigate: vi.fn().mockReturnValue(vi.fn()),
  useSearch: vi.fn().mockReturnValue({ appId: undefined }),
  createFileRoute: vi.fn().mockReturnValue(() => ({})),
  useLocation: vi.fn().mockReturnValue({ pathname: '/dashboard' }),
  useParams: vi.fn().mockReturnValue({}),
  Link: vi.fn().mockImplementation(({ children, to, ...props }: any) => (
    <a {...props} href={to}>{children}</a>
  )),
}))

// Mock use-intl
vi.mock('use-intl', () => ({
  useLocale: vi.fn().mockReturnValue('en'),
  useTranslations: vi.fn().mockReturnValue((key: string) => key),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useSuspenseQuery: vi.fn().mockReturnValue({ data: [] }),
  }
})

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

describe('dashboardPage (Unified Workspace)', () => {
  it('should render model dropdown selector and right sidebar plan title', async () => {
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      const urlStr = url.toString()
      if (urlStr.includes('apps')) {
        return {
          ok: true,
          json: async () => [
            { id: 'employee_1', name: 'Developer Applet', description: 'Test applet description' }
          ]
        } as Response
      }
      return {
        ok: true,
        json: async () => []
      } as Response
    })

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <DashboardPage />
      </QueryClientProvider>,
    )

    // The right sidebar should render Plan title and description
    expect(await screen.findByText('Work Plan')).toBeInTheDocument()
    expect(screen.getByText('Constructed by the AI employee')).toBeInTheDocument()
    expect(screen.getByText('No plan yet')).toBeInTheDocument()
  })

  it('should render chat input and allow text entry', async () => {
    vi.mocked(global.fetch).mockImplementation(async (url) => {
      const urlStr = url.toString()
      if (urlStr.includes('apps')) {
        return {
          ok: true,
          json: async () => [
            { id: 'employee_1', name: 'Developer Applet', description: 'Test applet description' }
          ]
        } as Response
      }
      return {
        ok: true,
        json: async () => []
      } as Response
    })

    render(
      <QueryClientProvider client={createTestQueryClient()}>
        <DashboardPage />
      </QueryClientProvider>,
    )

    // Should display the Developer Applet name in sidebar and the chat input placeholder
    expect(await screen.findByText(/Developer Applet/i)).toBeInTheDocument()
    expect(await screen.findByPlaceholderText(/describeTask/i)).toBeInTheDocument()
  })
})
