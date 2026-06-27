import type { z } from '@hono/zod-openapi'
import type { z as z4 } from 'zod' // 在本项目中，我们已经统一升级到了 Zod 4 (4.3.6)

/**
 * 辅助函数：将 Zod 4 schema 类型安全地转换为 Hono Zod OpenAPI 期望的类型
 */
export function toZodV4SchemaTyped<T extends z4.ZodTypeAny>(
  schema: T,
) {
  return schema as unknown as z.ZodType<z4.infer<T>>
}
