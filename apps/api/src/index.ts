import path from 'node:path'
import { serve } from '@hono/node-server'
import { config } from 'dotenv'
import { expand } from 'dotenv-expand'

import app from './app'
import env from './env'

// 在 Node.js 环境中加载 .env 文件
expand(config({
  path: path.resolve(
    process.cwd(),

    process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  ),
}))

const port = env.PORT

console.log(`Server is running on port http://localhost:${port}/reference`)

serve({
  fetch: app.fetch,
  port,
})
