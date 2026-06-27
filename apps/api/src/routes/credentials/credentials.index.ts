import { createRouter } from '@/lib/create-app'
import * as handlers from './credentials.handlers'
import * as routes from './credentials.routes'

const router = createRouter()
  .openapi(routes.list, handlers.listConfiguredCredentials)
  .openapi(routes.save, handlers.saveUserCredential)

export default router
