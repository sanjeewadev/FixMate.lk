import React, { useState } from "react";
import "./Login.css";
import "../TypingAnimation/ta.css";
import { useAuth } from "../../context/AuthContext.jsx";

function Login({ onSwitch }) {
  const { login } = useAuth(); // <-- use the auth context

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
      const response = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = {};
      try { data = await response.json(); } catch {}

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

      // ✅ Update global auth state immediately (no page reload needed)
      if (data.token) {
        // data.customer is returned by your backend login controller
        login(data.token, data.customer);
      }

      // Keep the modal open so you can see the success message
      setMsg({ type: "success", text: "Login Successful! 😃" });

    } catch (error) {
      setMsg({ type: "error", text: "Network error. Is the server running? 🤔" });
    } finally {
      setLoading(false);
    }
  };

  const onChangeEmail = (e) => {
    setEmail(e.target.value);
    if (msg) setMsg({
      text: (
        <div className="wave-container">
          <p className="wave-text">
            <span>T</span><span>y</span><span>p</span><span>i</span><span>n</span><span>g</span><span>.</span><span>.</span><span>.</span>
          </p>
        </div>
      )
    });
  };

  const onChangePassword = (e) => {
    setPassword(e.target.value);
    if (msg) setMsg({
      text: (
        <div className="wave-container">
          <p className="wave-text">
            <span>T</span><span>y</span><span>p</span><span>i</span><span>n</span><span>g</span><span>.</span><span>.</span><span>.</span>
          </p>
        </div>
      )
    });
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
