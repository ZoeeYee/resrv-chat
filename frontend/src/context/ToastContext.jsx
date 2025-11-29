import { createContext, useContext, useState } from "react";
import React from "react";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div
            className={`fixed top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2
                        px-6 py-3 rounded-lg shadow-lg text-[#333] text-center z-[2000]
                        ${toast.type === "success" ? "bg-[#f0ddbf]" : "bg-red-500"}`}
        >
            {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
