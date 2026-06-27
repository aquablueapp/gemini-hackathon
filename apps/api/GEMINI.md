# Hono API 开发现范体系 (Aquablue)

针对 `apps/api` 的 Hono.js 后端服务体系，基于 `bukai` 项目最佳实践深度重构：

## 1. 🏛 四层路由架构规范

每个业务模块必须严格遵循 4 文件分层，确保逻辑解耦：

- **`<module>.routes.ts`**: 仅定义 `createRoute()`。包含路径、方法、Zod Schema、响应状态码。**禁止**包含业务逻辑。
- **`<module>.handlers.ts`**: 仅实现 Handler 函数，从 `routes.ts` 推断上下文类型。**禁止**直接定义 Zod Schema。
- **`<module>.index.ts`**: 用 `createRouter()` 装配路由与 Handler，是唯一的"连接层"。
- **`<module>.test.ts`**: 覆盖所有公开路由的集成测试，使用 `createTestApp()` 隔离环境。

## 2. 🔐 身份认证与 Better Auth 维护

- **认证**: 核心基于 **Better Auth** + JWKS 内存缓存鉴权。
- **Schema 安全更新流程**:
  1. 执行 `bunx @better-auth/cli generate` 生成临时 `auth-schema.ts`。
  2. **手动合并**到 `src/db/schema/auth-schema.ts`。
  3. **必须保留**原有的自定义 `relations()`、级联删除 `cascade` 和外键约束。
  4. 合并后删除临时文件，执行 `db:generate` 与 `db:push`。

## 3. 契约优先与 OpenAPI 防御

- **代码驱动**: 强制使用 `@hono/zod-openapi` 定义接口，禁止手动维护 JSON 文档。
- **响应完整性**: 在 `createRoute` 中，建议始终预先定义好 `[HttpStatusCodes.INTERNAL_SERVER_ERROR]` (500) 和 `[HttpStatusCodes.NOT_FOUND]` (404) 的响应 Schema，以避免 TypeScript 复杂的类型推断错误。
- **返回壳一致性**: 必须严格遵守 Schema 定义的包装结构（如 `{ success, data }`），禁止偷懒直接返回 naked JSON。

## 4. ❌ 错误处理规约

- **统一管理**: 所有错误码必须定义在 `src/lib/errors.ts` 的 `ERROR_CODES` 中。
- **命名规范**: 采用 `CATEGORY_REASON`（如 `AUTH_INVALID_TOKEN`）。
- **响应生成**: 必须使用 `createErrorResponse` 函数，确保返回符合前端 i18n 映射的标准化结构。

## 5. 🌐 类型导出与跨层共享

- **唯一出口**: `src/app.ts` 中链式调用结果的 `AppType` 是前端消费类型的唯一出口。
- **轻量入口**: `src/client.ts` 专供前端消费，**严禁**导入任何触发 Node.js 特定模块（如 `fs`, `drizzle`）的代码，仅限导出类型和 Zod Schema。

## 6. 🗃 数据库与索引设计

- **索引左前缀原则**: 复合索引 `(A, B)` 优于多个单列索引，且自动覆盖纯 `A` 查询。
- **排序入索引**: 查询若包含 `ORDER BY`，应尽可能将其纳入复合索引以避免 `filesort`。
- **驱动限制**: 注意 `neon-http` 驱动不支持交互式事务。若需重度依赖悲观锁，请在文档中说明驱动切换方案。

## 7. 📡 日志与可观测性体系 (Logging & Observability)

- **职责分离**：业务流转及状态指标强制使用结构化日志库（Pino）打印，携带 `event_name`、`duration_ms` 等核心字段；未捕获的 Panic、5xx 崩溃必须上报至 `Sentry`。
- **跨栈关联 (X-Request-Id)**：每个请求必须在进入时生成 UUID 并写入 `X-Request-Id`，所有响应及 Pino 日志皆需携带此标识，方便前端串联。
- **性能探针 (Performance Profiling)**：对于重度 DB 操作和第三方外部调用，必须使用 `withMetrics(operationName, fn)` 高阶函数包裹，进行耗时度量打点。

## 8. 🧪 测试架构与集成测试规范 (Testing & Integration)

基于 `bukai` 最佳实践，本项目采用"真实环境模拟"而非"全 Mock"策略：

- **核心技能挂载 (AI Agent Skills)**: 在编写或审查任何测试代码前，AI 必须主动挂载 `javascript-testing-patterns` 和 `vitest` 技能，以确保遵循最佳的 TDD 模式、Mocking 策略以及 Vitest 专有配置。
- **核心工具**: [Vitest](https://vitest.dev/) + [hono/testing](https://hono.dev/docs/guides/testing)。
- **隔离原则**: 必须连接独立的测试数据库（`.env.test`），绝不允许在开发/生产库运行测试。
- **四文件分层之 `<module>.test.ts`**:
  - **环境自检**: 文件开头必须验证 `env.NODE_ENV === "test"` 且 `DATABASE_URL` 已配置。
  - **真实 Auth 流**: 严禁伪造 JWT。必须通过 `createTestUserViaAuth` 触发真实的 Better Auth 注册/登录流获取 Token。
  - **生命周期管理与数据清理**:
    - `beforeAll`: 调用 `initTestDatabase()` 验证并同步 Schema，创建主测试用户。
    - **清理约束**: 测试数据的清理（特别是用户）请依赖 `process.once('beforeExit', cleanupTestData)` 统一处理，或在特定测试内部清理。**严禁**在顶层 `afterAll` 块中清理共享数据，这会引发异步测试或 Better Auth 后台任务（如获取 JWKS）的 401 级联崩溃。
- **类型安全客户端 (无 `as any` 容忍)**:
  - 强制使用 `testClient<typeof router>(createTestApp(router))` 获得带类型推断的 API 调用。
  - **绝对禁止**写成 `testClient(createTestApp(router)) as any`，这会击穿 `@hono/zod-openapi` 的端到端类型保护。
- **防幽灵报错与魔术值限制**:
  - 编写测试用例（如测试 404）时，**禁止**硬编码常见的随机 ID（如 `param: { id: 999999 }`），避免与 Faker 数据碰撞。
  - 请使用安全的大数值如 `99999999`，并注意 PostgreSQL 32 位 INT 上限，**禁止**使用 `Number.MAX_SAFE_INTEGER` 导致数据库越界崩溃。
- **进程隔离与内部 Fetch 劫持**:
  - 为避免运行单元测试必须启动独立后端服务的累赘，`src/test-helpers/setup.ts` 中已全局拦截 `globalThis.fetch`，使对内部端点（如 `/api/auth/jwks`）的调用直接打回给内存中的 `app.request()`。不要破坏此拦截逻辑。
- **具体细则**: 详见 `docs/testing-standards.md`。

## 9. ⚠️ Webhook 与异步任务容错模型 (GCP Cloud Tasks)

- **容错模型**: 使用 HTTP 推模式 (Push Webhook) 的异步任务队列（如 Google Cloud Tasks）其重试机制完全依赖目标的 HTTP 响应码。在 Hono 提供消费此类 Webhook 端点时：
  1. 避免使用单方面阻断异步链路（不等待）直接 return `200` 给队列。在确认完成或者期待重试前，请 `await` 后台处理流。
  2. 如果由于外部网络波动引发任务阻塞或崩溃（期待云基建安排重新排队），必须允许异常上浮穿透给 Hono 并返回给调用方 `50X` 错误。
  3. 如果是预期内引发的死记录（如永久缺失核心业务字段导致校验失败），则不抛出异常，捕获日志即视为正常完成返回 `200`，使基建消除该任务残留。
