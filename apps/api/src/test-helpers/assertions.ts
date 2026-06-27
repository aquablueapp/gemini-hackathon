import * as HttpStatusCodes from 'stoker/http-status-codes'
import { expect } from 'vitest'

/**
 * 验证响应是否为标准的错误响应格式
 */
export async function expectErrorResponse(
  response: Response,
  expectedStatus: number,
  expectedErrorCode?: string,
) {
  expect(response.status).toBe(expectedStatus)
  const json = await response.json()
  expect(json.success).toBe(false)
  expect(json.error).toBeDefined()

  if (expectedErrorCode && json.error.issues) {
    const hasCode = json.error.issues.some((i: any) => i.code === expectedErrorCode)
    expect(hasCode).toBe(true)
  }

  return json
}

/**
 * 验证响应是否为 401 Unauthorized
 */
export async function expectUnauthorized(response: Response) {
  return expectErrorResponse(response, HttpStatusCodes.UNAUTHORIZED)
}

/**
 * 验证响应是否为 403 Forbidden
 */
export async function expectForbidden(response: Response) {
  return expectErrorResponse(response, HttpStatusCodes.FORBIDDEN)
}

/**
 * 验证响应是否为 422 Unprocessable Entity
 */
export async function expectValidationError(response: Response) {
  return expectErrorResponse(response, HttpStatusCodes.UNPROCESSABLE_ENTITY)
}

/**
 * 验证分页响应格式
 */
export function expectPaginatedResponse(json: any) {
  expect(json.data).toBeInstanceOf(Array)
  expect(json.pagination).toBeDefined()
  expect(typeof json.pagination.total).toBe('number')
  expect(typeof json.pagination.pageSize).toBe('number')
  expect(typeof json.pagination.currentPage).toBe('number')
  expect(typeof json.pagination.totalPages).toBe('number')
}
