import type { Context, Next } from 'hono'
import * as HttpStatusCodes from 'stoker/http-status-codes'

import env from '@/env'

export async function maintenanceModeGuard(c: Context, next: Next) {
  if (env.MAINTENANCE_MODE) {
    const path = c.req.path
    const isExempt
      = path.startsWith('/api/system/')
        || path.startsWith('/api/auth/')
        || path.startsWith('/doc')
        || path.startsWith('/reference')
        || path === '/'

    if (!isExempt) {
      return c.json(
        {
          success: false,
          error: {
            issues: [
              {
                code: 'MAINTENANCE_MODE',
                message: 'System is under maintenance. Please try again later.',
                path: [],
              },
            ],
            name: 'MaintenanceError',
          },
        },
        HttpStatusCodes.SERVICE_UNAVAILABLE,
      )
    }
  }

  await next()
}
