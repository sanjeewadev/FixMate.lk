// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(!!token);

  // Load profile if token exists
  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) { setLoading(false); return; }

      try {
        // 1) Try /api/customer/me
        const { data } = await api.get("/api/customer/me");
        if (!cancelled) setUser(data);
      } catch (err1) {
        // If 401/403 -> real auth failure: clear auth
        const status = err1?.response?.status;
        if (status === 401 || status === 403) {
          if (!cancelled) {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        } else {
          // 2) Fallback to /api/customer/profile if the first URL doesn't exist
          try {
            const { data: data2 } = await api.get("/api/customer/profile");
            if (!cancelled) setUser(data2);
          } catch (err2) {
            // On network/404/etc. — DON'T clear token.
            // Keep whatever `user` you already have (e.g., from login()).
            // Just log and continue.
            // console.warn("Profile fetch failed, keeping token:", err2?.message);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

  const login = (newToken, customer) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    if (customer) setUser(customer); // immediate UI update
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  // Keep multiple tabs in sync (optional)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") {
        const t = e.newValue;
        setToken(t);
        if (!t) setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    isAuth: !!user,
    loading,
    login,
    logout,
  }), [token, user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
