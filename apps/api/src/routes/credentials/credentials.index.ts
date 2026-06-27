import { createRouter } from '@/lib/create-app'
import { saveCredential } from '@/services/credentials'
import * as handlers from './credentials.handlers'
import * as routes from './credentials.routes'

const router = createRouter()
  .openapi(routes.list, handlers.listConfiguredCredentials)
  .openapi(routes.save, handlers.saveUserCredential)

// Direct Hono routes for Google OAuth 2.0 flow
router.get('/auth/google', (c) => {
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  if (!clientId) {
    return c.html(`
      <div style="font-family:sans-serif;padding:2rem;text-align:center;max-width:600px;margin:auto;border:1px solid #e11d48;border-radius:12px;margin-top:4rem;">
        <h1 style="color:#e11d48;font-size:1.5rem;margin-bottom:1rem;">OAuth Configuration Missing</h1>
        <p style="color:#4b5563;line-height:1.6;">Please configure <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code> in your <code>.env</code> file to enable Google Slides OAuth authentication.</p>
      </div>
    `, 400)
  }
  const sessionId = c.req.query('sessionId') || ''
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || `${new URL(c.req.url).origin}/auth/google/callback`
  if (!process.env.GOOGLE_REDIRECT_URI && redirectUri.startsWith('http://') && !redirectUri.includes('localhost') && !redirectUri.includes('127.0.0.1')) {
    redirectUri = redirectUri.replace('http://', 'https://')
  }
  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
    `client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent('https://www.googleapis.com/auth/presentations')}` +
    `&access_type=offline` +
    `&prompt=consent` +
    (sessionId ? `&state=${encodeURIComponent(sessionId)}` : '')
  return c.redirect(oauthUrl)
})

router.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code')
  const state = c.req.query('state') || ''
  if (!code) {
    return c.html(`<div style="font-family:sans-serif;padding:2rem;text-align:center;"><h1>Authentication Error</h1><p>Missing authorization code from Google.</p></div>`, 400)
  }
  const clientId = process.env.GOOGLE_CLIENT_ID || ''
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || ''
  let redirectUri = process.env.GOOGLE_REDIRECT_URI || `${new URL(c.req.url).origin}/auth/google/callback`
  if (!process.env.GOOGLE_REDIRECT_URI && redirectUri.startsWith('http://') && !redirectUri.includes('localhost') && !redirectUri.includes('127.0.0.1')) {
    redirectUri = redirectUri.replace('http://', 'https://')
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text()
      throw new Error(`Google token exchange failed: ${errBody}`)
    }

    const tokens = await tokenRes.json() as any
    const credentialsData = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + (tokens.expires_in || 3600) * 1000,
    }

    await saveCredential('google', JSON.stringify(credentialsData))

    let frontendUrl = process.env.APP_URL || 'http://localhost:7666'
    if (frontendUrl.includes('localhost:7667') || frontendUrl.includes('127.0.0.1:7667')) {
      frontendUrl = frontendUrl.replace('7667', '7666')
    }

    const redirectUrl = state
      ? `${frontendUrl}/dashboard?sessionId=${decodeURIComponent(state)}&auth_success=google`
      : `${frontendUrl}/dashboard?auth_success=google`

    return c.redirect(redirectUrl)
  }
  catch (err: any) {
    console.error('Google OAuth callback failed:', err)
    return c.html(`
      <div style="font-family:sans-serif;padding:2rem;text-align:center;max-width:600px;margin:auto;border:1px solid #e11d48;border-radius:12px;margin-top:4rem;">
        <h1 style="color:#e11d48;font-size:1.5rem;margin-bottom:1rem;">OAuth Callback Exchange Failed</h1>
        <p style="color:#4b5563;line-height:1.6;">${err.message}</p>
        <p style="color:#6b7280;font-size:0.875rem;margin-top:1rem;">Ensure your Google Client ID, Secret, and Redirect URIs match Google Cloud Console settings exactly.</p>
      </div>
    `, 500)
  }
})

export default router
