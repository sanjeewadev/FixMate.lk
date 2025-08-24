// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from "react";
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import api from "../lib/api";

const AuthContext = createContext(null);

function normalizeToken(raw) {
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw.slice(7) : raw;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => normalizeToken(localStorage.getItem("token")) || null);
  const [role, setRole]   = useState(() => (localStorage.getItem("role") || "").toLowerCase() || null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(!!token);

  // Keep axios header synced with token
  useEffect(() => {
    const t = normalizeToken(token);
    if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
    else delete api.defaults.headers.common.Authorization;
  }, [token]);

  /* ---------- Stable, idempotent logout ---------- */
  const loggingOutRef = useRef(false);
  const logout = useCallback(() => {
    if (loggingOutRef.current) return; // prevent double logout
    loggingOutRef.current = true;

    try {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      delete api.defaults.headers.common.Authorization;
      setToken(null);
      setRole(null);
      setUser(null);
      setLoading(false);
    } finally {
      // release guard on next tick
      setTimeout(() => { loggingOutRef.current = false; }, 0);
    }
  }, []);

  // Expose latest logout to interceptor via ref (no re-install needed)
  const logoutRef = useRef(logout);
  useEffect(() => { logoutRef.current = logout; }, [logout]);

  // Install a single axios interceptor; use logoutRef inside it
  const interceptorInstalled = useRef(false);
  useEffect(() => {
    if (interceptorInstalled.current) return;
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const s = err?.response?.status;
        if (s === 401) {
          logoutRef.current?.();
          // Hard redirect to login if not already there
          if (window.location.pathname !== "/login") {
            window.location.replace("/login?expired=1");
          }
        }
        return Promise.reject(err);
      }
    );
    interceptorInstalled.current = true;
    return () => api.interceptors.response.eject(id);
  }, []);

  // Load profile for token+role
  useEffect(() => {
    let cancelled = false;

    async function getWithFallback(paths) {
      for (const p of paths) {
        try {
          const res = await api.get(p);
          if (res?.data) return res;
        } catch (e) {
          const status = e?.response?.status;
          if (status === 401) { logoutRef.current?.(); break; }
          if (status !== 404) throw e;
        }
      }
      return null;
    }

    async function loadProfile() {
      if (!token || !role) { setLoading(false); return; }

      const endpoints = {
        customer: "/api/customer/me",
        technician: "/api/technician/me",
        staff: "/api/staff/me",
        admin: "/api/admin/me",
        super_admin: "/api/admin/me",
      };

      try {
        let data = null;
        if (role === "admin" || role === "super_admin") {
          const res = await getWithFallback(["/api/admin/me"]);
          data = res?.data || null;
        } else if (endpoints[role]) {
          const res = await api.get(endpoints[role]);
          data = res.data;
        }
        if (!cancelled) setUser(data ? { ...data, role } : null);
      } catch {
        if (!cancelled) logoutRef.current?.();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [token, role]);

  const login = useCallback((newToken, userObj) => {
    if (!newToken || !userObj?.role) return;
    const normalizedRole = String(userObj.role).toLowerCase();
    const normalizedToken = normalizeToken(newToken);

    localStorage.setItem("token", normalizedToken);
    localStorage.setItem("role", normalizedRole);

    setToken(normalizedToken);
    setRole(normalizedRole);
    setUser({ ...userObj, role: normalizedRole });
    setLoading(false);

    api.defaults.headers.common.Authorization = `Bearer ${normalizedToken}`;
  }, []);

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") {
        const t = normalizeToken(e.newValue);
        setToken(t);
        if (!t) { setUser(null); setRole(null); setLoading(false); }
      }
      if (e.key === "role") setRole(e.newValue?.toLowerCase() || null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const hasRole = (...roles) => roles.map(String).map(r=>r.toLowerCase()).includes(role);
  const isCustomer = role === "customer";
  const isTechnician = role === "technician";
  const isStaff = role === "staff";
  const isAdmin = role === "admin";
  const isSuperAdmin = role === "super_admin";

  const value = useMemo(() => ({
    token, user, role, isAuth: !!user, loading,
    login, logout,
    hasRole, isCustomer, isTechnician, isStaff, isAdmin, isSuperAdmin,
  }), [token, user, role, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/* Guards */
export function RequireAuth({ children, fallback = "/login" }) {
  const { isAuth, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null; // no flash
  if (!isAuth) return <Navigate to={fallback} state={{ from: loc }} replace />;
  return children;
}

export function RequireRole({ roles = [], children, fallback = "/" }) {
  const { isAuth, loading, role } = useAuth();
  const loc = useLocation();
  if (loading) return null;
  if (!isAuth || (roles.length && !roles.map(r=>String(r).toLowerCase()).includes(role))) {
    return <Navigate to={fallback} state={{ from: loc }} replace />;
  }
  return children;
}
