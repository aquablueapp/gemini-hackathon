import httpx
import os
import json
import time
import google.auth
from google.oauth2 import service_account
from google.auth.transport.requests import Request
from google.adk.tools import ToolContext

API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:7667")

async def get_google_slides_token(tool_context: ToolContext) -> str:
    """
    获取具有 Google Slides 和 Drive 读写权限的 OAuth2 Access Token。
    
    1. 优先从 tool_context 的 user_credentials 读取。
    2. 如果是 OAuth 认证 JSON (accessToken, refreshToken, expiresAt):
       - 检查是否过期（留 120s buffer）。
       - 如果过期且有 refreshToken，使用 client_id & client_secret 刷新，并自动将更新后的数据 POST 回 API 数据库。
    3. 如果是 Service Account JSON, 自动解析并授权 scopes 获取 Token。
    4. 如果是普通字符串, 直接作为 Bearer token 使用。
    5. 兜底降级回退到 GCP 容器/本地 ADC (Application Default Credentials) 凭证。
    """
    user_creds = tool_context.state.get("user_credentials", {}) if tool_context else {}
    google_secret = user_creds.get("google") or os.environ.get("GOOGLE_ACCESS_TOKEN", "")

    if google_secret:
        google_secret = google_secret.strip()
        # Case A: JSON format (either OAuth Data or Service Account)
        if google_secret.startswith("{") and google_secret.endswith("}"):
            try:
                info = json.loads(google_secret)
                
                # Case A.1: OAuth Data (accessToken, refreshToken, expiresAt)
                if "accessToken" in info:
                    access_token = info.get("accessToken")
                    refresh_token = info.get("refreshToken")
                    expires_at = info.get("expiresAt", 0)
                    
                    # Check if token is expired or close to expiration (within 120 seconds)
                    current_ms = time.time() * 1000
                    if expires_at - current_ms < 120 * 1000 and refresh_token:
                        # Attempt to refresh token
                        refresh_url = "https://oauth2.googleapis.com/token"
                        client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
                        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
                        
                        if client_id and client_secret:
                            payload = {
                                "client_id": client_id,
                                "client_secret": client_secret,
                                "refresh_token": refresh_token,
                                "grant_type": "refresh_token"
                            }
                            async with httpx.AsyncClient() as client:
                                res = await client.post(refresh_url, data=payload, timeout=10.0)
                                if res.status_code == 200:
                                    res_data = res.json()
                                    new_access_token = res_data.get("access_token")
                                    expires_in = res_data.get("expires_in", 3600)
                                    
                                    # Update credentials JSON
                                    updated_credentials = {
                                        "accessToken": new_access_token,
                                        "refreshToken": refresh_token,  # Keep original refresh_token
                                        "expiresAt": int(time.time() * 1000) + (expires_in * 1000)
                                    }
                                    # Post back to Hono API backend to update Firestore
                                    try:
                                        await client.post(
                                            f"{API_BASE_URL}/credentials",
                                            json={
                                                "service": "google",
                                                "secret": json.dumps(updated_credentials)
                                            },
                                            timeout=5.0
                                        )
                                        print("✅ Google Slides OAuth token refreshed and saved successfully.")
                                    except Exception as write_err:
                                        print("Failed to save refreshed token back to DB:", write_err)
                                    
                                    return new_access_token
                                else:
                                    print(f"Failed to refresh Google OAuth token: {res.status_code} {res.text}")
                        else:
                            print("Cannot refresh token: GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET environment variables are missing.")
                    
                    return access_token
                
                # Case A.2: Service Account JSON
                else:
                    scopes = [
                        'https://www.googleapis.com/auth/presentations',
                        'https://www.googleapis.com/auth/drive'
                    ]
                    credentials = service_account.Credentials.from_service_account_info(info, scopes=scopes)
                    credentials.refresh(Request())
                    return credentials.token
            except Exception as e:
                print("Failed to authorize/parse Google credential JSON from user_credentials:", e)
        else:
            # Case B: Direct Bearer Access Token
            return google_secret

    # Fallback to local GCP Application Default Credentials (ADC) for developer convenience
    try:
        credentials, project = google.auth.default(scopes=[
            'https://www.googleapis.com/auth/presentations',
            'https://www.googleapis.com/auth/drive'
        ])
        if not credentials.token:
            credentials.refresh(Request())
        return credentials.token
    except Exception as e:
        print("Application Default Credentials (ADC) fallback failed:", e)
        return ""

async def read_google_slides(presentation_id: str, tool_context: ToolContext) -> dict:
    """
    读取指定 Google Slides (Presentation) 的完整文档结构和幻灯片页元素，用于分析现有的幻灯片内容。
    
    Args:
        presentation_id: 幻灯片文档的 Presentation ID (在 slides url 中)
    """
    token = await get_google_slides_token(tool_context)
    if not token:
        return {"error": "Failed to obtain Google OAuth access token. Ensure OAuth authorization is completed."}

    url = f"https://slides.googleapis.com/v1/presentations/{presentation_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, headers=headers, timeout=15.0)
            if response.status_code != 200:
                return {"error": f"Google Slides API returned error status {response.status_code}: {response.text}"}
            return response.json()
        except Exception as e:
            return {"error": f"Connection to Google Slides API failed: {str(e)}"}

async def create_google_presentation(title: str, tool_context: ToolContext) -> dict:
    """
    在 Google Drive 中新建一个空白 of Google Slides (Presentation) 幻灯片。
    返回新幻灯片的元数据（包含 presentationId，可用于后续添加/修改内容）。
    
    Args:
        title: 幻灯片的标题 (文件名)
    """
    token = await get_google_slides_token(tool_context)
    if not token:
        return {"error": "Failed to obtain Google OAuth access token. Ensure OAuth authorization is completed."}

    url = "https://slides.googleapis.com/v1/presentations"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"title": title}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=15.0)
            if response.status_code != 200:
                return {"error": f"Google Slides API returned error status {response.status_code}: {response.text}"}
            return response.json()
        except Exception as e:
            return {"error": f"Connection to Google Slides API failed: {str(e)}"}

async def write_google_slides(presentation_id: str, requests: list[dict], tool_context: ToolContext) -> dict:
    """
    对指定的 Google Slides 幻灯片进行批量编辑（Batch Update），如创建幻灯片页、插入文本/形状、删除/更新页内元素。
    
    Args:
        presentation_id: 幻灯片文档的 Presentation ID (在 slides url 中)
        requests: 批量执行的请求对象列表 (格式为 Google Slides API 规范的 batchUpdate 请求，例如 [{"createSlide": {...}}, {"insertText": {...}}])
    """
    token = await get_google_slides_token(tool_context)
    if not token:
        return {"error": "Failed to obtain Google OAuth access token. Ensure OAuth authorization is completed."}

    url = f"https://slides.googleapis.com/v1/presentations/{presentation_id}:batchUpdate"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"requests": requests}
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, headers=headers, json=payload, timeout=20.0)
            if response.status_code != 200:
                return {"error": f"Google Slides API returned error status {response.status_code}: {response.text}"}
            return response.json()
        except Exception as e:
            return {"error": f"Connection to Google Slides API failed: {str(e)}"}
