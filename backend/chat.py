import os
from datetime import datetime
from typing import List, Optional

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

router = APIRouter(prefix="/chat", tags=["chat"])
security = HTTPBearer()

# 設定 Gemini API
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-2.0-flash')
    print("✅ Gemini API 已設定")
else:
    model = None
    print("⚠️ 未設定 GEMINI_API_KEY")

# Pydantic 模型
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    user_message: str
    ai_response: str
    timestamp: datetime

class ChatHistoryItem(BaseModel):
    user_message: str
    ai_response: str
    created_at: datetime

# 儲存對話歷史（記憶體中，serverless 環境下每次請求可能會重置）
conversation_histories = {}
chat_histories = {}  # 用於儲存聊天記錄

def verify_token_simple(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    """簡單驗證 token 並返回 user_id（基於 Firebase UID）"""
    from auth import init_firebase
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    
    token = credentials.credentials
    
    if not init_firebase():
        raise HTTPException(status_code=500, detail="Firebase 未正確設定")
    
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token.get("uid", "anonymous")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"驗證失敗: {str(e)}")

@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    user_id: str = Depends(verify_token_simple)
):
    """發送訊息給 AI 並取得回覆（需要登入）"""
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API 未設定")
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="訊息不能為空")
    
    try:
        # 取得對話歷史
        if user_id not in conversation_histories:
            conversation_histories[user_id] = []
        history = conversation_histories[user_id]
        
        # 建立對話上下文
        chat = model.start_chat(history=history)
        
        # 發送訊息
        response = chat.send_message(request.message)
        ai_response = response.text
        
        # 更新記憶體中的對話歷史
        history.append({"role": "user", "parts": [request.message]})
        history.append({"role": "model", "parts": [ai_response]})
        
        # 儲存聊天記錄（記憶體中）
        if user_id not in chat_histories:
            chat_histories[user_id] = []
        chat_histories[user_id].append({
            "user_message": request.message,
            "ai_response": ai_response,
            "created_at": datetime.utcnow()
        })
        
        return ChatResponse(
            user_message=request.message,
            ai_response=ai_response,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 回覆失敗: {str(e)}")

@router.get("/history")
async def get_chat_history(
    limit: int = 50,
    user_id: str = Depends(verify_token_simple)
):
    """取得聊天歷史記錄（需要登入）"""
    if user_id not in chat_histories:
        return []
    
    records = chat_histories[user_id][-limit:]
    return [
        {
            "id": idx,
            "user_message": r["user_message"],
            "ai_response": r["ai_response"],
            "created_at": r["created_at"].isoformat()
        }
        for idx, r in enumerate(records)
    ]

@router.delete("/history")
async def clear_chat_history(
    user_id: str = Depends(verify_token_simple)
):
    """清除聊天歷史記錄（需要登入）"""
    if user_id in conversation_histories:
        conversation_histories[user_id] = []
    if user_id in chat_histories:
        chat_histories[user_id] = []
    
    return {"message": "聊天歷史已清除"}