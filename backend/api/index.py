import sys
import os

# 添加 backend 目錄到 Python 路徑
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)

from main import app

# Vercel 需要這個變數
handler = app

