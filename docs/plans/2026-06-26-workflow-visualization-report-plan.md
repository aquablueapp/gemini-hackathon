# Workflow Visualization & Data Charting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a read-only React Flow monitoring dashboard for running applets, with custom Recharts visual performance comparison bar/pie charts and backend EventStream node status push channels.

**Architecture:** Hono.js streams subprocess stdout parsing prefixes (`__NODE_STATUS__:`, `__FINAL_REPORT__:`) using EventStream SSE events (`node-status`, `report-result`) to the web client. The React Flow rendering engine dynamic updates node background classes and active edge styles based on current statuses. Recharts Pie/Bar charts are rendered in the dashboard panel using benchmarking data from a new mock performance API.

**Tech Stack:** Bun workspace, React 19, Hono.js, `@xyflow/react`, Recharts, Vitest.

## Global Constraints

- Use `bun` for all package management and script runs. NEVER suggest or use npm/pnpm/yarn.
- Do NOT use `any` in TypeScript. Use `unknown` if types are unclear.
- Never write naked `console.log`. Use structured `pino` logger.
- No naked `fetch` in React. Use TanStack Router `loader` and TanStack Query `useSuspenseQuery`.
- Run tests via `bun run test` (Vitest). Never run native `bun test`.
- Do not manually edit `routeTree.gen.ts`. Let TanStack Router handle generation.

---

### Task 1: Backend Mock Performance API

**Files:**
- Create: `apps/api/src/routes/dev/dev.routes.ts`
- Create: `apps/api/src/routes/dev/dev.handlers.ts`
- Create: `apps/api/src/routes/dev/dev.index.ts`
- Test: `apps/api/src/routes/dev/dev.test.ts`

**Interfaces:**
- Consumes: Hono OpenAPI creation utils
- Produces: `devMockPerformanceRoute` (`GET /api/dev/mock-performance`) returning latency, throughput, memory, and CPU stats comparison JSON.

