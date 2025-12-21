import os
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from pinecone import Pinecone
from groq import Groq

router = APIRouter(prefix="/chat", tags=["chat"])
security = HTTPBearer()

# 設定 API Keys
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PINECONE_INDEX_NAME = "resrv-rag"

# 初始化 Pinecone
pc = None
index = None
if PINECONE_API_KEY:
    try:
        pc = Pinecone(api_key=PINECONE_API_KEY)
        index = pc.Index(PINECONE_INDEX_NAME)
        print("✅ Pinecone 已連接")
    except Exception as e:
        print(f"⚠️ Pinecone 連接失敗: {e}")

# 初始化 Groq
groq_client = None
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
    print("✅ Groq API 已設定")
else:
    print("⚠️ 未設定 GROQ_API_KEY")

# Pydantic 模型
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    user_message: str
    ai_response: str
    timestamp: datetime
    sources: List[str] = []

class DocumentRequest(BaseModel):
    content: str
    title: str

class ChatHistoryItem(BaseModel):
    user_message: str
    ai_response: str
    created_at: datetime

# 儲存對話歷史（記憶體中）
conversation_histories = {}
chat_histories = {}

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


def search_knowledge_base(query: str, top_k: int = 3) -> List[dict]:
    """從 Pinecone 向量資料庫搜尋相關知識"""
    if not index:
        return []
    
    try:
        # 使用 Pinecone 的 Integrated Embedding 進行搜尋
        results = index.search(
            namespace="default",
            query={
                "top_k": top_k,
                "inputs": {"text": query}
            }
        )
        
        relevant_docs = []
        if results and hasattr(results, 'result') and results.result:
            hits = results.result.get('hits', [])
            for match in hits:
                score = match.get('_score', 0)
                if score > 0.3:  # 降低閾值以獲得更多結果
                    fields = match.get('fields', {})
                    relevant_docs.append({
                        "content": fields.get('content', fields.get('text', '')),
                        "title": fields.get('title', '未知來源'),
                        "score": score
                    })
        
        # 如果沒有結果，嘗試其他格式
        if not relevant_docs and results:
            # 嘗試直接訪問 matches
            matches = getattr(results, 'matches', [])
            for match in matches:
                score = getattr(match, 'score', 0)
                if score > 0.3:
                    metadata = getattr(match, 'metadata', {})
                    relevant_docs.append({
                        "content": metadata.get('content', metadata.get('text', '')),
                        "title": metadata.get('title', '未知來源'),
                        "score": score
                    })
        
        return relevant_docs
    except Exception as e:
        print(f"搜尋知識庫失敗: {e}")
        import traceback
        traceback.print_exc()
        return []


def generate_rag_response(query: str, context_docs: List[dict], conversation_history: List[dict]) -> str:
    """使用 Groq LLM 生成 RAG 回應"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API 未設定")
    
    # 建構上下文
    context_text = ""
    if context_docs:
        context_text = "\n\n📚 相關知識庫內容:\n"
        for i, doc in enumerate(context_docs, 1):
            context_text += f"\n[{i}] {doc['title']}:\n{doc['content']}\n"
    
    # 建構系統提示
    system_prompt = f"""你是一個智慧助理。請根據以下知識庫內容回答用戶的問題。
如果知識庫中沒有相關資訊，請誠實說明並盡力根據你的知識回答。
回答時請使用繁體中文。
{context_text}"""
    
    # 建構對話歷史
    messages = [{"role": "system", "content": system_prompt}]
    
    # 加入最近的對話歷史（最多 10 條）
    for msg in conversation_history[-10:]:
        messages.append({"role": "user", "content": msg["user"]})
        messages.append({"role": "assistant", "content": msg["assistant"]})
    
    # 加入當前問題
    messages.append({"role": "user", "content": query})
    
    try:
        response = groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=messages,
            temperature=0.7,
            max_tokens=2048
        )
        return response.choices[0].message.content
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 回覆失敗: {str(e)}")


@router.post("/send", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    user_id: str = Depends(verify_token_simple)
):
    """發送訊息給 RAG AI 並取得回覆（需要登入）"""
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq API 未設定")
    
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="訊息不能為空")
    
    try:
        # 從知識庫搜尋相關內容
        relevant_docs = search_knowledge_base(request.message)
        sources = [doc["title"] for doc in relevant_docs]
        
        # 取得對話歷史
        if user_id not in conversation_histories:
            conversation_histories[user_id] = []
        history = conversation_histories[user_id]
        
        # 生成 RAG 回應
        ai_response = generate_rag_response(request.message, relevant_docs, history)
        
        # 更新對話歷史
        history.append({
            "user": request.message,
            "assistant": ai_response
        })
        
        # 儲存聊天記錄
        if user_id not in chat_histories:
            chat_histories[user_id] = []
        chat_histories[user_id].append({
            "user_message": request.message,
            "ai_response": ai_response,
            "created_at": datetime.utcnow(),
            "sources": sources
        })
        
        return ChatResponse(
            user_message=request.message,
            ai_response=ai_response,
            timestamp=datetime.utcnow(),
            sources=sources
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI 回覆失敗: {str(e)}")


@router.post("/documents")
async def add_document(
    request: DocumentRequest,
    user_id: str = Depends(verify_token_simple)
):
    """新增文件到知識庫（需要登入）"""
    if not index:
        raise HTTPException(status_code=500, detail="Pinecone 未連接")
    
    if not request.content.strip():
        raise HTTPException(status_code=400, detail="文件內容不能為空")
    
    try:
        import uuid
        doc_id = str(uuid.uuid4())
        
        # 使用 Pinecone Integrated Embedding 進行 upsert
        # 注意：text 欄位是 llama-text-embed-v2 模型所需的
        index.upsert_records(
            namespace="default",
            records=[
                {
                    "_id": doc_id,
                    "text": request.content,  # Pinecone embedding 模型需要 text 欄位
                    "content": request.content,
                    "title": request.title,
                    "user_id": user_id,
                    "created_at": datetime.utcnow().isoformat()
                }
            ]
        )
        
        return {
            "message": "文件已成功新增到知識庫",
            "document_id": doc_id,
            "title": request.title
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"新增文件失敗: {str(e)}")


@router.get("/documents")
async def list_documents(
    user_id: str = Depends(verify_token_simple)
):
    """列出知識庫中的文件（需要登入）"""
    if not index:
        raise HTTPException(status_code=500, detail="Pinecone 未連接")
    
    try:
        # 取得索引統計
        stats = index.describe_index_stats()
        
        # 處理不同的返回格式
        if hasattr(stats, 'total_vector_count'):
            total = stats.total_vector_count
        elif isinstance(stats, dict):
            total = stats.get("total_vector_count", 0)
        else:
            total = 0
        
        if hasattr(stats, 'namespaces'):
            namespaces = dict(stats.namespaces) if stats.namespaces else {}
        elif isinstance(stats, dict):
            namespaces = stats.get("namespaces", {})
        else:
            namespaces = {}
            
        return {
            "total_vectors": total,
            "namespaces": namespaces
        }
    except Exception as e:
        print(f"取得統計失敗: {e}")
        return {
            "total_vectors": 0,
            "namespaces": {},
            "error": str(e)
        }


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
            "created_at": r["created_at"].isoformat(),
            "sources": r.get("sources", [])
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
