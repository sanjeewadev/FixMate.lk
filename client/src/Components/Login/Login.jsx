import React, { useState } from "react";
import "./Login.css";
import "../TypingAnimation/ta.css";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

function Login({ onSwitch }) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setMsg(null);

    if (!email || !password) {
      setMsg({ type: "error", text: "Please fill in both email and password 😪" });
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setMsg({ type: "error", text: "Please enter a valid email address 😣" });
      return;
    }

    try {
      setLoading(true);

      // 1) Try CUSTOMER login first (keeps your original order)
      let response = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try { data = await response.json(); } catch {}

      // 2) If customer fails, try TECHNICIAN login (friend's logic)
      if (!response.ok) {
        response = await fetch("/api/technician/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        try { data = await response.json(); } catch {}
      }

      // 3) Handle errors (same style as before)
      if (!response.ok) {
        if (response.status === 401) {
          setMsg({ type: "error", text: data.message || "Email or password is incorrect 😣" });
        } else if (response.status === 400) {
          setMsg({ type: "error", text: data.message || "Please check your inputs 😣" });
        } else {
          setMsg({ type: "error", text: data.message || "Something went wrong 😣" });
        }
        return;
      }

      // 4) Success: set auth state immediately
      if (data.token) {
        // Role detection (friend’s approach preserved)
        const userObj = data.customer
          ? { ...data.customer, role: "customer" }
          : data.technician
          ? { ...data.technician, role: "technician" }
          : null;

        login(data.token, userObj);

        // ✅ Technician behavior (friend’s): redirect to Technician Dashboard
        if (userObj?.role === "technician") {
          navigate("/TechnicianDashboard");
        }

        // ✅ Customer behavior (your original): DO NOT redirect.
        // Keep modal open, show success; user can close and continue manually.
        setMsg({ type: "success", text: "Login Successful! 😃" });
      }
    } catch (error) {
      setMsg({ type: "error", text: "Network error. Is the server running? 🤔" });
    } finally {
      setLoading(false);
    }
  };

  const onChangeEmail = (e) => {
    setEmail(e.target.value);
    if (msg) {
      setMsg({
        text: (
          <div className="wave-container">
            <p className="wave-text">
              <span>T</span><span>y</span><span>p</span><span>i</span>
              <span>n</span><span>g</span><span>.</span><span>.</span><span>.</span>
            </p>
          </div>
        ),
      });
    }
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
    if (msg) {
      setMsg({
        text: (
          <div className="wave-container">
            <p className="wave-text">
              <span>T</span><span>y</span><span>p</span><span>i</span>
              <span>n</span><span>g</span><span>.</span><span>.</span><span>.</span>
            </p>
          </div>
        ),
      });
    }
  };

  return (
    <>
      <h2 className="login-title">Login</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={onChangeEmail}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={onChangePassword}
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="msg-slot">
          {hasSubmitted ? (
            msg?.text && <div className={`msg ${msg.type} show`}>{msg.text}</div>
          ) : (
            <div className="msg info pre show">Hi, again!👋</div>
          )}
        </div>
      </form>

      <p className="register">
        Don’t have an account?{" "}
        <span className="link" onClick={onSwitch}>Register</span>
      </p>
    </>
  );
}

export default Login;
