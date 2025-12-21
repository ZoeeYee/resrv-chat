import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

// 使用環境變數或預設值
const API_BASE = import.meta.env.VITE_API_BASE || 
  (window.location.hostname === "localhost" ? "http://localhost:8001" : "https://resrv-chat-backend.vercel.app");

export default function ChatPage() {
  const { user, firebaseUser, openAuth } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const [showKnowledgePanel, setShowKnowledgePanel] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const [docContent, setDocContent] = useState("");
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [knowledgeStats, setKnowledgeStats] = useState(null);
  const messagesEndRef = useRef(null);

  // 取得 Firebase token
  useEffect(() => {
    const getToken = async () => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
        } catch (err) {
          console.error("取得 token 失敗:", err);
        }
      }
    };
    getToken();
  }, [firebaseUser]);

  // 自動滾動到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 載入歷史訊息
  useEffect(() => {
    if (token) {
      loadHistory();
      loadKnowledgeStats();
    }
  }, [token]);

  const loadHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const formatted = data.flatMap((item) => [
          { role: "user", content: item.user_message },
          { role: "ai", content: item.ai_response, sources: item.sources || [] },
        ]);
        setMessages(formatted);
      }
    } catch (err) {
      console.error("載入歷史失敗:", err);
    }
  };

  const loadKnowledgeStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/documents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKnowledgeStats(data);
      }
    } catch (err) {
      console.error("載入知識庫統計失敗:", err);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, { 
          role: "ai", 
          content: data.ai_response,
          sources: data.sources || []
        }]);
      } else {
        const err = await res.json();
        setMessages((prev) => [...prev, { role: "ai", content: `錯誤: ${err.detail}` }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", content: "連線失敗，請稍後再試" }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm("確定要清除所有聊天記錄嗎？")) return;
    try {
      await fetch(`${API_BASE}/chat/history`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages([]);
    } catch (err) {
      console.error("清除失敗:", err);
    }
  };

  const uploadDocument = async (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !docContent.trim()) {
      alert("請填寫標題和內容");
      return;
    }

    setUploadingDoc(true);
    try {
      const res = await fetch(`${API_BASE}/chat/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          title: docTitle.trim(), 
          content: docContent.trim() 
        }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`✅ ${data.message}`);
        setDocTitle("");
        setDocContent("");
        loadKnowledgeStats();
      } else {
        const err = await res.json();
        alert(`❌ 上傳失敗: ${err.detail}`);
      }
    } catch (err) {
      alert("❌ 上傳失敗，請稍後再試");
    } finally {
      setUploadingDoc(false);
    }
  };

  // 未登入時顯示提示
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 RAG 智慧聊天室</h2>
          <p className="text-gray-600 mb-2">結合向量資料庫的 AI 助理</p>
          <p className="text-gray-500 text-sm mb-6">上傳你的知識文件，AI 會根據內容回答問題</p>
          <button
            onClick={() => openAuth("login")}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg hover:opacity-90 transition"
          >
            登入 / 註冊
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 主聊天區域 */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 標題列 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-white">🤖 RAG 智慧聊天室</h2>
                <p className="text-white/70 text-sm">使用 Groq + Pinecone</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowKnowledgePanel(!showKnowledgePanel)}
                  className="lg:hidden text-white/80 hover:text-white text-sm px-3 py-1 rounded hover:bg-white/20 transition"
                >
                  📚 知識庫
                </button>
                <button
                  onClick={clearHistory}
                  className="text-white/80 hover:text-white text-sm px-3 py-1 rounded hover:bg-white/20 transition"
                >
                  清除記錄
                </button>
              </div>
            </div>

            {/* 訊息區域 */}
            <div className="h-[450px] overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-16">
                  <p className="text-5xl mb-4">🧠</p>
                  <p className="text-lg mb-2">RAG 智慧聊天室</p>
                  <p className="text-sm">上傳知識文件後，AI 會根據內容回答你的問題</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl ${
                        msg.role === "user"
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-white text-gray-800 shadow rounded-bl-md"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            📚 參考來源: {msg.sources.join(", ")}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white p-3 rounded-2xl shadow rounded-bl-md">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 輸入區域 */}
            <form onSubmit={sendMessage} className="p-4 border-t bg-white">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="輸入訊息，AI 會根據知識庫回答..."
                  className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  發送
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* 知識庫側邊欄 */}
        <div className={`${showKnowledgePanel ? 'block' : 'hidden'} lg:block`}>
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-teal-600 p-4">
              <h3 className="text-lg font-bold text-white">📚 知識庫管理</h3>
              <p className="text-white/70 text-sm">新增文件讓 AI 學習</p>
            </div>

            {/* 知識庫統計 */}
            {knowledgeStats && (
              <div className="p-4 bg-gray-50 border-b">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="text-green-500">●</span>
                  <span>已儲存 {knowledgeStats.total_vectors} 筆向量資料</span>
                </div>
              </div>
            )}

            {/* 上傳文件表單 */}
            <form onSubmit={uploadDocument} className="p-4">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件標題
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="例：公司簡介"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition text-sm"
                />
              </div>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文件內容
                </label>
                <textarea
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="貼上你想讓 AI 學習的內容..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition text-sm resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={uploadingDoc || !docTitle.trim() || !docContent.trim()}
                className="w-full py-2 bg-gradient-to-r from-green-500 to-teal-600 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
              >
                {uploadingDoc ? "上傳中..." : "📤 新增到知識庫"}
              </button>
            </form>

            {/* 使用說明 */}
            <div className="p-4 bg-gray-50 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">💡 使用說明</h4>
              <ul className="text-xs text-gray-500 space-y-1">
                <li>• 新增文件後，AI 會自動學習內容</li>
                <li>• 詢問相關問題，AI 會參考知識庫回答</li>
                <li>• 回答會標註參考的文件來源</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
