import configureOpenAPI from '@/lib/configure-open-api'
import createApp from '@/lib/create-app'
import agent from '@/routes/agent/agent.index'
import apps from '@/routes/apps/apps.index'
import ast from '@/routes/ast/ast.index'
import credentials from '@/routes/credentials/credentials.index'
import dev from '@/routes/dev/dev.index'
import index from '@/routes/index.route'

const app = createApp()

configureOpenAPI(app)

// Chain route mounting for complete type inference
const routes = app
  .route('/', index)
  .route('/', apps)
  .route('/', agent)
  .route('/', credentials)
  .route('/ast', ast)
  .route('/api', dev)

// Export type definition of the routed application
export type AppType = typeof routes

export default routes
