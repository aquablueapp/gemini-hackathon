# AI Agent 一键构建多容器 Monorepo 平台提示词 (一键复制模板)

您可以直接将下方的内容全部复制并发送给全新的 AI 助手会话中。该提示词完美契合当前的业务需求（智能多源开发周报生成器）、技术栈拓扑与 GCP Cloud Run Sidecar 部署约束。

***

```markdown
你是一个资深全栈软件架构师。我需要你在 `test/` 目录下从零构建一个多容器（Monorepo）智能代理应用平台，该平台能在 GCP (Google Cloud Run) 上原生编译、构建与运行。

请根据以下**业务需求**、**技术选型拓扑**、**核心编码红线**和**GCP 生产部署适配机制**，一次性生成完整的文件目录结构和真实可运行的代码，严禁使用任何 `// TODO` 或伪造占位符。

---

### 1. 业务需求：智能多源日报/周报合成器 (Daily/Weekly Aquablue)
本平台作为一个智能工作流展示控制台，核心场景是为全栈开发者自动合成工作成果：
1. **多服务凭证托管中心**：支持安全绑定 GitHub PAT、Google Workspace OAuth 等凭证。密文在后端使用 `AES-256-GCM` 加密落库，在沙盒运行期作为临时环境变量注入，并在日志中通过正则脱敏屏蔽（例如带有 `ghp_` 的 Token）。
2. **多源数据读取与过滤**：支持自定义输入 `owner/repo` 仓库、分支、Google Docs/Sheets 链接，并预设 Daily（24小时）和 Weekly（7天）时间过滤器。
3. **大模型智能语义分类**：调用大模型深度解析代码 Diff 与文档内容，将成果智能归入：
   * `🚀 Features` (新功能开发)
   * `⚡️ Performance` (性能调优与复杂度降低)
   * `🎨 UI/UX` (视觉、动画与可访问性 A11y 修正)
   * `🔧 Fixes & Refactoring` (缺陷修复与重构)
4. **可视化工作流监视器**：前端使用 React Flow 渲染只读任务流拓扑，展示每个任务节点的执行状态（Pending 变灰、Running 闪烁、Success 变绿、Failed 变红）。后端通过 Server-Sent Events (SSE) 长连接流式输出节点运行日志与状态。
5. **量化结果看板**：提供改动类别占比环形图（Donut Chart）以及双柱状图对比优化前后的系统时延、吞吐量和内存开销（支持 hover 查看加速倍率）。

---

### 2. 技术选型与 Monorepo 拓扑 (apps/*)
包管理器：强制且仅使用 `Bun` 作为工作区管理器（根目录 `package.json` 配置 `workspaces: ["apps/*"]`）。

1. **前端控制台 (`apps/web`)**：
   * **框架**：React 19 + TanStack Start (SSR) + Tailwind CSS v4 + Vite。
   * **核心依赖**：`@xyflow/react` (React Flow 新版本)、`recharts`、`framer-motion`、`Radix UI`。
   * **路由与状态**：使用 TanStack Router（路由树文件 `routeTree.gen.ts` 纯由框架自动扫描生成，禁止手动编辑）进行强类型约束与 `loader` 首屏数据预取；使用 TanStack Query v5 进行客户端状态注水与水合。
2. **后端 API 服务 (`apps/api`)**：
   * **框架**：Hono.js + `@hono/node-server` (在 Node.js 环境下托管 API 和前端编译产物)。
   * **核心依赖**：`@hono/zod-openapi` + `@scalar/hono-api-reference`（于 `/reference` 下生成高颜值交互式 API 文档）；`pino` + `hono-pino` 输出结构化 JSON 日志。
   * **架构约束**：四层路由模式。业务路由按模块放在 `src/routes/<module>/` 下，每个模块包含：
     * `<module>.routes.ts`：OpenAPI 契约定义（声明请求、响应 Zod Schema，禁止写业务）。
     * `<module>.handlers.ts`：业务逻辑的具体实现。
     * `<module>.index.ts`：组装路由与处理程序。
     * `<module>.test.ts`：Vitest 集成测试（使用独立的 `.env.test` 测试库隔离）。
3. **AI 代理伴生端 (`apps/agent`)**：
   * **运行环境**：Python 3.11 + FastAPI。使用 `uv` 管理依赖与虚拟环境。
   * **核心框架**：ADK-Python (Google DeepMind Agent SDK)，接收后端 Node 的状态并利用 Gemini 大模型执行 ReAct 推理。
   * **无状态设计**：ADK 端使用 `InMemorySessionService`。Python 端不直接连接数据库，Node 服务端从 Firestore 读取会话历史和状态打包传给 Python Sidecar，Python 推理完后将状态 delta 返还给 Node，由 Node 写入 Firestore，保证 Python 端的秒级水平伸缩性。
