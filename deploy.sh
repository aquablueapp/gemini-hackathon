#!/bin/bash
set -e

PROJECT_ID="alien-legacy-500702-r7"
REGION="asia-northeast1"
REPO_NAME="hackathon-repo"
REGISTRY_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}"

# 确保 gcloud active project 切换为目标项目，以使 Cloud Run namespace 与当前项目对齐
gcloud config set project "${PROJECT_ID}"

# 定义推送重试函数以应对 GCP API 激活后的同步延迟
push_with_retry() {
  local tag=$1
  local max_attempts=5
  local attempt=1
  local wait_sec=15

  until docker push "$tag"; do
    if (( attempt >= max_attempts )); then
      echo "❌ 错误: 推送 $tag 失败，已重试 $max_attempts 次。"
      return 1
    fi
    echo "⚠️ 警告: 推送失败（可能由于 API 同步延迟），将在 $wait_sec 秒后进行第 $attempt 次重试..."
    sleep $wait_sec
    ((attempt++))
  done
  return 0
}

echo "=================================================="
echo "🚀 开始构建并部署 Hackathon 全栈平台..."
echo "GCP Project ID: ${PROJECT_ID}"
echo "=================================================="

# 1. 验证 Docker 是否在运行
if ! docker info >/dev/null 2>&1; then
    echo "❌ 错误: Docker 守护进程未启动，请先启动 Docker。"
    exit 1
fi

# 2. 使用临时 Access Token 直接登录 Docker 仓库 (避免 gcloud 凭证助手延迟和 403 缓存问题)
echo "🔑 正在使用 Access Token 登录 Docker 仓库..."
gcloud auth print-access-token | docker login -u oauth2accesstoken --password-stdin https://${REGION}-docker.pkg.dev

# 3. 构建并推送后端 API 镜像
echo "📦 正在构建并推送 API 后端镜像..."
docker build --platform linux/amd64 -t aquablue-api -f apps/api/Dockerfile .
docker tag aquablue-api ${REGISTRY_URL}/api:latest
push_with_retry ${REGISTRY_URL}/api:latest

# 4. 构建并推送 Agent 伴生端镜像
echo "📦 正在构建并推送 Agent 伴生端镜像..."
docker build --platform linux/amd64 -t aquablue-agent -f apps/agent/Dockerfile apps/agent
docker tag aquablue-agent ${REGISTRY_URL}/agent:latest
push_with_retry ${REGISTRY_URL}/agent:latest

# 5. 构建并推送前端 Web 镜像
echo "📦 正在构建并推送前端 Web 镜像..."
docker build --platform linux/amd64 -t aquablue-web -f apps/web/Dockerfile .
docker tag aquablue-web ${REGISTRY_URL}/web:latest
push_with_retry ${REGISTRY_URL}/web:latest

# 6. 部署后端多容器服务
echo "🚀 获取最新构建镜像的 Digest 摘要..."
API_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY_URL}/api:latest)
AGENT_DIGEST=$(docker inspect --format='{{index .RepoDigests 0}}' ${REGISTRY_URL}/agent:latest)

echo "🚀 正在使用镜像 Digest 动态装配 hackathon-service.temp.yaml..."
cp hackathon-service.yaml hackathon-service.temp.yaml
sed -i.bak "s|image: ${REGISTRY_URL}/api:latest|image: ${API_DIGEST}|g" hackathon-service.temp.yaml
sed -i.bak "s|image: ${REGISTRY_URL}/agent:latest|image: ${AGENT_DIGEST}|g" hackathon-service.temp.yaml

echo "🚀 正在部署后端多容器服务 (hackathon-backend)..."
gcloud beta run services replace hackathon-service.temp.yaml --platform managed --region ${REGION}
rm -f hackathon-service.temp.yaml hackathon-service.temp.yaml.bak

# 允许未授权访问后端
gcloud run services add-iam-policy-binding hackathon-backend \
    --region=${REGION} \
    --member="allUsers" \
    --role="roles/run.invoker"

# 7. 获取后端公网 URL
BACKEND_URL=$(gcloud run services describe hackathon-backend --region=${REGION} --format='value(status.url)')
echo "✅ 后端部署成功，地址为: ${BACKEND_URL}"

# 8. 部署前端服务并注入后端 URL
echo "🚀 正在部署前端服务 (hackathon-web)..."
gcloud run deploy hackathon-web \
  --image=${REGISTRY_URL}/web:latest \
  --platform=managed \
  --region=${REGION} \
  --service-account="hackathon-runner@${PROJECT_ID}.iam.gserviceaccount.com" \
  --set-env-vars="API_URL=${BACKEND_URL}" \
  --allow-unauthenticated

# 9. 获取前端公网 URL
FRONTEND_URL=$(gcloud run services describe hackathon-web --region=${REGION} --format='value(status.url)')
echo "✅ 前端部署成功，地址为: ${FRONTEND_URL}"

# 10. 更新后端 APP_URL 环境变量为真实的前端 URL
echo "🔄 正在更新后端 APP_URL 环境变量为真实的前端 URL..."
gcloud run services update hackathon-backend \
  --region=${REGION} \
  --update-env-vars="APP_URL=${FRONTEND_URL}"

echo "=================================================="
echo "🎉 部署完成！"
echo "前端控制台: ${FRONTEND_URL}"
echo "后端 API: ${BACKEND_URL}"
echo "=================================================="
