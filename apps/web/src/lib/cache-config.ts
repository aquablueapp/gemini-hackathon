/**
 * 缓存配置
 */

export const CACHE_CONFIG = {
  // Session 数据缓存配置
  session: {
    staleTime: 1000 * 60 * 5, // 5 分钟
    gcTime: 1000 * 60 * 60, // 60 分钟
  },
  // 业务数据默认缓存配置
  default: {
    staleTime: 1000 * 60 * 1, // 1 分钟
    gcTime: 1000 * 60 * 5, // 5 分钟
  },
} as const
