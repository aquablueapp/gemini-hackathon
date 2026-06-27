# Aquablue Web (TanStack Start + HeroUI)

A full-stack SSR frontend application built with React 19 and the modern TanStack ecosystem, designed for Google Cloud Run (Node.js/Bun Runtime).

## 📖 Core Features Explanation

### Integration of Routing and State Management
- **TanStack Router**: Provides strongly-typed, file-based routing. All routes are defined in the `src/routes` directory, and `routeTree.gen.ts` is generated automatically.
- **TanStack Query Prefetching**: During the SSR phase, data is prefetched via the Router's `loader` and mounted into the Query Cache, achieving seamless Hydration on the client side and eliminating page-level waterfall loading.

---

## 🛠 Development Guide: Building Frontend Business Logic (How-to Guide)

Using the retained "Golden Example" `admin/regions` as a reference, here is the workflow for building high-quality frontend pages:

### Step 1: Strongly-Typed Data Fetching
No manual `fetch` is needed. Utilize the `authApiClient` passed down from the `api` workspace:
```typescript
import { useSuspenseQuery } from '@tanstack/react-query'
import { authApiClient, type SelectRegion } from 'api/client'

const { data } = useSuspenseQuery({
  queryKey: ['regions'],
  queryFn: async () => {
    const res = await authApiClient.regions.$get({})
    if (!res.ok) throw res
    return (await res.json()) as unknown as SelectRegion[]
  }
})
```

### Step 2: Building Forms with @tanstack/react-form
Abandon traditional controlled components or `react-hook-form`. To achieve the most rigorous performance and type validation, **you must use `@tanstack/react-form`** combined with Zod:
```tsx
import { useForm } from '@tanstack/react-form'

const form = useForm({
  defaultValues: { name: '' },
  onSubmit: async ({ value }) => { /* ... */ }
})

// In JSX
<form.Field name="name" validators={{ onChange({ value }) { return !value ? 'Required' : undefined } }}>
  {(field) => (
    <Input 
      value={field.state.value} 
      onChange={(e) => field.handleChange(e.target.value)} 
    />
  )}
</form.Field>
```

### Step 3: UI and Multi-language (i18n)
- Prioritize using [HeroUI v3](https://v3.heroui.com/) for components (built on React Aria, providing complete accessibility support).
- Tailwind CSS v4 handles atomic styling adjustments.
- Use `useTranslations('Namespace')` instead of hardcoding text.

---

## 📚 Quick Command Reference

```bash
# Update and generate the latest TanStack route tree (usually runs automatically during dev)
bunx @tanstack/router-cli generate

# Execute TypeScript checking (ensure types imported from the API layer are not broken)
bun run typecheck

# Run E2E tests (Playwright)
bun run test:e2e
```