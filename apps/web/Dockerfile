FROM node:20-slim

RUN apt-get update && apt-get install -y curl ca-certificates unzip && rm -rf /var/lib/apt/lists/*
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# 拷贝并安装 monorepo 依赖
COPY package.json bun.lock tsconfig.base.json turbo.json ./
COPY apps/web/package.json ./apps/web/
COPY apps/api/package.json ./apps/api/
RUN bun install --frozen-lockfile --registry=https://registry.npmmirror.com

ENV DEPLOY_TARGET=gcp

# 拷贝源码并打包
COPY apps/web ./apps/web
COPY apps/api ./apps/api
RUN bun run build:web

WORKDIR /app/apps/web
EXPOSE 8080
CMD ["bun", "run", "start"]
