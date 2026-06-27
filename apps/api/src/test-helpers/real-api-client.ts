/**
 * 当配置了 API_URL 时，请求真实 API。
 */

const trimBase = (base: string) => base.replace(/\/+$/, '')

async function realFetch(base: string, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(trimBase(base) + path, init)
}

function jsonHeaders(extra?: Record<string, string>) {
  return { 'Content-Type': 'application/json', ...extra }
}

export function createRealAppClient(baseUrl: string, origin?: string) {
  const originHeader = (origin || baseUrl).replace(/\/+$/, '')
  const authHeaders = (extra?: Record<string, string>) => ({
    ...jsonHeaders(extra),
    Origin: originHeader,
  })
  return {
    api: {
      auth: {
        'token': {
          $get: async (opts?: { header?: Record<string, string> }) =>
            realFetch(baseUrl, '/api/auth/token', {
              method: 'GET',
              headers: { ...opts?.header, Origin: originHeader },
            }),
        },
        'sign-in': {
          email: {
            $post: async (opts?: { json?: unknown, header?: Record<string, string> }) =>
              realFetch(baseUrl, '/api/auth/sign-in/email', {
                method: 'POST',
                headers: authHeaders(opts?.header),
                body: opts?.json ? JSON.stringify(opts.json) : undefined,
              }),
          },
        },
        'sign-up': {
          email: {
            $post: async (opts?: { json?: unknown, header?: Record<string, string> }) =>
              realFetch(baseUrl, '/api/auth/sign-up/email', {
                method: 'POST',
                headers: authHeaders(opts?.header),
                body: opts?.json ? JSON.stringify(opts.json) : undefined,
              }),
          },
        },
      },
    },
  }
}
