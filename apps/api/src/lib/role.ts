import type { AppContext } from './types'
import { APP_BINDING_KEYS, USER_ROLES } from './types'

export function isAdmin(c: AppContext) {
  return c.get(APP_BINDING_KEYS.USER_ROLE) === USER_ROLES.ADMIN
}

export function isPremium(c: AppContext) {
  const role = c.get(APP_BINDING_KEYS.USER_ROLE)
  return role === USER_ROLES.ADMIN || role === USER_ROLES.PREMIUM
}
