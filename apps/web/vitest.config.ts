import path from 'node:path'
import { fileURLToPath } from 'node:url'
import viteReact from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    viteReact(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
  ],
  resolve: {
    alias: [
      { find: /^@\/db\/(.*)$/, replacement: path.resolve(__dirname, '../api/src/db/$1') },
      { find: /^~(?=\/)/, replacement: path.resolve(__dirname, './src') },
      { find: /^@(?=\/)/, replacement: path.resolve(__dirname, './src') },
      { find: /^node:stream\/web$/, replacement: path.resolve(__dirname, 'src/stubs/node-stream-web.ts') },
      { find: /^node:stream$/, replacement: path.resolve(__dirname, 'src/stubs/node-stream.ts') },
      { find: /^node:async_hooks$/, replacement: path.resolve(__dirname, 'src/stubs/node-async-hooks.ts') },
      { find: /^node:http$/, replacement: path.resolve(__dirname, 'src/stubs/node-http.ts') },
      { find: /^node:https$/, replacement: path.resolve(__dirname, 'src/stubs/node-https.ts') },
    ],
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'src/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/routeTree.gen.ts',
      ],
    },
  },
})
