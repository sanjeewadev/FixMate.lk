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
        if (!cancelled) setUser({ ...data, role: "customer" });
      } catch (err1) {
        const status = err1?.response?.status;
        if (status === 401 || status === 403) {
          if (!cancelled) {
            localStorage.removeItem("token");
            setToken(null);
            setUser(null);
          }
        } else {
          try {
            // 2) Try /api/customer/profile
            const { data: data2 } = await api.get("/api/customer/profile");
            if (!cancelled) setUser({ ...data2, role: "customer" });
          } catch (err2) {
            try {
              // 3) Try /api/technician/me
              const { data: data3 } = await api.get("/api/technician/me");
              if (!cancelled) setUser({ ...data3, role: "technician" });
            } catch (err3) {
              try {
                // 4) (optional) Try /api/admin/me later if you add admin
                const { data: data4 } = await api.get("/api/admin/me");
                if (!cancelled) setUser({ ...data4, role: "admin" });
              } catch (err4) {
                // no role found, keep token but no user info
              }
            }
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [token]);

  const login = (newToken, userObj) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
    if (userObj) {
      // role will be attached at login() if backend provides it
      setUser(userObj);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    delete api.defaults.headers.common.Authorization;
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
    role: user?.role || null,   // 👈 easy access to role
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
