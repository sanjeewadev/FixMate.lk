// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("token") || null);
  const [role, setRole]   = useState(() => localStorage.getItem("role") || null);
  const [user, setUser]   = useState(null);
  const [loading, setLoading] = useState(!!token);

  // Ensure axios sends the token on page load/refresh
  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  // Load profile for current token
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!token) { setLoading(false); return; }

      const tryFetch = async (endpoint, roleName) => {
        try {
          const { data } = await api.get(endpoint);
          if (!cancelled) {
            setUser({ ...data, role: roleName });
            setRole(roleName);
            localStorage.setItem("role", roleName);
          }
          return true;
        } catch (e) {
          return false;
        }
      };

      setLoading(true);

      // If we already know the role, check only that endpoint.
      if (role === "technician") {
        const ok = await tryFetch("/api/technician/me", "technician");
        if (!ok && !cancelled) setLoading(false);
        if (!ok && !cancelled) { /* keep token, maybe stale role; next render can re-login */ }
        return;
      }
      if (role === "customer") {
        const ok = await tryFetch("/api/customer/me", "customer");
        if (!ok && !cancelled) setLoading(false);
        return;
      }
      if (role === "admin") {
        const ok = await tryFetch("/api/admin/me", "admin");
        if (!ok && !cancelled) setLoading(false);
        return;
      }

      // Unknown role → probe in order WITHOUT clearing token on single 401s
      const probers = [
        () => tryFetch("/api/technician/me", "technician"),
        () => tryFetch("/api/customer/me", "customer"),
        () => tryFetch("/api/admin/me", "admin"),
      ];

      let authed = false;
      for (const p of probers) {
        // stop if one succeeded
        // eslint-disable-next-line no-await-in-loop
        if (await p()) { authed = true; break; }
      }

      if (!cancelled) {
        setLoading(false);
        if (!authed) {
          // only now we know the token is invalid
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          delete api.defaults.headers.common.Authorization;
          setToken(null);
          setRole(null);
          setUser(null);
        }
      }
    }

    loadProfile();
    return () => { cancelled = true; };
  }, [token]); // role is set inside after success

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

  // Keep multiple tabs in sync
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
