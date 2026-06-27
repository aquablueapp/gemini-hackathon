# Aquablue API (Hono + Drizzle + Better Auth)

A blazing-fast, type-safe backend service designed for edge environments (Edge-compatible).

## 📖 Core Architectural Explanation

This project strictly adheres to the **"Four-Layer Routing Architecture"**, achieving high decoupling and a Contract-First design:

1. **`*.routes.ts` (Contract Layer)**: Responsible solely for defining the OpenAPI Schema (inputs/outputs/paths), containing absolutely no business logic.
2. **`*.handlers.ts` (Business Layer)**: Implements the actual request processing and database operations. It infers context types directly from the contract layer.
3. **`*.index.ts` (Assembly Layer)**: Binds the contracts with the business logic.
4. **`*.test.ts` (Testing Layer)**: Real integration tests based on Vitest, avoiding black-box mocks.

---

## 🛠 Development Guide: How to Build New Business Logic? (How-to Guide)

Using the retained "Golden Example" `regions` as a reference, here is the standard workflow for developing a new module:

### Step 1: Database Design (`src/db/schema`)

Create a new entity table under `src/db/schema/`, for example, `regions.ts`. Use types provided by Drizzle.
Once complete, export the table in `src/db/schema/index.ts`.
Then execute the migration:

```bash
bunx drizzle-kit generate
bunx drizzle-kit push
```

### Step 2: Define the API Contract (`regions.routes.ts`)

Define the interface using `@hono/zod-openapi`.

```typescript
import { createRoute, z } from '@hono/zod-openapi'
import { regionSchema } from '@/shared/schemas/region'

export const getOneRoute = createRoute({
  path: '/regions/{id}',
  method: 'get',
  responses: {
    200: { description: 'Success', content: { 'application/json': { schema: regionSchema } } },
  },
})
```

### Step 3: Write Business Logic (`regions.handlers.ts`)

Import the corresponding DB Schema and write the handler function. If permission control is needed, note that the Handler will validate the Token based on the Route's requirements.

```typescript
import type { RouteHandler } from '@hono/zod-openapi'
import type { GetOneRoute } from './regions.routes'
import { db } from '@/db'

export const getOneHandler: RouteHandler<GetOneRoute> = async (c) => {
  const { id } = c.req.valid('param')
  // ... db query
  return c.json(data, 200)
}
```

### Step 4: Assemble and Export Types (`regions.index.ts` & `src/app.ts`)

Mount the defined Router into `src/app.ts`, ensuring it is added to the chained `AppType` call. This guarantees the frontend receives complete type inference.

---

## 📚 Quick Command Reference

```bash
# Generate and push database schema changes
bun run db:generate && bun run db:push

# Run integration tests (based on the isolated .env.test database)
bun run test

# Execute type checking (verifies Zod Schema compatibility with frontend consumption)
bun run typecheck

# Code formatting and fixing
bun run lint
```
