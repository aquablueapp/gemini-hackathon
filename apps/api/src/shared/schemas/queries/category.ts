import { z } from 'zod'

import { CommonQueryParamsSchema } from '@/shared/validators/common'

/**
 * 分类查询参数模式
 */
export const CategoryQueryParamsSchema = CommonQueryParamsSchema.extend({
  // 基本信息搜索
  id: z.coerce.number().int().positive().optional(),
  name: z.string().optional(),
  cn: z.string().optional(),
  tw: z.string().optional(),
  kr: z.string().optional(),
  en: z.string().optional(),
  sourceId: z.string().optional(),
})

export type CategoryQueryParams = z.infer<typeof CategoryQueryParamsSchema>
