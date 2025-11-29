import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE = "http://localhost:8001";

export default function ChatPage() {
  const { user, firebaseUser, openAuth } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
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
          { role: "ai", content: item.ai_response },
        ]);
        setMessages(formatted);
      }
    } catch (err) {
      console.error("載入歷史失敗:", err);
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
        setMessages((prev) => [...prev, { role: "ai", content: data.ai_response }]);
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

  // 未登入時顯示提示
  if (!user) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 AI 聊天室</h2>
          <p className="text-gray-600 mb-6">請先登入以使用聊天功能</p>
          <button
            onClick={() => openAuth("login")}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition"
          >
            登入 / 註冊
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* 標題列 */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">🤖 AI 聊天室</h2>
          <button
            onClick={clearHistory}
            className="text-white/80 hover:text-white text-sm px-3 py-1 rounded hover:bg-white/20 transition"
          >
            清除記錄
          </button>
        </div>

        {/* 訊息區域 */}
        <div className="h-[500px] overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-20">
              <p className="text-4xl mb-4">👋</p>
              <p>開始和 AI 聊天吧！</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={idx}
                className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-blue-500 text-white rounded-br-md"
                      : "bg-white text-gray-800 shadow rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
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
              placeholder="輸入訊息..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-full focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
            >
              發送
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}