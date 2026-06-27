import { z } from '@hono/zod-openapi'

export const authorizationHeaderSchema = z.object({
  Authorization: z.string().openapi({
    description: 'Bearer token for authentication',
    example: 'Bearer FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  }),
})

/**
 * 分页验证schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
})

/**
 * 排序验证schema
 */
export const sortSchema = z.object({
  field: z.string().min(1),
  order: z.enum(['asc', 'desc']).default('asc'),
})

/**
 * 通用查询参数模式
 * 包含分页和排序，统一API查询接口
 */
export const CommonQueryParamsSchema = z.object({
  // 分页参数
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(30),

  // 排序参数（支持多列排序）
  // 格式：columnId:asc|desc,columnId2:asc|desc
  sort: z
    .string()
    .optional()
    .refine(
      (val) => {
        if (!val)
          return true
        return val.split(',').every((part) => {
          const trimmed = part.trim()
          if (!trimmed)
            return false
          const [field, order] = trimmed.split(':')
          return field && field.length > 0 && (order === 'asc' || order === 'desc')
        })
      },
      { message: 'Invalid sort format. Expected: field:asc|desc,field2:asc|desc' },
    ),
})

export type CommonQueryParams = z.infer<typeof CommonQueryParamsSchema>

/**
 * 分页响应模式
 */
export const paginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: z.object({
    total: z.number().int().nonnegative(),
    pageSize: z.number().int().positive(),
    currentPage: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
  }),
})

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    pageSize: number
    currentPage: number
    totalPages: number
  }
}

/**
 * 日期验证schema
 */
export const dateSchema = z.coerce.date()

/**
 * ID验证schema
 */
export const idSchema = z.coerce.number().int().positive()

/**
 * 响应格式验证schema
 */
export const responseSchema = z.object({
  data: z.any(),
  meta: z
    .object({
      pagination: paginationSchema.extend({
        total: z.number().int().nonnegative(),
        pages: z.number().int().nonnegative(),
      }).optional(),
    })
    .optional(),
})

// 从schema推导类型
export type Pagination = z.infer<typeof paginationSchema>
export type Sort = z.infer<typeof sortSchema>
export type ApiResponse<T> = z.infer<typeof responseSchema> & { data: T }

/**
 * 创建分页响应Schema函数
 * @param schema 数据Schema
 * @returns 包装了分页信息的Schema
 */
export function PaginatedResponseSchema<T extends z.ZodType>(schema: T) {
  return z.object({
    data: z.array(schema),
    pagination: z.object({
      total: z.number().int().nonnegative(),
      pageSize: z.number().int().positive(),
      currentPage: z.number().int().positive(),
      totalPages: z.number().int().nonnegative(),
    }),
  })
}
