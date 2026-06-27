import { createRouter } from '@/lib/create-app'
import { devMockPerformanceHandler } from './dev.handlers'
import { devMockPerformanceRoute } from './dev.routes'

// OpenAPI router setup for dev routes
const router = createRouter().openapi(
  devMockPerformanceRoute,
  devMockPerformanceHandler,
)

export default router
