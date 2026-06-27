import { z } from 'zod'

import { CommonQueryParamsSchema } from '@/shared/validators/common'

/**
 * 商店查询参数模式
 * 扩展通用查询参数，添加商店特有的搜索字段
 */
export const ShopQueryParamsSchema = CommonQueryParamsSchema.extend({
  // 基本信息搜索
  id: z.coerce.number().int().positive().optional(),
  sourceId: z.string().optional(),

  // 评分范围过滤
  ratingScoreMin: z.coerce.number().min(0).max(5).optional(),
  ratingScoreMax: z.coerce.number().min(0).max(5).optional(),

  // 支付方式筛选
  acceptsCreditCard: z.coerce.boolean().optional(),
  acceptsElectronicMoney: z.coerce.boolean().optional(),
  acceptsQrCode: z.coerce.boolean().optional(),

  // 联系信息搜索
  tel: z.string().optional(),

  // 分类过滤
  categoryIds: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.split(',').map(v => Number(v.trim())).filter(v => Number.isFinite(v) && v > 0)
      }
      if (Array.isArray(val)) {
        return val.map(v => Number(v)).filter(v => Number.isFinite(v) && v > 0)
      }
      if (typeof val === 'number') {
        return Number.isFinite(val) && val > 0 ? [val] : []
      }
      return val
    },
    z.array(z.number().int().positive()).optional(),
  ),
})

export type ShopQueryParams = z.infer<typeof ShopQueryParamsSchema>

/**
 * 带翻译的商店列表查询参数模式
 * 扩展 ShopQueryParamsSchema，但不直接包含 locale，locale 将从路径参数获取
 */
export const ShopListWithTranslationQueryParamsSchema = ShopQueryParamsSchema.extend({
  name: z.string().optional(),
  address: z.string().optional(),
  url: z.string().optional(),
})

export type ShopListWithTranslationQueryParams = z.infer<typeof ShopListWithTranslationQueryParamsSchema>
