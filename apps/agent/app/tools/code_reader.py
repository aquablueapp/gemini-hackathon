import httpx
import os
from google.adk.tools import ToolContext

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:7667")

async def get_commit_code_outline(
    owner: str, 
    repo: str, 
    commit_sha: str, 
    tool_context: ToolContext
) -> dict:
    """
    通过对指定 GitHub Commit 进行本地裸仓库快速 Diff 解析，获取该 Commit 涉及的修改大纲元数据（包括类名、方法名和行区间）。
    
    参数:
        owner: 仓库所有者 (例如 'aquablueapp')
        repo: 仓库名称 (例如 'gemini-hackathon')
        commit_sha: Commit 唯一哈希
    """
    user_creds = tool_context.state.get("user_credentials", {}) if tool_context else {}
    github_token = user_creds.get("github") or os.getenv("GITHUB_TOKEN") or ""
    
    url = f"{API_BASE_URL}/ast/outline"
    payload = {
        "github_token": github_token,
        "owner": owner,
        "repo": repo,
        "commit_sha": commit_sha
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {"error": f"Failed to get outline: {e.response.status_code} - {e.response.text}"}
        except Exception as e:
            return {"error": f"Failed to get outline: {str(e)}"}

async def get_commit_code_details(
    owner: str, 
    repo: str, 
    commit_sha: str, 
    targets: list[dict],
    tool_context: ToolContext
) -> dict:
    """
    根据大纲过滤选择后需要精细阅读的实体（函数或类）列表，批量获取它们在对应 Commit 节点下的精准源码正文。
    
    参数:
        owner: 仓库所有者
        repo: 仓库名称
        commit_sha: Commit 唯一哈希
        targets: 目标列表，格式如 [{"file_path": "apps/api/src/server.ts", "name": "startServer"}]
    """
    user_creds = tool_context.state.get("user_credentials", {}) if tool_context else {}
    github_token = user_creds.get("github") or os.getenv("GITHUB_TOKEN") or ""
    
    url = f"{API_BASE_URL}/ast/details"
    payload = {
        "github_token": github_token,
        "owner": owner,
        "repo": repo,
        "commit_sha": commit_sha,
        "targets": targets
    }
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, timeout=30.0)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            return {"error": f"Failed to get details: {e.response.status_code} - {e.response.text}"}
        except Exception as e:
            return {"error": f"Failed to get details: {str(e)}"}
