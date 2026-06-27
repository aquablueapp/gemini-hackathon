# GCP Full-Stack Aquablue

A modern, blazing-fast, and type-safe enterprise full-stack aquablue built with **Bun Workspaces + Turborepo**. Designed specifically for GCP environments (such as Google Cloud Run).

## 🌟 Core Architecture & Tech Stack

This project utilizes a Monorepo architecture to achieve **100% End-to-End Type Safety** from the database up to the frontend UI.

### Infrastructure
- **Package Manager & Runtime**: [Bun](https://bun.sh/) (Extreme installation and execution speed)
- **Monorepo Orchestration**: [Turborepo](https://turbo.build/repo) (Smart build caching and concurrent task execution)

### Backend API (`apps/api`)
- **Framework**: [Hono.js](https://hono.dev/) + `@hono/zod-openapi` (Auto-generated OpenAPI documentation)
- **Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore) (NoSQL Database)
- **Authentication**: Mock login logic (Simulated verification flow)

### Frontend Web (`apps/web`)
- **Meta-Framework**: [TanStack Start](https://tanstack.com/start) (React 19, Full-stack SSR)
- **Routing & Data Fetching**: TanStack Router + TanStack Query v5
- **UI & Styling**: [Tailwind CSS v4](https://tailwindcss.com/blog/tailwindcss-v4-alpha) + [HeroUI v3](https://v3.heroui.com/)
- **Forms & Validation**: `@tanstack/react-form` + Zod (Reusing backend Schemas)

---

## 🚀 Quick Start (Tutorial)

### Docker Compose
From the repository root, run the full stack in containers:

```bash
docker compose up --build
```

- **Web Frontend**: `http://localhost:7666`
- **API Backend**: `http://localhost:7667`
- **API Documentation (Scalar)**: `http://localhost:7667/reference`
- **Agent Playground**: `http://localhost:7668`

The Compose stack uses the API's development-mode in-memory Firestore fallback, so no local Bun, uv, or database setup is required to boot the app.

### 1. Prerequisites
Ensure you have the latest version of [Bun](https://bun.sh/) installed on your machine.
This project uses Firebase Firestore for database storage.

### 2. Install Dependencies
Run the following in the project root:
```bash
bun install
```

### 3. Environment Configuration
Navigate to `apps/api` and `apps/web` respectively to copy the environment templates:
```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 4. Start the Full-Stack Development Environment
Return to the project root and start the frontend and backend simultaneously:
```bash
bun run dev
```
- **Web Frontend**: `http://localhost:3000`
- **API Backend**: `http://localhost:9999`
- **API Documentation (Scalar)**: `http://localhost:9999/reference`

---

## 🏗 Directory Structure Guide (Explanation)

```text
.
├── apps/
│   ├── api/            # Hono backend service (exposes OpenAPI and Client export)
│   └── web/            # TanStack Start frontend (imports backend types via api workspace)
├── packages/           # Reserved shared package directory (for UI libraries or DB libraries)
├── package.json        # Root dependencies and Workspaces definition
├── turbo.json          # Turborepo build pipeline configuration
└── rules.md            # Project-level core architectural rules (Must-read for Agents)
```

### How does End-to-End Type Safety work?
1. The backend exports an `AppType` containing complete routing and Zod Schema type definitions in `apps/api/src/client.ts`.
2. The frontend imports the API via workspace dependencies in `package.json`: `"api": "workspace:*"`.
3. The frontend uses Hono's `hc` client combined with `AppType` to make requests, gaining auto-completion and type validation. Modifying the backend's return value will cause the frontend types to **report errors immediately**.

> ⚠️ **Development Principle Reminder**: Before starting secondary development, please be sure to read the `GEMINI.md` in the respective application directories or `rules.md` in the root directory. They contain the mandatory architectural specifications for this aquablue.

---

## ☁️ GCP Production Deployment (GCP 生产部署指南)

关于详细的 GCP 服务配置、环境变量清单以及核心避坑指南，请参阅专门的文档：[GCP 部署与避坑踩坑指南](file:///Users/yl/gemini/hackathon/gemini-hackathon/in-play/docs/gcp-deployment-guide.md)。

### 1. 部署架构概览
整个全栈应用由 **2 个 Cloud Run 服务** 托管于东京区域 (`asia-northeast1`)：
* **`hackathon-backend` (多容器服务)**：
  * **API 容器** (`backend-api` Hono.js Ingress)：侦听端口 `8080`。
  * **Agent 容器** (`backend-agent` Python FastAPI Sidecar)：侦听端口 `7668`，由 API 容器通过 `localhost` 网络共享代理调用。
  * **沙盒子进程**：API 服务在执行具体 Applet 脚本时，会在此容器内以宿主子进程形式拉起 `uv run main.py`，物理上受限于 Cloud Run (gVisor) 安全虚拟沙盒。
* **`hackathon-web` (单容器服务)**：
  * 运行前端控制台 (Node SSR 容器)，监听端口 `8080`，并流式对接后端 API 长连接服务。

### 2. 命令行一键部署
本地确保 Docker 守护进程在运行，并登录 GCP 后，直接在根目录下运行以下部署脚本：
```bash
./deploy.sh
```
该脚本会自动完成：
1. 本地使用 Docker 编译前端、后端和 Agent 镜像（强制指定 `linux/amd64` 平台以确保容器兼容性），并打标推送至 `hackathon-repo` 镜像库。
2. 自动化部署 `hackathon-backend` 多容器服务。
3. 提取后端的真实 URL 并注入为前端的环境变量，完成前端 `hackathon-web` 的部署。
4. 将前端的公网访问 URL 交叉绑定回后端服务的 `APP_URL` 变量上。

### 3. GCP 所需的核心云端配置
* **Firestore**：开启 Native 模式，Database ID 必须为默认的 `(default)`。
* **Secret Manager**：创建名叫 `hackathon-master-key` 的 Secret，用于存放凭证加解密的对称 32 字节 Hex 密钥，Cloud Run 会自动将其通过 `valueFrom` 注入到后端的 `BETTER_AUTH_SECRET` 环境变量中。
* **IAM 服务账号**：创建专属服务账号 `hackathon-runner`，并赋予对 Firestore 的读写、GCS 存储桶的读写以及 Secret Manager 密钥的解密访问权限。
