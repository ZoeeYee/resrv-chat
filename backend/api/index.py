import sys
import os

# 添加 backend 目錄到 Python 路徑
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response

# 自定義 ASGI 包裝器來處理 CORS
class CORSWrapper:
    def __init__(self, app):
        self.app = app
    
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            # 處理 OPTIONS 預檢請求
            if scope["method"] == "OPTIONS":
                response = Response(
                    content="OK",
                    status_code=200,
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, Accept",
                        "Access-Control-Max-Age": "86400",
                    }
                )
                await response(scope, receive, send)
                return
            
            # 包裝 send 來添加 CORS headers
            async def send_with_cors(message):
                if message["type"] == "http.response.start":
                    headers = list(message.get("headers", []))
                    headers.append((b"access-control-allow-origin", b"*"))
                    headers.append((b"access-control-allow-methods", b"GET, POST, PUT, DELETE, OPTIONS, PATCH"))
                    headers.append((b"access-control-allow-headers", b"Content-Type, Authorization, X-Requested-With, Accept"))
                    message["headers"] = headers
                await send(message)
            
            await self.app(scope, receive, send_with_cors)
        else:
            await self.app(scope, receive, send)

from main import app

# 用 CORS 包裝器包裝 app
handler = CORSWrapper(app)

