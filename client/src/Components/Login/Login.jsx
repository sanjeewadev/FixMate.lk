import React, { useState } from "react";
import "./Login.css";
import "../TypingAnimation/ta.css"; // Assuming you have a typing animation CSS file

function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);   // { type: "success"|"error"|"info", text: string }
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
    setHasSubmitted(true);   // hide welcome, show real messages
    setMsg(null);

  // simple client-side validation first
  if (!email || !password) {
    setMsg({ type: "error", text: "Please fill in both email and password 😪" });
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    setMsg({ type: "error", text: "Please enter a valid email address 😣" });
    return;
  }
  // if (password.length < 6) {
  //   setMsg({ type: "error", text: "Password must be at least 6 characters 😐" });
  //   return;
  // }

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
        setMsg({ type: "error", text: data.message || "Something went wrong. Please try again 😣" });
      }
      return;
    }

    // success
    if (data.token) localStorage.setItem("token", data.token);
    setMsg({ type: "success", text: "Login Successful! 😃" });

    // optional: after a short delay you could close a modal or navigate
    // setTimeout(() => {...}, 800);

  } catch (error) {
    setMsg({ type: "error", text: "Network error. Is the server running? 🤔" });
  } finally {
    setLoading(false);
  }
};

  // optional: clear message when typing again
  const onChangeEmail = (e) => { setEmail(e.target.value); if (msg) setMsg({text: <div className="wave-container">
    <p className="wave-text">
        <span>T</span><span>y</span><span>p</span><span>i</span><span>n</span><span>g</span><span>.</span><span>.</span><span>.</span>
    </p>
  </div>}); };
  const onChangePassword = (e) => { setPassword(e.target.value); if (msg) setMsg({text: <div className="wave-container">
    <p className="wave-text">
        <span>T</span><span>y</span><span>p</span><span>i</span><span>n</span><span>g</span><span>.</span><span>.</span><span>.</span>
    </p>
  </div>}); };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>

      <input
        type="email"
        name="email"
        placeholder="Email"
        value={email}
        onChange={onChangeEmail}
        required
      /><br />

      <input
        type="password"
        name="password"
        placeholder="Password"
        value={password}
        onChange={onChangePassword}
        required
      /><br />

      <button type="submit" disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      {/* MESSAGE SLOT — reserves space and decides what to show */}
      <div className="msg-slot" role="status" aria-live="polite" aria-atomic="true">
        {hasSubmitted ? (
          // After first submit: show real messages (success/error)
          msg?.text && (
            <div className={`msg ${msg.type} show`}>
              {msg.text}
            </div>
          )
        ) : (
          // Before submit: show a soft welcome message
          <div className="msg info pre show">
            Hi, again!👋
          </div>
        )}
      </div>
      <p className="register">
        Don't have an account?{" "}
        <span
          style={{ color: "blue", cursor: "pointer" }}
          onClick={onSwitch}
        >
          Register
        </span>
      </p>
    </form>
  );
}

export default Login;