# API 子项目技术栈与依赖文档 (apps/api)

该子项目是基于 Node.js/Bun 开发的服务端 API 应用。主要用于对外提供 RESTful 接口、与 GCP 元数据服务（Firestore、GCS）交互，并作为中转站调用伴生 Agent 服务。

## 🛠 技术栈总览

- **编程语言**: TypeScript (类型安全)
- **运行期与包管理器**: `Bun` (作为主力运行时与包管理器，支持原生热重载)
- **Web 服务框架**: `Hono.js` (轻量、极速，具有天然的 TypeScript 类型推断支持)
- **API 文档与契约**: `OpenAPI` (基于 Zod 自动生成 OpenAPI 描述，使用 Scalar 渲染)
- **数据库与云存储**:
  - **GCP Firestore**: 元数据存储，支持本地模拟器自动探测降级 (`MockFirestore`)
  - **GCP Storage**: 云端对象存储
- **日志系统**: `Pino` (强类型、高性能 JSON 结构化日志)
- **测试框架**: `Vitest`
- **构建系统**: `tsc` (TypeScript 编译器) + `tsc-alias` (路径别名转换)

---

## 📦 依赖库详述与用途

### 1. 运行时生产依赖 (Dependencies)

| 依赖库名称 | 版本范围 | 在本项目中的具体用途 |
| :--- | :--- | :--- |
| **`hono`** | `^4.12.14` | **核心 Web 框架**。轻量级且高性能，负责整个 API 服务路由分发、中间件链式调用。 |
| **`@hono/node-server`** | `^1.19.14` | **Node.js HTTP 服务适配器**。使 Hono 应用能够在标准的 Node.js HTTP 模块上平稳启动，保障在 GCP Cloud Run standard Node 环境的兼容性。 |
| **`@hono/zod-openapi`** | `^1.3.0` | **类型安全的 OpenAPI 生成器**。配合 Zod 定义请求入参和响应出参 Schema，自动生成完备的 OpenAPI v3 接口文档，消除 API 契约不一致的问题。 |
| **`@scalar/hono-api-reference`** | `^0.9.48` | **API 交互文档渲染器**。将生成的 OpenAPI Schema 在 `/reference` 路由下渲染为高颜值、可在线测试的 Scalar 接口说明书。 |
| **`@google-cloud/firestore`** | `^8.6.0` | **GCP Firestore 客户端**。用于在云端存储、检索非关系型文档数据（如用户配置、任务元数据等）。 |
| **`@google-cloud/storage`** | `^7.21.0` | **GCP Cloud Storage 客户端**。用于操作云端文件桶，实现文件的上传、下载和生命周期管理。 |
| **`dotenv`** | `^17.4.2` | **环境变量加载工具**。从本地 `.env` 文件中解析并载入环境变量。 |
| **`dotenv-expand`** | `^12.0.3` | **环境变量插值扩展**。允许在 `.env` 中使用变量引用（如 `HOST=$BASE_HOST`）。 |
| **`pino`** | `^10.3.1` | **高性能结构化日志库**。用于高吞吐量地输出标准化 JSON 日志，便于在云端（如 GCP Cloud Logging）进行精确的日志检索与过滤。 |
| **`hono-pino`** | `^0.10.3` | **Pino 日志的 Hono 中间件**。为每一个 HTTP 请求自动打印包含 Method、Path、Status、Latency 等元数据的结构化请求日志。 |
| **`pino-pretty`** | `^13.1.3` | **Pino 日志美化工具**。在本地开发环境下将原本单行的 JSON 日志转换为带有彩色标记、易于阅读的文本格式。 |
| **`zod`** | `^4.3.6` | **Schema 定义与校验器**。在路由层对外部入参进行强类型拦截与校验，防止无效数据透传到业务层。 |
| **`stoker`** | `2.0.1` | **Hono 路由脚手架助手**。提供了一系列规范化的 API 响应结构、错误处理捕获器、HTTP 状态码常量和通用的路由挂载模式。 |
| **`parse-diff`** | `^0.12.0` | **Git Diff 解析器**。用于将 Git Diff 的文本内容解析成高度可操作的 AST/JSON 结构，服务于代码审查或变更分析业务逻辑。 |
| **`web-tree-sitter`** | `^0.26.9` | **Wasm 版 Tree-sitter**。用于在服务端对多种编程语言的源代码文件进行词法与语法分析，生成精准的 AST（抽象语法树），常用于静态分析或 Agent 代码理解。 |

### 2. 开发与测试依赖 (DevDependencies)

| 依赖库名称 | 版本范围 | 在开发测试中的具体用途 |
| :--- | :--- | :--- |
| **`typescript`** | `^5.9.3` | **TypeScript 语言核心**。提供静态类型系统和编译支持。 |
| **`eslint`** | `^9.39.4` | **代码静态分析工具**。检查代码中的潜在错误和不规范的书写习惯。 |
| **`@antfu/eslint-config`** | `^6.7.3` | **高标准 ESLint 配置集**。采用 Antony Fu 主导的无偏见、现代化的代码检查规则。 |
| **`vitest`** | `^4.1.5` | **极速单元测试框架**。具备 Vite 级别的热更新速度，用于快速运行服务端单测。 |
| **`@vitest/coverage-v8`** | `^4.1.5` | **测试覆盖率报告生成器**。利用 V8 原生覆盖率接口统计测试代码的覆盖深度。 |
| **`@faker-js/faker`** | `^10.4.0` | **伪造数据生成器**。在编写数据库种子数据（Seed）或单测 Mock 数据时自动生成随机姓名、邮箱、地址等。 |
| **`@sentry/cli`** | `^3.4.1` | **Sentry 命令行工具**。在 CI/CD 流程中用于向 Sentry 平台上传源码 Source Map 从而定位线上真实崩溃栈。 |
| **`cross-env`** | `^10.1.0` | **跨平台环境变量控制**。确保在 Windows / macOS / Linux 等不同操作系统下统一执行 `NODE_ENV=test` 等脚本配置。 |
| **`tsc-alias`** | `^1.8.16` | **路径别名映射解析器**。在编译时将输出的 JS 产物中的 `tsconfig` path alias（如 `@/controllers/...`）自动转换为实际的相对路径。 |
| **`tsx`** | `^4.21.0` | **TypeScript 执行器**。允许直接在 Node 环境下通过 `tsx file.ts` 执行脚本，无需先经历编译构建步骤。 |
