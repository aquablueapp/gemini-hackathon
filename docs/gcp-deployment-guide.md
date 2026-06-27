# GCP 部署与避坑踩坑指南 (GCP Deployment & Troubleshooting Guide)

本篇文档记录了本平台在 **GCP (Google Cloud Run)** 上进行生产部署的完整拓扑、步骤、所需环境变量，以及我们在实际部署和调试中积累的踩坑经验与技术决议。

---

## 1. 核心云服务与 API 依赖
在 GCP 控制台或通过 `gcloud` 命令行，必须提前启用以下 API：
1. **`run.googleapis.com`** (Cloud Run API)：用于托管前端控制台与多容器后端 API 服务。
2. **`artifactregistry.googleapis.com`** (Artifact Registry API)：用于托管由 Docker 构建推送的所有容器镜像。
3. **`firestore.googleapis.com`** (Cloud Firestore API)：白盒元数据存储，须使用 **Native Mode (原生模式)** 且数据库 ID 为默认的 `(default)`。
4. **`secretmanager.googleapis.com`** (Secret Manager API)：安全保管加解密所用的 Master Key。
5. **`cloudresourcemanager.googleapis.com`** (Cloud Resource Manager API)：用于执行 IAM 权限的最小特权绑定。
6. **`aiplatform.googleapis.com`** (Vertex AI API)：用于驱动大模型 (Gemini) 进行 ReAct 推理和工作流自动拆解。

---

## 2. IAM 服务账号与权限配置
创建专属的服务运行账号 `hackathon-runner` 并赋予其最小化授权：
* **`roles/datastore.user`** (Cloud Datastore User)：读写 Firestore 元数据。
* **`roles/storage.objectAdmin`** (Storage Object Admin)：在 GCS 存储桶中读写 AI 合成的 Python `main.py` 代码。
* **`roles/secretmanager.secretAccessor`** (Secret Manager Secret Accessor)：读取 `hackathon-master-key` 主密钥用于凭证加解密。

---

## 3. 生产部署避坑与技术决议 (ADR/Troubleshoot)

在将以 Cloudflare 为核心的前后端架构重构并迁移至 GCP Cloud Run 的过程中，我们踩过了以下关键巨坑并给出了最终的技术解决方案，请在未来的 CI/CD 维护与二次开发中严格遵守：

### 3.1 Cloud Run 多容器 Ingress 端口冲突与 `PORT` 限制
* **巨坑表现**：在 `hackathon-service.yaml` 的 Knative 配置中，如果为 Sidecar 容器定义了端口，或者在 Ingress 容器的环境变量列表里显式声明了 `PORT` 变量，GCP API 会直接拒绝部署并报错。
* **解决方案**：
  1. 只能有且仅有一个容器（Ingress 主容器 `backend-api`）在 YAML 中声明 `ports`。Sidecar 伴生容器 `backend-agent` 绝不能声明 `ports`。
  2. 多容器默认共享 localhost 网络命名空间，`backend-api` 直接通过本地环回地址 `http://localhost:7668` 调用伴生容器。
  3. `PORT` 变量是 GCP Cloud Run 预留的系统级保留字，**绝对不能**在 yaml 中作为自定义环境变量添加在 `env:` 部分，Cloud Run 实例拉起时会自动将其注入到 Ingress 容器中。

### 3.2 Docker 镜像构建中 Bun 对 `unzip` 的隐式依赖
* **巨坑表现**：在 `node:20-slim` 或精简版 Debian/Ubuntu Docker 基础镜像中，由于默认没有预装 `unzip`，运行 `curl -fsSL https://bun.sh/install | bash` 安装 Bun 时会静默失败或在打包阶段中断报错。
* **解决方案**：在 Dockerfile 的安装步骤前，必须通过 `apt-get` 显式预装 `unzip`：
  ```dockerfile
  RUN apt-get update && apt-get install -y unzip curl && rm -rf /var/lib/apt/lists/*
  ```

### 3.3 GCP 镜像仓库 Docker 推送权限失效与 403 报错
* **巨坑表现**：本地运行 `gcloud auth configure-docker` 后，偶发因为 Docker helper 凭证管理器缓存失效或 API 鉴权过期而导致 `docker push` 被拒绝 (403 Forbidden)。
* **解决方案**：在脚本化一键部署中，使用 `gcloud` 实时生成临时 Access Token 显式登录镜像仓库：
  ```bash
  gcloud auth print-access-token | docker login -u oauth2access --password-stdin https://asia-northeast1-docker.pkg.dev
  ```