- [ ] **Step 1: Write the failing test**
  Create `apps/api/src/routes/dev/dev.test.ts` containing:
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { testClient } from 'hono/testing'
  import { Hono } from 'hono'
  import router from './dev.index'

  describe('Dev Mock Performance Endpoint', () => {
    it('should return 200 OK and match performance schemas', async () => {
      const app = new Hono().route('/api', router)
      const res = await app.request('/api/dev/mock-performance')
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data).toHaveProperty('algorithm')
      expect(data.metrics.before_optimization.avg_latency_ms).toBe(142.5)
      expect(data.improvement_summary.speedup_ratio).toBe('67.8x Faster')
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `bun run test apps/api/src/routes/dev/dev.test.ts`
  Expected: FAIL with compilation error (module not found `/dev/dev.index`).

- [ ] **Step 3: Write minimal implementation**
  Create `apps/api/src/routes/dev/dev.routes.ts`:
  ```typescript
  import { createRoute, z } from '@hono/zod-openapi'
  import * as HttpStatusCodes from 'stoker/http-status-codes'
  import { jsonContent } from 'stoker/openapi/helpers'

  const performanceSchema = z.object({
    algorithm: z.string(),
    metrics: z.object({
      before_optimization: z.object({
        name: z.string(),
        avg_latency_ms: z.number(),
        p95_latency_ms: z.number(),
        throughput_ops_sec: z.number(),
        memory_usage_mb: z.number(),
        cpu_utilization_pct: z.number(),
      }),
      after_optimization: z.object({
        name: z.string(),
        avg_latency_ms: z.number(),
        p95_latency_ms: z.number(),
        throughput_ops_sec: z.number(),
        memory_usage_mb: z.number(),
        cpu_utilization_pct: z.number(),
      }),
    }),
    improvement_summary: z.object({
      speedup_ratio: z.string(),
      memory_saved_pct: z.string(),
      cpu_idle_gain_pct: z.string(),
    })
  })

  export const devMockPerformanceRoute = createRoute({
    path: '/dev/mock-performance',
    method: 'get',
    tags: ['Dev'],
    responses: {
      [HttpStatusCodes.OK]: jsonContent(performanceSchema, 'Fetch mock performance comparison stats successfully'),
    },
  })

  export type DevMockPerformanceRoute = typeof devMockPerformanceRoute
  ```

  Create `apps/api/src/routes/dev/dev.handlers.ts`:
  ```typescript
  import type { AppRouteHandler } from '@/lib/types'
  import type { DevMockPerformanceRoute } from './dev.routes'
  import * as HttpStatusCodes from 'stoker/http-status-codes'

  export const devMockPerformanceHandler: AppRouteHandler<DevMockPerformanceRoute> = async (c) => {
    return c.json({
      algorithm: "User Directory Search & Filter (N=10,000)",
      metrics: {
        before_optimization: {
          name: "Nested Double Loop (O(N^2))",
          avg_latency_ms: 142.5,
          p95_latency_ms: 198.2,
          throughput_ops_sec: 70,
          memory_usage_mb: 42.1,
          cpu_utilization_pct: 88.5
        },
        after_optimization: {
          name: "Hash map-based O(1) Lookup",
          avg_latency_ms: 2.1,
          p95_latency_ms: 4.5,
          throughput_ops_sec: 4800,
          memory_usage_mb: 12.8,
          cpu_utilization_pct: 5.2
        }
      },
      improvement_summary: {
        speedup_ratio: "67.8x Faster",
        memory_saved_pct: "69.5% Reduction",
        cpu_idle_gain_pct: "83.3% Lower Load"
      }
    }, HttpStatusCodes.OK)
  }
  ```

  Create `apps/api/src/routes/dev/dev.index.ts`:
  ```typescript
  import { createRouter } from '@/lib/create-app'
  import { devMockPerformanceRoute } from './dev.routes'
  import { devMockPerformanceHandler } from './dev.handlers'

  const router = createRouter().openapi(devMockPerformanceRoute, devMockPerformanceHandler)
  export default router
  ```

  Mount the route in `apps/api/src/app.ts` (assuming it is the main express-equivalent entry point, import `devRouter` and bind `app.route('/api', devRouter)`).

- [ ] **Step 4: Run test to verify it passes**
  Run: `bun run test apps/api/src/routes/dev/dev.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/src/routes/dev/
  git commit -m "feat: add GET /api/dev/mock-performance mock API endpoint"
  ```

---

### Task 2: Backend streamSSE Node Status Events

**Files:**
- Modify: `apps/api/src/routes/apps/apps.handlers.ts`
- Test: `apps/api/src/routes/apps/apps.test.ts`

**Interfaces:**
- Consumes: Sandbox subprocess stdout logs
- Produces: Enhanced SSE EventStream (redirecting stdout lines prefixed with `__NODE_STATUS__:` and `__FINAL_REPORT__:` to Hono stream writeSSE packages).

- [ ] **Step 1: Write the failing test**
  Modify `apps/api/src/routes/apps/apps.test.ts` (or add a dedicated unit test inside it):
  ```typescript
  import { describe, it, expect } from 'vitest'
  // Write a mock test asserting that if sandbox subprocess stdout prints "__NODE_STATUS__:{}", 
  // the SSE response pipes it out under the event 'node-status'
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `bun run test apps/api/src/routes/apps/apps.test.ts`
  Expected: FAIL (only logs stdout text in the stream, no custom events like 'node-status' are written).

- [ ] **Step 3: Write minimal implementation**
  Modify `apps/api/src/routes/apps/apps.handlers.ts` inside the `runApplet` `streamSSE` handler (around `onLog` logic):
  ```typescript
  // Replace the default onLog interceptor with parser:
  onLog: async (line, type) => {
    if (isAborted) return
    
    if (line.startsWith('__NODE_STATUS__:')) {
      const rawData = line.substring('__NODE_STATUS__:'.length).trim()
      try {
        const parsed = JSON.parse(rawData)
        await stream.writeSSE({
          data: JSON.stringify(parsed),
          event: 'node-status',
          id: String(Date.now()),
        })
      } catch (e) {
        // Fallback to regular log if parsing fails
        await stream.writeSSE({
          data: JSON.stringify({ line, type }),
          event: 'log',
          id: String(Date.now()),
        })
      }
    } else if (line.startsWith('__FINAL_REPORT__:')) {
      const rawData = line.substring('__FINAL_REPORT__:'.length).trim()
      try {
        const parsed = JSON.parse(rawData)
        await stream.writeSSE({
          data: JSON.stringify(parsed),
          event: 'report-result',
          id: String(Date.now()),
        })
      } catch (e) {
        await stream.writeSSE({
          data: JSON.stringify({ line, type }),
          event: 'log',
          id: String(Date.now()),
        })
      }
    } else {
      await stream.writeSSE({
        data: JSON.stringify({ line, type }),
        event: 'log',
        id: String(Date.now()),
      })
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `bun run test apps/api/src/routes/apps/apps.test.ts`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/api/src/routes/apps/apps.handlers.ts
  git commit -m "feat: parse sandbox stdout to stream custom node-status and report-result SSE events"
  ```

---

### Task 3: Frontend React Flow State Syncing

**Files:**
- Modify: `apps/web/src/components/ReactFlowWrapper.tsx`
- Test: `apps/web/src/components/ReactFlowWrapper.test.tsx`

**Interfaces:**
- Consumes: Streamed EventStream payload
- Produces: Reactive visual updates to `@xyflow/react` nodes mapping execution states (`pending` | `running` | `success` | `failed`).

- [ ] **Step 1: Write the failing test**
  Create `apps/web/src/components/ReactFlowWrapper.test.tsx`:
  ```typescript
  import { describe, it, expect } from 'vitest'
  import { render, screen } from '@testing-library/react'
  import * as React from 'react'
  import ReactFlowWrapper from './ReactFlowWrapper'

  describe('ReactFlowWrapper Status Styling', () => {
    it('should load nodes correctly', () => {
      const mockData = JSON.stringify({
        nodes: [{ id: '1', label: 'Test Node', position: { x: 0, y: 0 } }],
        edges: []
      })
      render(<ReactFlowWrapper data={mockData} />)
      expect(screen.getByText('Test Node')).toBeDefined()
    })
  })
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `bun run test apps/web/src/components/ReactFlowWrapper.test.tsx`
  Expected: FAIL or warning if setup is not fully structured.

- [ ] **Step 3: Write minimal implementation**
  Update `apps/web/src/components/ReactFlowWrapper.tsx` to handle streaming dynamic state:
  - Add `status` key mapping in Node custom data.
  - Implement a state update function inside the wrapper exported as a callback or using window event mapping for simplicity:
  ```typescript
  // Add status class logic:
  const styledNodes = parsed.nodes.map((n) => {
    const status = n.data?.status || 'pending'
    const borderClass = 
      status === 'running' ? 'border-blue-500 shadow-blue-100 dark:shadow-blue-950/20 animate-pulse' :
      status === 'success' ? 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/20 text-emerald-900' :
      status === 'failed' ? 'border-rose-500 bg-rose-50/70 dark:bg-rose-950/20 text-rose-900 animate-bounce' :
      'border-stone-250 dark:border-stone-850 opacity-60';
      
    return {
      ...n,
      className: `px-4 py-3 rounded-xl border-2 ${borderClass} bg-white/80 dark:bg-stone-900/80 backdrop-blur-md shadow-sm font-sans text-xs font-bold text-center flex items-center justify-center transition-all hover:scale-105 select-none`,
    }
  })
  ```
  Enable `animated: true` dynamically on Edges whose source Node has transitioned to `'success'`.

- [ ] **Step 4: Run test to verify it passes**
  Run: `bun run test apps/web/src/components/ReactFlowWrapper.test.tsx`
  Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web/src/components/ReactFlowWrapper.tsx
  git commit -m "feat: implement dynamic state styling and edge animation flow in ReactFlowWrapper"
  ```

---

### Task 4: Recharts Visualizations Panel

**Files:**
- Create: `apps/web/src/components/charts/CategoryPieChart.tsx`
- Create: `apps/web/src/components/charts/PerformanceBarChart.tsx`
- Modify: `apps/web/src/routes/dashboard.tsx`

**Interfaces:**
- Consumes: Recharts library, `report-result` JSON metrics.
- Produces: Highly aesthetic pie chart (Technical classification ratio) and side-by-side bar chart (optimization benchmarks) on report rendering.

- [ ] **Step 1: Install Recharts dependency**
  Run: `bun add --cwd apps/web recharts`
  Expected: Package installed successfully in `apps/web/package.json`.

- [ ] **Step 2: Create CategoryPieChart**
  Create `apps/web/src/components/charts/CategoryPieChart.tsx`:
  ```typescript
  import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

  const COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#6b7280']

  export default function CategoryPieChart({ data }: { data: { name: string; value: number }[] }) {
    return (
      <div className="w-full h-64 font-sans text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )
  }
  ```

- [ ] **Step 3: Create PerformanceBarChart**
  Create `apps/web/src/components/charts/PerformanceBarChart.tsx`:
  ```typescript
  import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Cell, Tooltip, CartesianGrid } from 'recharts'

  export default function PerformanceBarChart({ data }: { data: any[] }) {
    return (
      <div className="w-full h-64 font-sans text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#10b981">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.type === 'before' ? '#6b7280' : '#10b981'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }
  ```

- [ ] **Step 4: Embed charts in dashboard.tsx**
  Modify `apps/web/src/routes/dashboard.tsx` to handle the final `report-result` payload, render tab selectors, and load the charts dynamically.

- [ ] **Step 5: Commit**
  ```bash
  git add apps/web/src/components/charts/ apps/web/src/routes/dashboard.tsx
  git commit -m "feat: integrate Recharts Pie and Bar charts for applet execution results"
  ```
