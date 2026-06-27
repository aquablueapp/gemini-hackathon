import path from 'node:path'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import { defineConfig } from 'vitest/config'

// 在测试环境中加载 .env.test 文件
dotenvExpand.expand(dotenv.config({
  path: path.resolve(__dirname, '.env.test'),
}))

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Vitest 4 迁移：原 poolOptions.threads.singleThread 现在扁平化为 maxWorkers 和 isolate
    maxWorkers: 1,
    isolate: false,

    // 只跑 src 下的用例
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.turbo/**'],

    // 全局设置
    setupFiles: ['./src/test-helpers/setup.ts'],

    // 设置测试超时时间，确保数据库操作有足够时间
    testTimeout: 30000,
    hookTimeout: 30000,

    // 禁用文件级并行以避免数据库竞态
    fileParallelism: false,

    pool: 'threads',

    environment: 'node',
    globals: true,

    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/test-helpers/**',
        'src/db/migrations/**',
        'src/app.ts',
        'src/index.ts',
        'src/worker.ts',
        'src/env.ts',
      ],
      thresholds: {
        lines: 60,
        branches: 50,
        functions: 50,
        statements: 60,
      },
    },
  },
})
