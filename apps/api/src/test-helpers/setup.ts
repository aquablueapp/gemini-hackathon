import { beforeAll } from 'vitest'

/**
 * 全局测试设置
 * 这个文件会在每个测试文件运行前执行 (由 vitest.config.ts 中的 setupFiles 指定)
 */

let isInitialized = false

beforeAll(async () => {
  if (!isInitialized) {
    isInitialized = true

    // 提高 listener 上限，避免 MaxListenersExceededWarning
    process.setMaxListeners(20)
  }
})
