import { createRouter } from '@/lib/create-app'
import * as handlers from './agent.handlers'
import * as routes from './agent.routes'

const router = createRouter()
  .openapi(routes.chat, handlers.chatHandler)
  .openapi(routes.getSessionEventsRoute, handlers.getSessionEventsHandler)

export default router
