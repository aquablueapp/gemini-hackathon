FROM python:3.11-slim

# 安装 curl, ca-certificates, make
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    make \
    && rm -rf /var/lib/apt/lists/*

# 安装 uv
ADD https://astral.sh/uv/install.sh /uv-installer.sh
RUN sh /uv-installer.sh && rm /uv-installer.sh
ENV PATH="/root/.local/bin/:${PATH}"

WORKDIR /app

# 复制项目代码及依赖描述
COPY pyproject.toml uv.lock Makefile ./

# 在构建阶段完全同步依赖
RUN uv sync --frozen

# 将 app 源码复制到独立的 src/app 文件夹中，以物理隔离虚拟环境 .venv 的扫描
COPY app ./src/app

# 切换工作目录到 src，使 adk web . 运行时只能扫描到 app/ 子目录
WORKDIR /app/src

# 将虚拟环境可执行路径加入 PATH 
ENV PATH="/app/.venv/bin:${PATH}"

EXPOSE 7668
# 扫描当前目录 (.) 即可完美加载 'app' 模块，且不会遍历父级中的 .venv 导致卡死
CMD ["adk", "web", ".", "--port", "7668", "--host", "0.0.0.0", "--no-reload"]