### 3.4 TanStack Start 在非 Cloudflare 模式构建下的 SPA 退化报错
* **巨坑表现**：当前端设置 `DEPLOY_TARGET=gcp` 剥离 Cloudflare Workers 适配器以打成标准的 Node SSR 镜像时，Vite 默认会在 client 构建流水线中寻找 `index.html` 模板，由于原项目以 Edge 运作为主未包含该文件，导致打包抛出 `Could not resolve entry module "index.html"` 致命错误。
* **解决方案**：我们在前端 `apps/web/` 根路径下创建了一个符合规范的占位 `index.html` 模板，专门用以稳定 Vite 的客户端生产打包环境。

### 3.5 Monorepo 提升依赖导致的构建命令丢失
* **巨坑表现**：由于 monorepo 将所有开发工具和命令包依赖提升至根目录下的 `node_modules` 中，当在子包（如 `apps/web`）的 Docker 容器中切换工作路径并直接执行 `vinxi build` 时，系统会报错 `vinxi: command not found`。
* **解决方案**：子应用的 `package.json` 中的构建脚本必须使用 `bunx`（或 `npx`）引流包接，如 `"build": "bunx vinxi build"`，以确保打包工具能够向上递归查找并执行根目录下的 CLI 指令。

### 3.6 Hono Node-Server 前端启动替代 Vinxi 运行时
* **巨坑表现**：在 GCP 环境下，我们使用 `DEPLOY_TARGET=gcp` 将前端 Web 作为标准的 Node SSR 应用打包构建（生成 `dist/` 目录）。如果直接在容器中使用 `vinxi start` 或通过原本面向 Cloudflare/Nitro 的 `node .output/server/index.mjs` 启动，会因为构建产物不包含 `.output` 目录而报错崩溃，并且 vinxi 运行时代建会消耗极大的运行内存。
* **解决方案**：在打包完成（生成 `dist/client` 与 `dist/server/server.js`）后，通过自定义的 Hono Node 桥接器（`node scripts/start.js`）来拉起前端。该桥接器通过 `@hono/node-server` 统一托管 `dist/client` 下的静态资源，并将其它动态路由请求直接转发给 React SSR 渲染器的 `fetch` 入口，从而兼顾流式渲染（Streaming）与极简冷启动开销。

### 3.7 沙盒动态依赖拉起的临时缓存 (UV_CACHE_DIR)
* **巨坑表现**：在 Cloud Run 运行时下，除了 `/tmp` 目录是基于内存的 tmpfs 外，其余目录均只读。如果 backend 在执行沙盒 Python 任务时不限制 `uv` 的缓存目录，每次下载大包不仅会变慢，还可能因为尝试写只读磁盘而崩溃。
* **解决方案**：在拉起 Python 沙盒脚本时，通过环境变量将 UV 缓存强制指定到内存盘 `/tmp/uv-cache`：
  ```bash
  export UV_CACHE_DIR=/tmp/uv-cache
  ```
  这能有效提升 Cloud Run 同一实例内多次运行 applet 脚本时的依赖拉取速度。

### 3.8 React 19 服务端流式渲染 (SSR) 与 Fallback 组件异步死锁
* **巨坑表现**：全局 Root Loader 异步数据解析完成前，如果全局 Fallback 挂载组件（如 `default-pending.tsx` 和 `default-catch-boundary.tsx`）内部使用了涉及 Promise 挂起（Suspense）的机制（如通过 `React.use()` 在组件内动态载入语言包），在 React 19 渲染时会直接导致服务端流式 HTML 渲染与路由流式传输陷入死锁，表现为连接超时和客户端页面永久挂在 "Loading..."。
* **解决方案**：移除 Fallback 阶段的动态/异步国际化翻译组件，改用纯同步静态骨架屏或简易错误信息占位符，从而确保服务端流式数据传输在 1 秒内完全畅通。

### 3.9 GCP Cloud Run Sidecar 容器缺乏探针导致假死就绪
* **巨坑表现**：多容器部署中，GCP 默认只根据主 Ingress 容器的 8080 端口探针来宣布 Revision 健康。如果 Sidecar 伴生容器（`backend-agent`）在启动阶段网络未就绪或因模块寻找路径错误崩溃，GCP 依然会将公网流量导入该实例，导致主容器向 `127.0.0.1:7668` 发送请求时遭遇 `ConnectionRefused`。
* **解决方案**：在 `hackathon-service.yaml` 中，显式为 `backend-agent` 配置 `startupProbe` 并监听 7668 端口的 tcpSocket。Knative 会直至确认 Agent 7668 端口完全开启并可达后，才会使整个 Revision 就绪并导入流量。

