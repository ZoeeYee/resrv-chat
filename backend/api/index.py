import sys
import os

# 添加 backend 目錄到 Python 路徑
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import Request
from fastapi.responses import Response
from main import app

# 手動處理 OPTIONS 預檢請求
@app.options("/{rest_of_path:path}")
async def preflight_handler(rest_of_path: str):
    return Response(
        content="OK",
        media_type="text/plain",
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
        },
    )

# 添加 CORS headers 到所有回應
@app.middleware("http")
async def add_cors_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
    return response

# Vercel 需要這個變數
handler = app

