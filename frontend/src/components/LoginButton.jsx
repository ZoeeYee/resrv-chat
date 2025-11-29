import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginButton() {
  const { user, openAuth, logout } = useAuth();

  if (!user) {
    return (
      <button
        className="bg-[#e4b326] px-3 py-1 rounded-md text-sm text-white hover:bg-[#b22a2a] transition"
        onClick={() => openAuth("login")}
      >
        登入
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">Hi, {user.name}</span>
      <button
        className="px-3 py-1 rounded-md text-sm border border-white hover:bg-gray-100"
        onClick={logout}
      >
        登出
      </button>
    </div>
  );
}
