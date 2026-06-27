import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import handler from '../dist/server/server.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientRoot = path.relative(process.cwd(), path.resolve(__dirname, '../dist/client'))

const app = new Hono()

// Serve static assets from build output
app.use('/assets/*', serveStatic({ root: clientRoot || '.' }))
app.use('/manifest.js', serveStatic({ path: path.join(clientRoot, 'manifest.js') }))
app.use('/favicon.ico', serveStatic({ path: path.join(clientRoot, 'favicon.ico') }))

// Forward all other requests to React SSR handler directly to preserve stream pipelining
app.all('*', async (c) => {
  try {
    const res = await handler.fetch(c.req.raw)
    return res
  }
  catch (err) {
    console.error('SSR error:', err)
    return c.text('Internal Server Error', 500)
  }
})

const port = process.env.PORT ? Number.parseInt(process.env.PORT, 10) : 8080
console.log(`Server starting on port ${port}...`)
serve({
  fetch: app.fetch,
  port,
})
