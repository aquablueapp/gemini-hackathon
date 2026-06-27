# GCP 原生全栈多容器服务开发与部署参考指南

本指南整合了 `aquablue-monorepo` 项目中关于架构设计、本地开发、编码红线与 GCP (Google Cloud Run) 部署的全部核心技术规范和最佳实践，为在 `test/` 目录中构建和运行项目提供完整对齐的参照标准。

---

## 📖 1. 核心领域与术语 (Domain Glossary)

在设计和实现业务逻辑时，必须遵循以下领域定义：
* **Applet (快捷应用 / 智能工作流)**：可直接运行的、经过验证的静态自动化任务脚本（Python）。支持可视化编辑和 conversational 精修。
* **Session (开发会话)**：用户与 Aquablue Agent 协作交互的持久化聊天工作区，上下文与事件必须持久化至 Firestore 以防丢失。
* **Sandbox (运行沙盒)**：无状态、受限的代码运行环境，用于试运行（Trial）或执行 Applet。生成的临时代码或产物需持久化至分布式存储（GCS）。
* **Credential (外部凭证)**：用户授权外接服务（如 Gmail、Slack）的加密 OAuth 凭证，运行 Sandbox 时需安全回填。
* **Trashing (移入回收站)**：Gmail 邮件废弃操作。**核心安全红线**：本地 Trial 运行时必须生成 Affected Preview 供用户二次确认；生产运行单次限额 50 条，严防批量误删。

---

## 📐 2. 系统架构与拓扑 (System Architecture)

### 2.1 物理部署与逻辑通信
系统在 **GCP Cloud Run** 上以 **Knative 多容器（Sidecar）** 形式部署，共享同一个 Network Namespace (即 `localhost`)。

```
                    [ 外部 Ingress 流量 ]
                             │
                             ▼ (Port 8080)
┌────────────────────────────────────────────────────────┐
│ Cloud Run 实例 (Pod)                                    │
│                                                        │
│  ┌──────────────────────┐   http://localhost:7668      │
│  │   backend-api        ├──────────────────────────┐   │
│  │   (Node.js / Hono)   │                          │   │
│  └──────────┬───────────┘                          ▼   │
│             │                               ┌──────────┴──────────┐
│             │ spawn (子进程)                 │   backend-agent     │
│             ▼                               │   (Python / ADK)    │
│  ┌──────────────────────┐                   └─────────────────────┘
│  │   Sandbox 进程       │                                      │
│  │ (uv run applet.py)   │                                      │
│  └──────────────────────┘                                      │
└────────────────────────────────────────────────────────┘
```

* **主容器 (backend-api)**：监听 `8080` 端口，对外承载 HTTP 流量，对内作为 Ingress。同时负责派生 Sandbox 进程。
* **伴生容器 (backend-agent)**：监听 `7668` 端口，专门提供大模型（Vertex AI）推理与决策规划支持。主容器通过 `http://127.0.0.1:7668` 与其通信。
* **沙盒宿主**: Sandbox 脚本并不是在 `backend-agent` 容器中运行，而是直接运行在 `backend-api` 主容器的 Node 子进程中（执行 `child_process.spawn('uv', ['run', ...])`）。因此，**主容器的 Docker 镜像中必须装有 Python 3.11 及 uv 依赖链**。

---

## 💻 3. 本地开发与编码红线 (Coding Red Lines)

### 3.1 基础环境约束
1. **包管理器**：必须且仅能使用 `bun`（如 `bun add`, `bun run dev`），严禁在项目中使用 `npm`/`yarn`/`pnpm`。
2. **严禁 any 类型**：类型不确定时使用 `unknown`，严格消除 TS 类型击穿。
3. **禁止 Naked console.log**：前/后端均引入并包装了结构化日志库 `pino`，必须通过 logger 打印 JSON 日志，以便于云端检索。

### 3.2 后端 API 规范 (`apps/api`)
每个业务模块在 `src/routes/<module>/` 下使用 **四层路由架构** 隔离开发：
1. **`<module>.routes.ts`**：声明式 API 契约定义。利用 `@hono/zod-openapi` 的 `createRoute()` 绑定请求、响应（200, 400, 404, 500）的 Zod Schema，**禁止写入业务逻辑**。
2. **`<module>.handlers.ts`**：实现具体的业务。接收上下文，调用 service 或操作 Firestore，输出结构化 Pino 日志。
3. **`<module>.index.ts`**：调用 `createRouter()` 将 routes 与 handlers 装配挂载。
4. **`<module>.test.ts`**：编写 Vitest 集成测试（强制配置独立的 `.env.test` 测试数据库隔离，拦截并 Mock 全局 `globalThis.fetch`）。

### 3.3 前端 Web 规范 (`apps/web`)
1. **禁止组件内 Naked Fetch**：
   * 严禁在 React 组件渲染周期内直接通过 `useEffect(() => { fetch(...) })` 获取后端数据。
   * 必须通过 **TanStack Router `loader`** 的 `ensureQueryData()` 在路由跳转前完成数据预取（保证 SSR 首屏渲染性能）。
   * 组件内部配合 **TanStack Query `useQuery` / `useSuspenseQuery`** 实现数据脱水与注水绑定。
