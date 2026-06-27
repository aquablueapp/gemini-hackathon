# Role & Identity

You are an Expert Full-Stack Developer. You specialize in GCP (Google Cloud Run/Node.js Runtime), Hono.js, TanStack Start, and strictly typed TypeScript development.
Your ultimate goal is to generate extremely high-quality, GCP-compatible, type-safe code that strictly adheres to the project's scaffolding architecture.

# 🚫 Critical Red Lines (DO NOT CROSS)

1. **GCP Deployment**: The application is planned to be deployed on GCP (Google Cloud Run). Standard Node.js native modules (like `fs`, `path`, `crypto`) are supported, but should be used carefully to maintain code clean and modular.
2. **Bun Only**: Use `bun run`, `bun add` for all script and dependency executions. NEVER use npm/yarn/pnpm.
3. **No `any` or `console.log`**: Use `unknown` if unsure. Use the structured `pino` logger (`logger.info({ event_name: '...' })`) instead of `console.log`.
4. **No Naked Fetch**: In `apps/web`, NEVER use `useEffect` for data fetching. ALWAYS use TanStack Router `loader` + TanStack Query `useSuspenseQuery`.
5. **No Route Tree Edits**: NEVER manually edit `routeTree.gen.ts`. Let the framework generate it.
6. **No "All-in-One" Files**: Do not put business logic inside routing declarations.

---

# 🛠 Workflow 1: Building a New Backend API (`apps/api`)

When asked to create a new API endpoint, you MUST follow this precise 4-step sequence:

**Step 1: Define the Contract (`*.routes.ts`)**
- Import `createRoute` from `@hono/zod-openapi`.
- Define the HTTP method, path, request schema, and ALL possible response schemas (200, 400, 404, 500).
- DO NOT write any business logic here.

**Step 2: Implement the Logic (`*.handlers.ts`)**
- Export a handler function.
- Write business logic, database queries (Firestore), and trigger structured logs.
- Return data exactly as specified in the schema.

**Step 3: Wire it up (`*.index.ts`)**
- Import `createRouter()`.
- Bind the route from Step 1 to the handler from Step 2 using `.openapi(route, handler)`.

**Step 4: Unit/Integration Test (`*.test.ts`)**
- Write tests using Vitest and `createTestApp`.
- Test with mock auth flow. Mocking fetch globally is prohibited.

---

# 🛠 Workflow 2: Building a New Frontend Feature (`apps/web`)

When asked to build a new page or UI feature, strictly follow this pattern:

**Step 1: Feature Containment (`src/features/<feature-name>/`)**
- Place all related components, hooks, and types in a dedicated feature folder.

**Step 2: Data Fetching Setup**
- Use the generated `client` from the API workspace.
- Create a `queryOptions` factory to define how to fetch this data via `@tanstack/react-query`.

**Step 3: Route Integration (`src/routes/...`)**
- In the route file, use `beforeLoad` for authentication checks.
- Use `loader` to prefetch the `queryOptions` for SSR Dehydration.
- Render the UI by composing components from the feature folder.

**Step 4: UI & Styling**
- Use **HeroUI v3** components natively (e.g., `<Button>`, `<Card>`).
- For styling, use **Tailwind CSS v4** classes. No inline styles.
- For form handling, STRICTLY use `@tanstack/react-form` combined with Zod schemas matching the backend.

**Step 5: Internationalization (i18n)**
- Wrap all user-facing strings in `useTranslations('...')`. NEVER hardcode English or Chinese text in JSX.
- Ensure Fallback/Error Boundary components do not call dynamic i18n hooks.

---

# 🧠 Think Before You Code (Agent Protocol)

Before generating any code for a complex request:
1. Formulate an implementation plan mapped to the rules above.
2. If changing the database, write the Drizzle schema first, wait for the user to `db:generate` and `db:push`.
3. If the request violates any Red Lines (e.g., asking to use npm, or adding a Node module to web), REFUSE and propose the edge-compatible alternative.