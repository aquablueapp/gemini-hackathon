/**
 * 测试数据工厂 (Factory Pattern)
 * 提供符合 Schema 的随机或预定义测试数据
 */

import { faker } from '@faker-js/faker'

/**
 * 创建随机店铺数据 (用于 POST /shops)
 * 必填: sourceId (regex: /^\d+$/)
 * 可选: tel (regex: /^\d+-\d+-\d+$/), ratingScore, location
 */
export function createMockShop(overrides?: Record<string, unknown>) {
  return {
    sourceId: faker.string.numeric(10),
    tel: `${faker.string.numeric(2)}-${faker.string.numeric(4)}-${faker.string.numeric(4)}`,
    ratingScore: faker.number.float({ min: 1, max: 5, fractionDigits: 2 }).toString(),
    location: [faker.location.longitude(), faker.location.latitude()],
    ...overrides,
  }
}

/**
 * 创建随机类别数据 (用于 POST /categories)
 * 必填: name (min 1 char), sourceId (regex: /^\w+$/)
 */
export function createMockCategory(overrides?: Record<string, unknown>) {
  return {
    name: faker.commerce.department() + faker.string.alphanumeric(5),
    sourceId: faker.string.alphanumeric(8),
    ...overrides,
  }
}

/**
 * 创建随机语言数据 (用于 POST /languages)
 * 必填: code (unique), name
 */
export function createMockLanguage(overrides?: Record<string, unknown>) {
  return {
    name: faker.location.country(),
    code: faker.location.countryCode('alpha-2').toLowerCase() + faker.string.alphanumeric(3),
    ...overrides,
  }
}

/**
 * 创建随机排名快照数据 (用于 POST /rankings)
 * 必填: snapshotType, year, url, snapshotData
 */
export function createMockRanking(shopId: number, overrides?: Record<string, unknown>) {
  const snapshotType = (overrides?.snapshotType as string) || 'AWARD'
  return {
    id: `ranking-${faker.string.uuid()}`,
    shopId,
    snapshotType,
    year: faker.date.past().getFullYear(),
    url: faker.internet.url(),
    title: faker.lorem.sentence(),
    totalShops: 1,
    awardLevel: snapshotType === 'AWARD' ? 'GOLD' : undefined,
    snapshotData: {
      shops: [{ id: shopId.toString(), name: faker.company.name() }],
      metadata: { title: faker.lorem.words(3) },
    },
    ...overrides,
  }
}

/**
 * 创建随机店铺翻译数据 (用于 POST /shop-translations)
 * 必填: shopId, languageId, name (min 1), address (notNull), category (notNull)
 */
export function createMockShopTranslation(shopId: number, languageId: number, overrides?: Record<string, unknown>) {
  return {
    shopId,
    languageId,
    name: faker.company.name(),
    address: faker.location.streetAddress(),
    category: faker.commerce.department(),
    ...overrides,
  }
}

/**
 * 创建随机地区数据 (用于 POST /regions)
 */
export function createMockRegion(overrides?: Record<string, unknown>) {
  return {
    name: faker.location.city() + faker.string.alphanumeric(3),
    sourceId: faker.string.alphanumeric(8),
    ...overrides,
  }
}
