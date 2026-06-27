# Web 前端子项目技术栈与依赖文档 (apps/web)

该子项目是基于 React 开发的全栈/前端 SSR 应用。底层基于 TanStack Start 框架，旨在构建具备极致用户体验、高度类型安全且高度动态的现代 Web 应用。

## 🛠 技术栈总览

- **全栈/组件框架**: `React 19` (利用 React 最新并发特性与 Server Functions)
- **全栈脚手架与路由**: `TanStack Start` (包含 `TanStack Router`、SSR 水合支持、服务器端数据传输与流式渲染 Streaming)
- **构建工具**: `Vite` (前端热重载与打包)
- **样式系统**: `Tailwind CSS v4` (采用全新基于 Rust 编写的极速编译器，使用纯 CSS 变量定义主题，抛弃了 tailwind.config.js)
- **UI/UX 精品设计**:
  - **Headless UI 组件**: `Radix UI` (提供无样式的无障碍高可访问性 UI 原型，完美支持键盘操作)
  - **流畅动效**: `Framer Motion` (用于组件入场、微交互和动画过渡)
  - **可视化图表**: `Recharts` (绘制美观的 SVG 数据图表)
  - **节点与流图**: `XYFlow` (React Flow 新一代版本，提供复杂的有向无环图、工作流可视化画布)
- **数据流管理**:
  - **服务端状态与水合**: `TanStack Query v5` (配合 Start 在路由 `loader` 中水合)
  - **表单状态管理**: `TanStack React Form` (强类型安全的表单引擎)
- **多语言 (i18n)**: `use-intl`
- **监控与调试**: `Sentry`
- **测试框架**:
  - **单元/组件测试**: `Vitest` + `Happy DOM` + `React Testing Library`
  - **端到端测试**: `Playwright`

---

## 📦 依赖库详述与用途

### 1. 运行时生产依赖 (Dependencies)