### 3.10 ADK 虚拟环境物理隔离与 app 模块加载冲突
* **巨坑表现**：为了规避 `adk web` 递归遍历 Python 虚拟环境 `.venv` 导致的上万依赖包 IO 卡死问题，我们把扫描根路径限制为了 `app/`。但 API 容器请求 `app_name: 'app'` 时，ADK 会去模块路径中寻找 `app/`，从而拼接出非法的 `/app/app/app` 导致 `Agent not found: 'app'` 运行时 500 异常。
* **解决方案**：将 app 源码在容器构建阶段拷贝到 `/app/src/app`，将工作路径 `WORKDIR` 切为 `/app/src`，并在 CMD 里使用 `adk web .` 启动。这样既在物理空间上把巨大的 `.venv` 留在了父目录中不参与 ADK 启动扫描，又保证了 ADK 能够在当前目录 `/app/src` 下完美定位并加载 `app` 模块。

### 3.11 Vertex AI Gemini 大模型调用的 IAM 权限配置
* **巨坑表现**：在云端通过 `GOOGLE_GENAI_USE_VERTEXAI="True"` 将请求引向 Vertex AI Gemini 大模型时，若绑定的 Service Account 缺少 predict 权限，会导致调用 `gemini-2.5-flash` 时抛出 `403 Forbidden` 并阻断大模型回复流。
* **解决方案**：必须为 GCP 运行期账号关联的 Service Account 追加赋予 **`roles/aiplatform.user`** (Vertex AI User) 权限角色。

### 3.12 TanStack Router SSR-Query 状态流未闭合导致的浏览器无限转圈
* **巨坑表现**：访问线上首页 `/` 或者是公开页面时，浏览器控制台完全空白且无任何静态资源 Pending，但浏览器 Tab 标签页一直在加载（转圈）且持续很长时间，甚至直至达到网络掐断超时。
* **原因分析**：
  1. 在 TanStack Start 中，若全局路由配置了 `setupRouterSsrQueryIntegration`，它会在流式 HTML 底层序列化一个 `queryStream` (Seroval 状态流) 用于前端 React Query 注水。
  2. 当首页或访问页面上没有任何 Query 发起时，此 `queryStream` 永远不会触发 close/return 信号，流式 HTML 响应的尾端便被挂起，无法最终关闭。
  3. 部署在 GCP Cloud Run 时，前端的 Google Frontend (GFE) 负载均衡器通常会尝试缓冲未结束的流式响应包再打包返回。流挂起不闭合导致了极高的 TTFB（首字节时间）延迟挂死，表现为浏览器无限转圈。
* **解决方案**：
  In not strictly requiring Server-Side Query Hydration context (e.g. only fetching on client, or robust loaders isolation), remove `setupRouterSsrQueryIntegration` registration inside `apps/web/src/router.tsx` to stop the unclosed `queryStream` serialization from locking the response. This slashes Web app TTFB latency to a few milliseconds.

