import os
from datetime import datetime
from typing import List, Optional

import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import User, ChatHistory
from auth import current_user

router = APIRouter(prefix="/chat", tags=["chat"])

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

class ChatHistoryResponse(BaseModel):
    id: int
    user_message: str
    ai_response: str
    created_at: datetime

    class Config:
        from_attributes = True

# 儲存對話歷史（用於 Gemini 上下文）
conversation_histories = {}

def get_conversation_history(user_id: int) -> list:
    """取得使用者的對話歷史"""
    if user_id not in conversation_histories:
        conversation_histories[user_id] = []
    return conversation_histories[user_id]

@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    user: User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """發送訊息給 AI 並取得回覆（需要登入）"""
    if not model:
        raise HTTPException(status_code=500, detail="Gemini API 未設定")
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="訊息不能為空")
    
    try:
        # 取得對話歷史
        history = get_conversation_history(user.id)
        
        # 建立對話上下文
        chat = model.start_chat(history=history)
        
        # 發送訊息
        response = chat.send_message(request.message)
        ai_response = response.text
        
        # 更新記憶體中的對話歷史
        history.append({"role": "user", "parts": [request.message]})
        history.append({"role": "model", "parts": [ai_response]})
        
        # 儲存到資料庫
        chat_record = ChatHistory(
            user_id=user.id,
            user_message=request.message,
            ai_response=ai_response
        )
        db.add(chat_record)
        db.commit()
        
        return ChatResponse(
            user_message=request.message,
            ai_response=ai_response,
            timestamp=datetime.utcnow()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 回覆失敗: {str(e)}")

@router.get("/history", response_model=List[ChatHistoryResponse])
async def get_chat_history(
    limit: int = 50,
    user: User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """取得聊天歷史記錄（需要登入）"""
    records = db.query(ChatHistory)\
        .filter(ChatHistory.user_id == user.id)\
        .order_by(ChatHistory.created_at.desc())\
        .limit(limit)\
        .all()
    
    return list(reversed(records))

@router.delete("/history")
async def clear_chat_history(
    user: User = Depends(current_user),
    db: Session = Depends(get_db)
):
    """清除聊天歷史記錄（需要登入）"""
    # 清除資料庫記錄
    db.query(ChatHistory).filter(ChatHistory.user_id == user.id).delete()
    db.commit()
    
    # 清除記憶體中的對話歷史
    if user.id in conversation_histories:
        conversation_histories[user.id] = []
    
    return {"message": "聊天歷史已清除"}