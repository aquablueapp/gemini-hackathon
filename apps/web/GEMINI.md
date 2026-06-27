# Web Frontend Development Iron Rules (Aquablue)

This document outlines the core technology stack and mandatory development rules for the `apps/web` frontend project.

## 🛠 Core Tech Stack
- **Meta-Framework**: [TanStack Start](https://tanstack.com/start) (Vite-based Full-stack SSR framework, React 19)
- **Routing Engine**: TanStack Router (Strictly typed, file-based routing)
- **State & Data Fetching**: TanStack Query v5 + Better Fetch (Seamless SSR dehydration/hydration)
- **UI System**: **Tailwind CSS v4** (Native compilation via Vite plugin) + **HeroUI v3 (Beta)**
- **Internationalization (i18n)**: In-house multi-language solution based on Server-Entry middleware interception and `next-intl/use-intl`
- **Deployment Target**: **Cloudflare Workers (Edge Runtime)**
- **Package Manager**: **Bun** (All node scripts and installations MUST use `bun`)

---

## 🛡 "Iron Rules" of Web Development

### 1. Edge Runtime Strictness
**Rule**: The web application is ultimately deployed to Cloudflare Workers. **Absolutely prohibit the direct importation of any Node.js native modules** (e.g., `fs`, `path`, `child_process`, or even native `stream`, `http`) in the application code.
**Context**: In `vite.config.ts`, we have already forcibly stubbed some legacy Node modules (like `node:async_hooks`) via `resolve.alias` to prevent build crashes. Any newly added library MUST support the `Edge/Browser` environment.

### 2. Bun is the Law (No npm/yarn/pnpm)
**Rule**: All package management and script execution MUST use **Bun**.
**Execution**:
- When adding dependencies, use `bun add <pkg>` or `bun add -d <pkg>`.
- When running scripts, use `bun run dev`, `bun run build`, etc.
- Never suggest or use `npm`, `yarn`, or `pnpm` commands in this project.

### 3. TanStack Router File System Law
**Rule**: New pages or layouts **MUST** adhere to TanStack Router's file-based conventions (creating files in the `src/routes/` directory).
**Execution**: Strictly forbid manually editing the `routeTree.gen.ts` file! After any route changes, you must let the framework automatically generate the strongly-typed route tree to maintain absolute type safety for `Link` and `useNavigate`.

### 4. Data Fetching and SSR Hydration Discipline
**Rule**: Fetching remote data within components must be combined with TanStack Router's `loader` hook and TanStack Query's `useQuery` / `useSuspenseQuery`.
**Execution**:
- Prefetch data at the route level to enable rendering at the Server layer.
- `setupRouterSsrQueryIntegration` is already injected in `router.tsx`, which means the Query Cache will automatically dehydrate during the SSR phase and pass to the frontend. Therefore, **writing naked `useEffect(() => fetch(...))` is forbidden** as it destroys the SSR experience and causes waterfall loading.

### 5. UI Library and Style Consistency (Tailwind v4 + HeroUI v3)
**Rule**:
- This project uses the latest **Tailwind CSS v4** (no longer requires `tailwind.config.js`). Do not write configurations following v3 habits.
- UI components **MUST** prioritize the standard components provided by `@heroui/react` (e.g., buttons, cards, form controls). If a component doesn't exist, first look in `packages/ui-components` for our encapsulated shared components.
- Haphazardly writing inline `style={{ color: '#xxx' }}` is forbidden. Colors and spacing must use design system Tokens (mapped via Tailwind variables).

### 6. Form and Type Validation (TanStack Form + Zod)
**Rule**: **Mandatory use of `@tanstack/react-form`** for all complex form state management and submissions.
**Execution**:
- All forms must be built using `@tanstack/react-form` paired with Zod validation. Do not write manual controlled component logic or mix in other form libraries.
- **AI Agent Skill**: Before or during form development, the AI Agent MUST explicitly invoke the `tanstack-form` skill to ensure best practices are followed.
- For frontend Zod Schemas used to interact with the backend API, reuse or derive them from the public validation layer under the `api` directory whenever possible.

### 7. Features-Driven Development Mode
**Rule**: Business logic must be encapsulated within the `src/features/` directory rather than sprawling across the `routes` or global `components` directories.
**Execution**:
- Organize code strictly by feature domains (e.g., `src/features/auth`, `src/features/shops`).
- Each feature folder should independently contain its own components, hooks, api calls, and types. `src/routes/` files should act only as thin layers that compose and mount these features.

### 8. Universal i18n Support
**Rule**: With the sole exception of pages under the `/admin` route, **ALL user-facing pages MUST support internationalization (i18n)**.
**Execution**:
- Never hardcode user-facing strings (like English or Japanese text) directly in the JSX.
- Always use the `use-intl` hooks (e.g., `useTranslations()`) to pull text from the locale dictionaries.

### 9. Lightweight Interception of i18n APIs (Middleware Pattern)
**Rule**: This project lacks a traditional Node.js Server. Instead, it intercepts requests at the entry layer using `defineHandlerCallback` in `@tanstack/react-start/server-entry`.
**Execution**: In `src/server.ts`, static SEO endpoints (`robots.txt`, `sitemap.xml`, `llms.txt`) and multi-language packs (`/api/i18n/$locale`) are intercepted and returned as `Response` objects directly before React rendering. When modifying SEO strategies or multi-language configurations, you must update this section, rather than writing React components.

### 10. Error Boundaries and Fallback Rendering
**Rule**: Unpredictable errors must never result in a white screen.
**Execution**: `__root.tsx` is already configured with global `DefaultCatchBoundary` and `NotFound404`.
**Caveat**: For Error Components and Pending Components, **it is strictly forbidden to call dynamic internationalization detection functions inside them** (like `getCurrentLocale`). You must strictly use the `<html lang={defaultLocale}>` fallback (as implemented in `RootDocumentForError`), otherwise, an SSR crash is highly likely to trigger irreversible Hydration Mismatch secondary errors.

### 11. Global Authentication Interaction (Better Auth + UI)
**Rule**: Based on the `@better-auth-ui/heroui` ecosystem.
**Execution**: In `__root.tsx`, we mounted `<LocalizedAuthProvider>`. Any protected route must be intercepted for authentication under this tree via Hooks (`useSession`) or the `beforeLoad` guard in the Router Loader. Manually storing/accessing and hardcoding/decoding JWTs or Cookies is prohibited.

### 12. Frontend Component Testing (Vitest + Happy DOM)
**Rule**: All UI components and user interactions MUST be validated using the established frontend testing infrastructure.
**Execution**:
- **AI Agent Skill**: Before writing, refactoring, or reviewing any test code in the `apps/web` project, the AI Agent MUST explicitly invoke the `javascript-testing-patterns` and `vitest` skills to ensure high-quality test patterns (TDD, Mocking, AAA) are applied.
- **Environment**: We strictly use **`happy-dom`** (not `jsdom`) because it aligns with our Edge Runtime philosophy (no Node.js C++ native addons), handles Tailwind v4/CSS modern variables robustly, and runs 3-10x faster.
- **Framework & Libs**: Write tests using `vitest` combined with `@testing-library/react` and `@testing-library/user-event`. Follow the AAA (Arrange, Act, Assert) pattern.
- **React Aria & HeroUI Compatibility**: HeroUI v3 is built on React Aria, which heavily uses `PointerEvent` for accessibility and interactions (like `onPress`). The test environment `setup.ts` has globally mocked `PointerEvent`, `ResizeObserver`, `IntersectionObserver`, and `window.matchMedia`. **Do not** attempt to override these or use outdated `fireEvent.click` exclusively; prefer `userEvent.setup().click(...)` to properly trigger React Aria handlers.

### 13. Frontend Observability & Error Tracking (Sentry)
**Rule**: 客户端与 Edge SSR 的报错追踪统一通过 `@sentry/cloudflare` 进行，生产环境杜绝无追踪的 `console.error`。
**Execution**:
- 仅允许通过 `Sentry.captureException` 上报预期外异常，依赖全局 ESLint `'no-console': ['error', { allow: ['warn'] }]` 护栏拦截滥用。
- 跨端链路：拦截 API 失败的响应，强制提取 `X-Request-Id` 并作为 Breadcrumb 传入 Sentry，实现前后端报错现场一键串联。
- 安全红线：绝不允许在 Sentry 初始化时开启 `sendDefaultPii: true`。若需用户身份画像，必须通过显式调用 `Sentry.setUser({ id })` 实现安全脱敏注入。
