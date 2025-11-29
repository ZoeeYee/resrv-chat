import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from "firebase/auth";
import { auth } from "../config/firebase";
import { authApi, setToken, clearToken } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState("login"); 
  const [loading, setLoading] = useState(true);

  const openAuth = useCallback((mode = "login") => {
    setAuthMode(mode);
    setAuthOpen(true);
  }, []);
  
  const closeAuth = useCallback(() => setAuthOpen(false), []);

  // 監聽 Firebase 認證狀態變化
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        try {
          // 取得 Firebase ID Token
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          
          // 呼叫後端 API 取得使用者資訊（後端會驗證 Firebase token）
          try {
            const profile = await authApi.me();
            setUser(profile);
          } catch (error) {
            // 如果後端驗證失敗，可能需要同步使用者資訊到後端
            console.error("Failed to get user profile from backend:", error);
            // 使用 Firebase 使用者資訊作為後備
            setUser({
              id: firebaseUser.uid,
              name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
              email: firebaseUser.email
            });
          }
        } catch (error) {
          console.error("Failed to get ID token:", error);
          setUser(null);
        }
      } else {
        clearToken();
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const actions = useMemo(() => ({
    async register({ name, email, password }) {
      try {
        // 使用 Firebase Auth 註冊
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // 更新使用者顯示名稱
        if (name) {
          await updateProfile(userCredential.user, { displayName: name });
        }
        
        // 取得 ID Token 並傳送到後端同步使用者資訊
        const idToken = await userCredential.user.getIdToken();
        setToken(idToken);
        
        // 可選：同步使用者資訊到後端資料庫
        try {
          await authApi.register({ name, email, firebase_uid: userCredential.user.uid });
        } catch (error) {
          console.warn("Failed to sync user to backend:", error);
          // 繼續執行，因為 Firebase 註冊已成功
        }
        
        return userCredential.user;
      } catch (error) {
        throw new Error(error.message || "註冊失敗");
      }
    },
    async login({ email, password }) {
      try {
        // 使用 Firebase Auth 登入
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        // 取得 ID Token
        const idToken = await userCredential.user.getIdToken();
        setToken(idToken);
        
        // 從後端取得使用者資訊
        try {
          const profile = await authApi.me();
          setUser(profile);
          return profile;
        } catch (error) {
          // 如果後端沒有使用者資訊，使用 Firebase 使用者資訊
          const profile = {
            id: userCredential.user.uid,
            name: userCredential.user.displayName || userCredential.user.email?.split("@")[0] || "User",
            email: userCredential.user.email
          };
          setUser(profile);
          return profile;
        }
      } catch (error) {
        throw new Error(error.message || "登入失敗");
      }
    },
    async logout() {
      try {
        await signOut(auth);
        clearToken();
        setUser(null);
      } catch (error) {
        console.error("Logout error:", error);
        clearToken();
        setUser(null);
      }
    },
  }), []);

  const value = { 
    user, 
    firebaseUser,
    setUser, 
    loading, 
    authOpen, 
    authMode, 
    openAuth, 
    closeAuth, 
    ...actions 
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}