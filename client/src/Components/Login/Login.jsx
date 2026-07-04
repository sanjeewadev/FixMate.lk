import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext.jsx";

import "./Login.css";

function normalizeToken(raw) {
  if (!raw) return null;
  return raw.startsWith("Bearer ") ? raw.slice(7) : raw;
}

export default function Login({ onSwitch, onSuccess }) {
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
    for (const endpoint of endpointsInOrder) {
      try {
        const { data } = await api.post(endpoint.path, credentials);

        const token = normalizeToken(data?.token);
        const role = (
          data?.role ||
          data?.user?.role ||
          endpoint.role ||
          ""
        ).toLowerCase();

        if (!token || !role) continue;

        login(token, {
          role,
          ...(data?.user || {}),
        });

        return { ok: true, role };
      } catch (error) {
        const status = error?.response?.status;

        if (status !== 401 && status !== 404) {
          throw error;
        }
      }
    }

    return { ok: false };
  }

  const getRedirectPath = (role) => {
    if (role === "admin" || role === "super_admin") {
      return "/AdminDashboard";
    }

    if (role === "coordinator") {
      return "/StaffDashboard";
    }

    if (role === "technician") {
      return "/TechnicianDashboard";
    }

    return "/UserDashboard/overview";
  };

  const validate = () => {
    if (!email.trim()) return "Please enter your email address.";
    if (!password.trim()) return "Please enter your password.";

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      return "Please enter a valid email address.";
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const validationMessage = validate();

    if (validationMessage) {
      setMsg({
        type: "error",
        text: validationMessage,
      });
      return;
    }

    try {
      setLoading(true);

      const result = await tryLoginSequence({
        email: email.trim(),
        password,
      });

      if (!result.ok) {
        setMsg({
          type: "error",
          text: "Invalid email or password.",
        });
        return;
      }

      const redirectPath = getRedirectPath(result.role);

      onSuccess?.();
      navigate(redirectPath, { replace: true });
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message || "Login failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fm-login">
      <aside className="fm-login__sidePanel">
        <span className="fm-login__brandLabel">FixMate.lk</span>

        <h2>Welcome back.</h2>

        <p>
          Sign in to manage bookings, technician jobs, customer requests and
          platform operations.
        </p>

        <div className="fm-login__benefits">
          <span>Customer dashboard</span>
          <span>Technician job access</span>
          <span>Admin and coordinator tools</span>
        </div>
      </aside>

      <form className="fm-login__form" onSubmit={handleSubmit} noValidate>
        <div className="fm-login__header">
          <span className="fm-login__eyebrow">Secure access</span>

          <h3>Login to your account</h3>

          <p>Use your registered email and password to continue.</p>
        </div>

        {msg?.text ? (
          <div
            className={`fm-login__notice fm-login__notice--${msg.type}`}
            aria-live="polite">
            {msg.text}
          </div>
        ) : null}

        <div className="fm-login__field">
          <label htmlFor="fm-login-email">Email address</label>

          <input
            id="fm-login-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
        </div>

        <div className="fm-login__field">
          <label htmlFor="fm-login-password">Password</label>

          <input
            id="fm-login-password"
            type="password"
            placeholder="Enter your password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
        </div>

        <button className="fm-login__submit" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        {onSwitch ? (
          <p className="fm-login__switchText">
            Don’t have an account?{" "}
            <button
              type="button"
              className="fm-login__switchButton"
              onClick={onSwitch}
              disabled={loading}>
              Create one
            </button>
          </p>
        ) : null}
      </form>
    </div>
  );
}
