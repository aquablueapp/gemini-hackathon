import { createRouter } from '@/lib/create-app'
import * as handlers from './apps.handlers'
import * as routes from './apps.routes'

const router = createRouter()
  .openapi(routes.list, handlers.listApplets)
  .openapi(routes.create, handlers.createApplet)
  .openapi(routes.remove, handlers.deleteApplet)
  .openapi(routes.run, handlers.runApplet)

export default router