### 3.13 部署时的双向依赖环境变量回填闭环
* **巨坑表现**：前端 `hackathon-web` 在构建与运行时需要注入后端的公网 API URL 才能发起请求；而后端 `hackathon-backend` 同样需要知道前端的公网 APP URL 以配置正确的跨域与重定向授权。在首次手动部署时，两者因为“相互需要对方的公网 URL”而陷入死循环。
* **解决方案**：我们在一键部署脚本 [deploy.sh](file:///Users/yl/gemini/hackathon/gemini-hackathon/yinlei/deploy.sh) 中实现了一个双向注入的自动化闭环：
  1. 首先部署后端容器服务得到其公网 `BACKEND_URL`。
  2. 随后部署前端容器并传入 `--set-env-vars="API_URL=${BACKEND_URL}"`，成功部署后获得前端的公网 `FRONTEND_URL`。
  3. 最后使用 `gcloud run services update` 回填更新后端实例的 `--update-env-vars="APP_URL=${FRONTEND_URL}"` 环境变量，优雅打通双向通信。

### 3.14 Firestore 本地自动探测 Mock 与生产 ADC 认证降级
* **巨坑表现**：在本地开发/测试模式下，若直接使用 GCP 的 Firestore SDK 可能会因为找不到凭证而报错；如果在生产环境容器内不慎带入或污染了 `FIRESTORE_EMULATOR_HOST` 环境变量，SDK 会将请求重定向到 localhost 导致连接挂起失败。
* **解决方案**：我们在 [firestore.ts](file:///Users/yl/gemini/hackathon/gemini-hackathon/yinlei/apps/api/src/db/firestore.ts) 中实现了一套运行期判定策略：
  - **本地/测试环境**：通过 Netcat（`nc`）自动探测本机 8081 端口是否启动了模拟器。若启动则连模拟器；若未探测到，则自动降级为内存 `MockFirestore` 并将数据落盘到本地的 `/tmp/aquablue-mock-db.json`，确保无模拟器时亦可无痛运行。
  - **GCP 生产环境**：在代码初始化前显式销毁 `process.env.FIRESTORE_EMULATOR_HOST` 变量，依靠 GCP ADC (Application Default Credentials) 机制，仅通过注入 `GOOGLE_CLOUD_PROJECT` 完成对 Firestore 与 GCS 存储的鉴权。

### 3.15 前端 DEPLOY_TARGET 跨平台构建适配机制
* **巨坑表现**：项目原本面向 Cloudflare Workers 边缘运行期设计，但在 GCP Cloud Run 生产环境中我们需要它作为标准的 Node.js 服务运行。如果直接构建，原本为 Cloudflare 注入的 Edge API Stubs 与 `@cloudflare/vite-plugin` 生产构建插件会与 Node.js 镜像冲突并引发编译错误。
* **解决方案**：在前端 [vite.config.ts](file:///Users/yl/gemini/hackathon/gemini-hackathon/yinlei/apps/web/vite.config.ts) 中引入 `DEPLOY_TARGET=gcp` 控制开关：
  - 当 `DEPLOY_TARGET === 'gcp'` 时，Vite 将不加载 `@cloudflare/vite-plugin` 构建插件，并从 `resolve.alias` 中完全剔除 Cloudflare 专属 of Node.js 兼容打补丁文件（如 `node:stream` 等 stubs），从而生成可在原生 Node.js / Hono 环境下无缝运行的标准 SSR 代码包。

### 3.16 沙盒运行器 (Sandbox) 的真实容器宿主与环境配置
* **巨坑表现**：后端整体虽以 GCP Cloud Run 多容器（Sidecar）架构部署，但极易使人误以为“用户的 Python applet 脚本是在伴生容器（`backend-agent`）中运行的”。如果把 sandbox 的依赖（如 `uv`、`python3` 等）错配在 Sidecar 容器中，会导致主 API 容器在执行 `runSandboxScript` 调用 `child_process.spawn('uv', ...)` 时抛出命令行不存在错误。
* **解决方案**：用户的 Applet 脚本沙盒实际上是**作为主容器 `backend-api` 内的本地子进程**派生并以 `uv run` 执行的。因此，在 [apps/api/Dockerfile](file:///Users/yl/gemini/hackathon/gemini-hackathon/yinlei/apps/api/Dockerfile) 中，我们必须在 node-slim 基础之上安装完整的 `python3-venv`、`curl` 并通过 install 脚本全局部署 `uv` 工具链；而 Sidecar 伴生容器 `backend-agent` 仅用于与 Vertex AI 进行大模型 ReAct 聊天决策交互，其本身不涉及用户沙盒代码的容器执行。

### 3.17 MockFirestore 数据易失防范与 Fallback
* **巨坑表现**：本地开发如未配置 Firestore 模拟器，服务将回退至 `in-memory MockFirestore`。每次重启 API 后端或 Vite 触发热重载都会彻底清空内存数据，导致保存的 GITHUB/GOOGLE 等凭证丢失。
* **解决方案**：在 `manage.sh` 中配置在服务启动后自动执行 `save-github-token.ts` 和 `save-google-key.ts` 注入默认开发凭证；同时在 `/agent/chat` 接口中，如数据库凭证为空，自动 fallback 使用宿主机的 `process.env.GITHUB_TOKEN`。

### 3.18 外部子进程 Exit Code 导致 Hono 500 RangeError 崩溃
* **巨坑表现**：后端调用 shell 抛出子进程错误时，错误对象的 `status` 字段（如 128 或 129）会被 Hono 默认读取为 HTTP 状态码。因 128 不在 `[200, 599]` 区间，会直接引发 `@hono/node-server` 抛出 `RangeError` 崩溃。
* **解决方案**：任何使用 `execSync` 的模块在 catch 异常后，必须重新包裹 Error 并显式强制指定合法的 HTTP 代码状态（如 `wrappedError.status = 500`），绝不允许将外部非标 exit code 暴露给 Hono 默认错误处理器。同时在克隆失败时自动退避，对公开仓库尝试免 Token 克隆。

### 3.19 DOM 仿真交互中同名 CSS Selector 碰撞导致凭证污染
* **巨坑表现**：页面中同时存在多个 `input` 元素（例如 A2UI 表单里的密码框与底部的 Chat 输入框）。如果只用宽泛的选择器（如 `input.flex-1`）进行 query，`querySelector` 只会匹配第一个，导致按键模拟写入到错误的输入框，甚至将普通对话内容当做 Token 发给后端鉴权接口。
* **解决方案**：所有前端测试与仿真脚本，必须使用高精确度的特化选择器（例如聊天框定位：`input[type="text"]` 或带有明确 ID 的 selector），禁止使用样式向的通用 class 组合进行组件定位。
