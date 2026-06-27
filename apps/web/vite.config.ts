import path from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'

import { sentryVitePlugin } from '@sentry/vite-plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  return {
    server: {
      port: process.env.PORT ? parseInt(process.env.PORT, 10) : 7666,
    },
    build: {
      sourcemap: true,
    },
    resolve: {
      alias: [
        { find: /^@\/db\/(.*)$/, replacement: path.resolve(__dirname, '../api/src/db/$1') },
        { find: /^~(?=\/)/, replacement: path.resolve(__dirname, './src') },
        { find: /^@(?=\/)/, replacement: path.resolve(__dirname, './src') },
      ],
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({
        projects: ['./tsconfig.json'],
      }),
      tanstackStart(),
      react(),
    ],
  }
})
