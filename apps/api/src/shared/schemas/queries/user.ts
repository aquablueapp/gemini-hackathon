import { z } from 'zod'

import { CommonQueryParamsSchema } from '@/shared/validators/common'

/**
 * 用户查询参数模式
 * 扩展通用查询参数，添加用户特有的搜索字段
 */
export const userQueryParamsSchema = CommonQueryParamsSchema.extend({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  is_anonymous: z.coerce.boolean().optional(),
  email_confirmed: z.coerce.boolean().optional(),
  phone_confirmed: z.coerce.boolean().optional(),
  created_after: z.string().datetime().optional(),
  created_before: z.string().datetime().optional(),
  last_sign_in_after: z.string().datetime().optional(),
  last_sign_in_before: z.string().datetime().optional(),
})

export type UserQueryParams = z.infer<typeof userQueryParamsSchema>
