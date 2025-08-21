// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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

  // Mirror the header for current token
  useEffect(() => {
    const t = normalizeToken(token);
    if (t) api.defaults.headers.common.Authorization = `Bearer ${t}`;
    else delete api.defaults.headers.common.Authorization;
  }, [token]);

  // Logout ONLY on 401 (not on 403)
  const interceptorInstalled = useRef(false);
  useEffect(() => {
    if (interceptorInstalled.current) return;
    const id = api.interceptors.response.use(
      (res) => res,
      (err) => {
        const s = err?.response?.status;
        if (s === 401) {
          // Logout on unauthorized
          logout();
          // Optionally, redirect to login page
          if (window.location.pathname !== "/login") {
            window.location.replace("/login?expired=1");
          }
        }
        return Promise.reject(err);
      }
    );
    interceptorInstalled.current = true;
    return () => api.interceptors.response.eject(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load profile for token+role
  useEffect(() => {
    let cancelled = false;


    // Only try valid endpoints for each role
    async function getWithFallback(paths) {
      for (const p of paths) {
        try {
          const res = await api.get(p);
          if (res?.data) return res;
        } catch (e) {
          const status = e?.response?.status;
          if (status === 401) { logout(); break; }
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
        super_admin: "/api/admin/me", // Only use /api/admin/me for super_admin fallback
      };

      try {
        let data = null;
        if (role === "admin" || role === "super_admin") {
          // Only try /api/admin/me for both admin and super_admin
          const res = await getWithFallback(["/api/admin/me"]);
          data = res?.data || null;
        } else if (endpoints[role]) {
          const res = await api.get(endpoints[role]);
          data = res.data;
        }
        if (!cancelled) setUser(data ? { ...data, role } : null);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [token, role]);

  const login = (newToken, userObj) => {
    if (!newToken || !userObj?.role) return;
    const normalizedRole = String(userObj.role).toLowerCase();
    const normalizedToken = normalizeToken(newToken);

    localStorage.setItem("token", normalizedToken);
    localStorage.setItem("role", normalizedRole);

    setToken(normalizedToken);
    setRole(normalizedRole);
    setUser({ ...userObj, role: normalizedRole });

    api.defaults.headers.common.Authorization = `Bearer ${normalizedToken}`;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
    setUser(null);
    delete api.defaults.headers.common.Authorization;
  };

  // Cross-tab sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") {
        const t = normalizeToken(e.newValue);
        setToken(t);
        if (!t) { setUser(null); setRole(null); }
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
  }), [token, user, role, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// Guards (unchanged)
export function RequireAuth({ children, fallback = "/login" }) {
  const { isAuth, loading } = useAuth();
  const loc = useLocation();
  if (loading) return null;
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