4. **数据存储**：
   * **元数据**：Google Cloud Firestore（存储会话、审计日志、加密凭证等）。
   * **文件制品**：Google Cloud Storage (GCS，存储合成完毕的静态 `main.py` 自动化脚本)。

---

### 3. 核心编码红线与开发规约
- **绝对消灭 `any` 类型**：类型不确定时一律使用 `unknown`，通过运行时守卫（Type Guard）或 Zod 断言窄化类型。
- **消灭 Naked console.log**：前/后端统一引入 `pino` 结构化日志，方便云端过滤检索。
- **前端禁止 Naked Fetch**：严禁在 React 组件生命周期内直接使用 `useEffect` 进行 API 交互。必须在 TanStack Router `loader` 中通过 `ensureQueryData()` 预取，配合 `useSuspenseQuery` 水合。
- **本地数据库自动降级**：
  * 在本地 `development`/`test` 环境启动时，执行 Node.js 子进程 `execSync('nc -z -w 1 127.0.0.1 8081')` 探测本机 Firestore 模拟器是否运行。
  * 若在法则运行模拟器；若不在，则优雅降级为内存 `MockFirestore` (将数据落盘持久化到 `/tmp/aquablue-mock-db.json` 并写入演示种子数据)。
  * 生产环境自动销毁模拟器变量，通过 GCP **Application Default Credentials (ADC)** 鉴权连接原生云端数据库。
- **本地测试铁律**：测试脚本必须使用 `bun run test` (Vitest) 驱动 `happy-dom` 仿真浏览器。**严禁使用原生 `bun test`**，防止前端测试因缺失 happy-dom 浏览器环境而导致 React 组件挂载卡死。

---

### 4. GCP Cloud Run 生产部署与适配
该项目完全针对 **GCP (Google Cloud Run)** 原生运行期进行精简和优化。
1. **Sidecar 部署拓扑**：API 容器（`backend-api`，监听 8080）作为 Ingress，伴生 Agent 容器（`backend-agent`，监听 7668）作为 Sidecar。共享本地 localhost 命名空间。`hackathon-service.yaml` 中仅 Ingress 容器声明 `ports`。
2. **沙盒执行器宿主**：注意！用户的 Python Applet 沙盒是在 **`backend-api` (主 Node 容器)** 内部通过子进程 `child_process.spawn('uv', ['run', ...])` 启动执行的。因此，在 `apps/api/Dockerfile` 中，必须在 node-slim 镜像之上使用 `apt-get` 安装 `python3`、`python3-venv` 以及全局安装 `uv` 依赖链。
3. **就绪探针 (startupProbe)**：在 `hackathon-service.yaml` 的 Knative 配置中，必须为 `backend-agent` 容器显式添加基于 `7668` 端口 tcpSocket 的 `startupProbe`，等待 Python 容器完全就绪后再导入公网流量。
4. **前端托管优化**：
   * 构建配置：打包时传入 `DEPLOY_TARGET=gcp` 变量。Vite 需绕过 Cloudflare Workers 构建插件，生成标准的 SSR 静态资源（`dist/client` 与 `dist/server/server.js`）。
   * 启动优化：编写 `apps/web/scripts/start.js`，引入 `@hono/node-server` 托管静态产物，并通过桥接器统一转发 SSR 动态请求到 React 渲染器的 `fetch` 入口。生产 Docker 启动命令强制使用 `node .output/server/index.mjs` (或 `scripts/start.js` 对应入口) 绕过 `vinxi` 包装，规避多包依赖提升的寻址异常，减少冷启动内存占用。
5. **部署脚本与双向回填**：
   * 编写 `deploy.sh` 脚本，必须实现双向回填：
     1. 首先部署后端 API `hackathon-backend` 获得其公网 URL (`BACKEND_URL`)。
     2. 随后部署前端 `hackathon-web` 并将 `--set-env-vars="API_URL=${BACKEND_URL}"` 传入，获得其前端公网 URL (`FRONTEND_URL`)。
     3. 最后使用 `gcloud run services update` 将前端 URL 作为环境变量 `APP_URL` 动态更新回填给后端实例，完成安全的 CORS 与重定向闭环。

请现在根据以上技术蓝图与约束，规划并生成该 Monorepo 平台所有需要的文件结构、配置文件（如 package.json、tsconfig.json、vite.config.ts、Dockerfile 等）和核心的路由、UI、AI 伴生逻辑及部署脚本。
```