| 依赖库名称 | 版本范围 | 在本项目中的具体用途 |
| :--- | :--- | :--- |
| **`react`** & **`react-dom`** | `^19.2.5` | **前端核心渲染引擎**。使用最新的 React 19 并发特性（Concurrent Features）以及服务器函数（Server Functions）。 |
| **`@tanstack/react-start`** | `^1.168.25` | **全栈 SSR React 框架**。连接前后端代码，支持在前端组件中直接通过 Server Functions 执行服务端数据库与 API 查询，并提供流式响应。 |
| **`@tanstack/react-router`** | `^1.170.15` | **类型安全路由库**。对 URL 参数、查询参数、Search Params 进行 100% 强类型约束，支持路由自动扫描生成。 |
| **`@tanstack/react-query`** | `^5.101.0` | **异步状态管理（React Query）**。缓存并同步 API 数据，负责路由加载时的首屏数据预取（Prefetch）与水合。 |
| **`@tanstack/react-router-ssr-query`** | `^1.167.1` | **Start & Query 适配器**。连接路由跳转与数据水合，确保 SSR 渲染在服务端取数完毕后一并流式输出。 |
| **`@tanstack/react-form`** | `^1.29.1` | **强类型表单校验与管理库**。管理极其复杂的表单输入状态，实现字段级的异步/同步校验。 |
| **`@tanstack/zod-adapter`** | `^1.167.0` | **表单与路由 Zod 适配器**。让表单和路由能够使用 Zod 规则来验证数据类型。 |
| **`api`** | `workspace:*` | **Monorepo 工作区内部依赖**。直接引用了 `apps/api` 的客户端导出，保证前端调用后端 API 时具备共享的类型契约。 |
| **`hono`** | `^4.12.16` | **本地代理/SSR 辅助 Web 框架**。 |
| **`@hono/node-server`** | `^2.0.5` | **Node.js HTTP 托管服务器**。用于在 GCP Node.js 标准运行期中承载生产打包后的前端 SSR 服务。 |
| **`tailwindcss`** & **`@tailwindcss/vite`** | `^4.2.4` | **Tailwind CSS v4**。超快速的 CSS 编译器，使用纯 CSS 配置主题，极大地提升了打包和本地开发的编译速度。 |
| **`@radix-ui/react-dialog`**等 | `^1.1.15`等 | **Radix UI 无样式组件**。提供 Dialog (弹窗), Dropdown (下拉菜单), Label (标签), Slot (组件复用插槽) 等支持 WAI-ARIA 规范的高可访问性底层组件。 |
| **`framer-motion`** | `^12.40.0` | **React 顶级动效引擎**。负责 UI 中的动画转场、手势拖拽、页面切换过渡以及精细的微交互动效。 |
| **`@xyflow/react`** | `^12.11.0` | **节点网络流图 Canvas 画布**。用于构建交互式的流程图、节点关系拓扑图（常用于展现 Agent 的思考流或推理节点图）。 |
| **`recharts`** | `^3.9.0` | **SVG 图表库**。在 Dashboard 中展示数据趋势，具备高定制性和自适应容器支持。 |
| **`lucide-react`** | `^0.562.0` | **矢量图标库**。提供现代、轻量、高可读性的线条图标集。 |
| **`@better-fetch/fetch`** | `^1.1.21` | **增强型 Fetch 客户端**。提供类型推断、多轮重试、自定义 hook 钩子等现代化 API 请求特性。 |
| **`@unpic/react`** | `^1.0.2` | **响应式图片组件**。自动计算最优化尺寸，加速 LCP 渲染并降低累积布局偏移（CLS）。 |
| **`use-intl`** | `^4.11.0` | **React 国际化框架**。提供轻量且高性能的多语言文本映射翻译。 |
| **`class-variance-authority`** | `^0.7.1` | **组件样式变体生成器**。用来为 Button、Input 等组件定义多种尺寸和视觉样式的类名映射。 |
| **`clsx`** & **`tailwind-merge`** | `^2.1.1`等 | **类名动态合并与冲突裁决器**。完美处理诸如 `px-4` 与 `p-2` 之间的优先级覆盖问题。 |
| **`tailwindcss-animate`** | `^1.0.7` | **动画类名插件**。内置了丰富的 Tailwind CSS 入场出场等过渡动画。 |
| **`tailwindcss-safe-area`** | `^1.3.0` | **刘海屏安全区避让插件**。为移动端提供适配 iOS 底部安全条的类名。 |
| **`next-themes`** | `^0.4.6` | **React 主题适配器**。实现深浅色模式的快速切换，且在 SSR 时避免闪烁。 |
| **`react-error-boundary`** | `^6.1.1` | **React 错误边界**。捕获前端局部 UI 组件崩溃并展示备用回退界面，防止局部报错挂掉整个应用。 |
| **`sonner`** | `^2.0.7` | **轻量 Toast 通知库**。用于全局优雅地提示操作成功、错误或警告信息。 |
| **`consola`** | `^3.4.2` | **优雅控制台输出**。提供结构化、多色彩的控制台调试日志。 |
| **`@sentry/react`** | `^10.51.0` | **Sentry 监控 SDK**。用于端到端追踪用户的真实操作报错、请求超时等性能卡顿。 |
| **`@fontsource-variable/*`** | -- | **高性能自建字体包**。提供 Inter, Noto Sans JP, Noto Sans SC 等变量字体，在本地和 CDN 服务中保障文字渲染表现。 |

### 2. 开发与测试依赖 (DevDependencies)

| 依赖库名称 | 版本范围 | 在开发测试中的具体用途 |
| :--- | :--- | :--- |
| **`vite`** | `^7.3.2` | **现代打包与开发服务器**。提供超快的极速热重载 (HMR)。 |
| **`@vitejs/plugin-react`** | `^5.2.0` | **Vite React 插件**。为 React 应用提供 Fast Refresh 支持。 |
| **`nitropack`** | `^2.13.4` | **轻量服务端打包引擎**。支持前端静态文件打包以及跨平台 SSR 脚本生成。 |
| **`@testing-library/react`** | `^16.3.2` | **React 组件测试套件**。用于对 React UI 组件执行行为和结构验证。 |
| **`happy-dom`** | `^20.9.0` | **高性能虚拟 DOM 运行时**。提供比 JSDOM 快得多的测试浏览器模拟环境。 |
| **`@playwright/test`** | `^1.59.1` | **端到端（E2E）测试框架**。在真实的 Chrome/Firefox/WebKit 浏览器中执行全链路功能与交互测试。 |
| **`typescript`** | `^5.9.3` | **TypeScript 语言编译器**。进行类型检查和工程语法解析。 |
| **`eslint`** | -- | **静态代码分析工具**。 |
| **`@eslint-react/eslint-plugin`**等 | -- | **针对 React 19 与 Hooks 的 ESLint 插件**。规避 React 开发中的规范反模式。 |
