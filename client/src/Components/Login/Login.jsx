// src/Pages/Login/Login.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Login.css";

function normalizeToken(raw) {
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw.slice(7) : raw;
}

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const endpointsInOrder = [
    { role: "admin", path: "/api/admin/admin/login" },
    { role: "coordinator", path: "/api/coordinator/coordinator/login" },
    { role: "technician", path: "/api/technician/login" },
    { role: "customer", path: "/api/customer/login" },
  ];

  async function tryLoginSequence(credentials) {
    for (const ep of endpointsInOrder) {
      try {
        const { data } = await api.post(ep.path, credentials);
        const token = normalizeToken(data?.token);
        const role = (data?.role || data?.user?.role || ep.role || "").toLowerCase();
        if (!token || !role) continue;
        login(token, { role, ...(data?.user || {}) });
        return { ok: true, role };
      } catch (err) {
        const s = err?.response?.status;
        if (s !== 401 && s !== 404) throw err;
      }
    }
    return { ok: false };
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (!email || !password) { setMsg({ type: "error", text: "Enter email and password" }); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setMsg({ type: "error", text: "Invalid email" }); return; }

    setLoading(true);
    try {
      const res = await tryLoginSequence({ email, password });
      if (!res.ok) { setMsg({ type: "error", text: "Invalid credentials or endpoints missing." }); return; }
      setMsg({ type: "success", text: `Logged in as ${res.role}` });

      if (res.role === "admin" || res.role === "super_admin" ) {
        navigate("/AdminDashboard", { replace: true });
       } else if (res.role === "coordinator"){
        navigate("/StaffDashboard", { replace: true });
      } else if (res.role === "technician") {
        navigate("/TechnicianDashboard", { replace: true });
      } else {
        navigate("/UserDashboard/overview", { replace: true });
      }
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Login failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="login-form" onSubmit={handleSubmit}>
        <h3>Login</h3>
        {msg && <div className={`alert ${msg.type}`}>{msg.text}</div>}
        <input type="email" placeholder="Email" autoComplete="username"
               value={email} onChange={(e) => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" autoComplete="current-password"
               value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit" disabled={loading}>{loading ? "Logging in..." : "Login"}</button>
        {onSwitch && (
          <p className="muted">
            Don’t have an account?{" "}
            <button type="button" className="link" onClick={onSwitch}>Create one</button>
          </p>
        )}
      </form>
    </div>
  );
}
