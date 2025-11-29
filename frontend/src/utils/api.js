const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const getToken = () => localStorage.getItem("token") ?? "";
export const setToken = (t) => localStorage.setItem("token", t);
export const clearToken = () => localStorage.removeItem("token");


export async function api(path, { method = "GET", body, token, headers } = {}) {
  const authToken = token ?? getToken(); 

  const res = await fetch(API_BASE + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(headers || {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const authApi = {
  register: (payload) =>
    api("/auth/register", { method: "POST", body: payload }),

  login: async (payload) => {
    const data = await api("/auth/login", { method: "POST", body: payload });
    setToken(data.access_token); 
    return data;
  },

  me: () => api("/auth/me"),

  logout: () => clearToken(),
};
