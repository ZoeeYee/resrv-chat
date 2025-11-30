import sys
import os

# 添加 backend 目錄到 Python 路徑
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

# 導入原始 app
from main import app

# 自定義中間件強制添加 CORS headers
class ForceCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 處理 OPTIONS 預檢請求
        if request.method == "OPTIONS":
            return Response(
                content="",
                status_code=200,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "86400",
                }
            )
        
        # 處理正常請求
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

# 添加自定義 CORS 中間件（會在最外層）
app.add_middleware(ForceCORSMiddleware)

# Vercel 需要這個變數
handler = app

