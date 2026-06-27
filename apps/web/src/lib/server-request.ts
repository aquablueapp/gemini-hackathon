import { createIsomorphicFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

/**
 * 获取服务端请求对象
 * 使用 createIsomorphicFn 实现 SSR 与客户端的解耦，避免 Import Protection 报错
 */
export const getServerRequest = createIsomorphicFn()
  .server(() => {
    try {
      return getRequest()
    }
    catch (e) {
      return null
    }
  })
  .client(() => {
    return null
  })
