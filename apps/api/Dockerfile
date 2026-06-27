FROM node:20-slim

# 安装 Python3, curl, ca-certificates, unzip
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    ca-certificates \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# 安装 uv (供 Sandbox 派生使用)
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh
ENV PATH="/root/.local/bin/:${PATH}"

# 全局安装 Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# 复制并配置 Monorepo 根目录及子应用依赖描述
COPY package.json bun.lock tsconfig.base.json turbo.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

RUN bun install --frozen-lockfile

# 复制 API 源码并打包构建
COPY apps/api ./apps/api
RUN bun run build:api

WORKDIR /app/apps/api
EXPOSE 8080
ENV PORT=8080

CMD ["bun", "run", "start"]
