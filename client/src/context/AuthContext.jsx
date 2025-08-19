// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [role, setRole]   = useState(() => localStorage.getItem("role") || null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(!!token);

  // Ensure Axios always has the token header
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  // Load profile
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      if (!token || !role) { setLoading(false); return; }

      const endpoints = {
        customer: "/api/customer/me",
        technician: "/api/technician/me",
        admin: "/api/admin/me",
      };

      const endpoint = endpoints[role];
      if (!endpoint) { setLoading(false); return; }

      try {
        const { data } = await api.get(endpoint);
        if (!cancelled) {
          setUser({ ...data, role });
        }
      } catch (e) {
        if (!cancelled) {
          // Token invalid or expired → force logout
          logout();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [token, role]);

  const login = (newToken, userObj) => {
    if (!newToken || !userObj?.role) return;

    localStorage.setItem("token", newToken);
    localStorage.setItem("role", userObj.role);

    setToken(newToken);
    setRole(userObj.role);
    setUser(userObj);

    api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
    setUser(null);
    delete api.defaults.headers.common.Authorization;
  };

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") {
        const t = e.newValue;
        setToken(t);
        if (!t) { setUser(null); setRole(null); }
      }
      if (e.key === "role") setRole(e.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo(() => ({
    token,
    user,
    role,
    isAuth: !!user,
    loading,
    login,
    logout,
  }), [token, user, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
