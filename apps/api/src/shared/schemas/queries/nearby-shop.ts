import { z } from 'zod'

import { CommonQueryParamsSchema } from '@/shared/validators/common'

/**
 * 附近商店查询参数模式
 * 扩展通用查询参数，添加地理位置搜索字段
 */
export const NearbyShopsQueryParamsSchema = CommonQueryParamsSchema.extend({
  // 位置坐标（必填）
  longitude: z.coerce.number().min(-180).max(180).default(139.7731231),
  latitude: z.coerce.number().min(-90).max(90).default(35.6657113),

  // 搜索半径（米），默认1000米，最大10公里
  radius: z.coerce.number().positive().max(10000).default(1000),

  // 搜索关键词
  query: z.string().max(100).optional(),

  // 预算与营业状态
  budget: z.coerce.number().positive().optional(),
  openNow: z.coerce.boolean().optional(),
  snapshotId: z.string().optional(),

  // 用户互动过滤
  favoritesOnly: z.coerce.boolean().optional(),

  // 可选过滤条件
  categoryIds: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        return val.split(',').map(v => Number(v.trim())).filter(Boolean)
      }
      if (Array.isArray(val)) {
        return val.map(v => Number(v)).filter(Boolean)
      }
      if (typeof val === 'number') {
        return [val]
      }
      return val
    },
    z.array(z.number().int().positive()).optional(),
  ),

  // 评分范围过滤
  ratingScoreMin: z.coerce.number().min(0).max(5).optional(),
  ratingScoreMax: z.coerce.number().min(0).max(5).optional(),

  // 支付方式筛选
  acceptsCreditCard: z.coerce.boolean().optional(),
  acceptsElectronicMoney: z.coerce.boolean().optional(),
  acceptsQrCode: z.coerce.boolean().optional(),
})

export type NearbyShopsQueryParams = z.infer<typeof NearbyShopsQueryParamsSchema>