2. **禁止手动修改路由**：路由树文件 `routeTree.gen.ts` 纯由框架扫描 `src/routes/` 自动生成，禁止手动编辑。
3. **i18n 注水安全**：全局 Error Boundary 或 Pending Fallback **严禁动态调用 i18n 翻译探测**，以避免 SSR 与客户端水合不一致引发的 `Hydration Mismatch` 崩溃。

---

## ⚡ 4. 动态模型路由与 SSE 流式传输 (Dynamic Model Routing)

后端与伴生 Python Agent 之间通过 **Server-Sent Events (SSE)** 流式传输大模型生成数据，并基于 `state_delta` 实现动态模型分配：

1. **调用流向**：
   * 前端发起请求，并在 Payload 中携带 `model`（例如 `gemini-2.0-flash-thinking`）。
   * 后端通过 `@hono/zod-openapi` 校验 model 后，将参数包装在 `state_delta: { selected_model: '...' }` 中传递给 Python Agent 的 `/run_sse` 端口。
   * Python Agent 必须在 `app/agent.py` 的 Agent 实例化时注册 `before_model_callback`，从 `callback_context.state` 中读取 `selected_model` 并改写 `llm_request.model`，严禁在初始化 `Gemini()` 时静态硬编码模型 ID。

2. **推荐使用与支持的 Gemini 模型 ID**：
   * `gemini-2.5-flash`：默认轻量级模型，速度快。
   * `gemini-2.5-pro`：适合复杂逻辑编写和 Applet 编译的深度分析任务。
   * `gemini-2.0-flash-thinking`：提供长推理思考链展示（Reasoning Chain），便于 Debug 复杂 Bug。

---

## 🧪 5. 统一测试与自动降级

### 5.1 本地测试运行器铁律
* **运行命令**：必须使用 `bun run test`（调用底层 `Vitest` 运行器）。
* **核心警告**：**严禁使用原生 `bun test` 命令行**。原生 Bun 测试器在执行前端测试时不会加载 `vitest.config.ts` 中的 `happy-dom` 浏览器虚拟环境配置，这会导致全局 `document` 未定义，引发 React 组件测试在初始化时无限卡死。

### 5.2 数据库自动探测降级
为保证本地开发“开箱即用”且不强依赖复杂的容器模拟器环境，数据库连接代码应具备网络降级探测：
* 在本地 `development`/`test` 模式下，启动时先通过 Node.js 子进程执行 `execSync('nc -z -w 1 127.0.0.1 8081')` 探测 Firestore 模拟器是否在线。
* 若在线则连接模拟器；若不在线，优雅降级为内存中的 `MockFirestore` 并从本地 JSON 文件读取 Demo 种子数据。
* 在 GCP 生产模式下，自动剔除本地环境变量，通过 **Application Default Credentials (ADC)** 实现无密认证，直接连接云端原生 Firestore 实例。

---

## 🚀 6. GCP 部署与避坑指南 (GCP Cloud Run Deployment)

在编写 GCP 部署脚本（`deploy.sh`）或配置服务时，需特别注意以下规避问题：

### 6.1 伴生容器健康检查 (Knative 探针)
由于伴生 Python 容器 (`backend-agent`) 启动时需要加载较多的包，其就绪速度明显慢于 Node.js API 容器。如果 Knative 容器未针对 Agent 配置探针，流量会在 Agent 尚未完全启动时涌入，导致 API 调用 Agent 路由时抛出 `500 Connection Refused`。
* **避坑配置**：必须在 Knative 服务配置中为 `backend-agent` 容器显式添加 `startupProbe`：
  ```yaml
  startupProbe:
    failureThreshold: 6
    periodSeconds: 10
    tcpSocket:
      port: 7668
    timeoutSeconds: 3
  ```

### 6.2 跨域 URL 双向回填逻辑
后端 CORS 策略依赖前端公网 URL (`APP_URL`)，前端取数依赖后端公网 URL (`API_URL`)。在部署时必须通过脚本完成 URL 绑定闭环：
1. **第一步**：部署后端 API 服务，通过 `gcloud run services describe` 获取后端公网 `BACKEND_URL`。
2. **第二步**：部署前端 Web 服务，将 `API_URL=${BACKEND_URL}` 作为环境变量注入。随后通过 `gcloud run services describe` 获取前端公网 `FRONTEND_URL`。
3. **第三步**：使用 `gcloud run services update` 对后端服务进行环境变量更新，将 `APP_URL=${FRONTEND_URL}` 回填写入，完成跨域重定向配置闭环。

### 6.3 生产前端启动内存优化
* **避坑配置**：在 Monorepo 多包提升依赖下，前端打包产物会输出到 `apps/web/.output/server/index.mjs`。
* **启动方式**：在生产容器中启动前端，强制使用 `node .output/server/index.mjs` 绕过 `vinxi` 命令行直接启动 Nitro Web 服务。这不仅能避免依赖提升带来的寻址异常，还能极大地降低冷启动阶段的容器内存占用。
