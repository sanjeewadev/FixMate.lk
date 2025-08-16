import React, { useEffect, useState } from "react";
import "./UserRegister.css";

function UserRegister({ onSwitch }) {
  const [form, setForm] = useState({
    fullName: "", email: "", password: "", confirmPassword: "",
    phone: "", address: "", district: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [msg, setMsg] = useState(null);            // { type, text }
  const [loading, setLoading] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [hint, setHint] = useState("Welcome to FixMate 🙂");

  const update = (name, value) => {
    setForm((s) => ({ ...s, [name]: value }));
    if (hasSubmitted) { setMsg(null); setHint("Typing…"); }
  };

  const onImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    if (hasSubmitted) { setMsg(null); setHint("Selecting image…"); }
  };

  // Optional: revoke object URL when file changes/unmounts
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const validate = () => {
    if (!form.fullName || !form.email || !form.password || !form.address || !form.district) {
      return "Please fill in all required fields 😐";
    }
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return "Please enter a valid email address 😣";
    if (form.password.length < 6) return "Password must be at least 6 characters 😣";
    if (form.password !== form.confirmPassword) return "Passwords do not match 😣";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasSubmitted(true);
    setMsg(null);

    const v = validate();
    if (v) { setMsg({ type: "error", text: v }); return; }

    try {
      setLoading(true);
      const fd = new FormData();
      fd.append("full_name", form.fullName);
      fd.append("email", form.email);
      fd.append("password", form.password);
      if (form.phone) fd.append("phone_number", form.phone);
      fd.append("address", form.address);
      fd.append("district", form.district);
      if (imageFile) fd.append("profileImage", imageFile);

      const res = await fetch("/api/customer/register", { method: "POST", body: fd });
      let data = {}; try { data = await res.json(); } catch {}

      if (!res.ok) {
        const text = res.status === 400
          ? (data.message || "Please check your inputs 😐")
          : (data.message || "Registration failed. Please try again 😣");
        setMsg({ type: "error", text });
        return;
      }

      // ✅ show success then switch
      setMsg({ type: "success", text: "Registered successfully! You can log in now." });
      setTimeout(() => onSwitch?.(), 900);

    } catch {
      setMsg({ type: "error", text: "Network error. Is the server running?" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="userregister-form">
        <h2 className="register-text">Register</h2>

        <input type="text" name="fullName" placeholder="Full Name*" value={form.fullName}
               onChange={(e) => update("fullName", e.target.value)} required />
        <input type="email" name="email" placeholder="Email*" value={form.email}
               onChange={(e) => update("email", e.target.value)} required />
        <input type="password" name="password" placeholder="Password (min 6)*" value={form.password}
               onChange={(e) => update("password", e.target.value)} required />
        <input type="password" name="confirmPassword" placeholder="Confirm Password*" value={form.confirmPassword}
               onChange={(e) => update("confirmPassword", e.target.value)} required />
        <input type="tel" name="phone" placeholder="Phone (optional)" value={form.phone}
               onChange={(e) => update("phone", e.target.value)} />
        <input type="text" name="address" placeholder="Address*" value={form.address}
               onChange={(e) => update("address", e.target.value)} required />
        <input type="text" name="district" placeholder="District*" value={form.district}
               onChange={(e) => update("district", e.target.value)} required />

        <input type="file" accept="image/*" onChange={onImageChange} />
        {imagePreview && <img className="profile-preview" src={imagePreview} alt="Profile Preview" />}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Register"}
        </button>

        {/* Message slot (top, like Login) */}
        <div className="msg-slot" role="status" aria-live="polite" aria-atomic="true">
          {hasSubmitted ? (
            msg?.text ? (
              <div className={`msg ${msg.type} show`}>{msg.text}</div>
            ) : (
              <div className="msg info pre show">{hint}</div>
            )
          ) : (
            <div className="msg info pre show">Welcome to FixMate 🙂</div>
          )}
        </div>

        <p className="userregister-link">
          Already have an account?{" "}
          <span style={{ color: "#0070f3", cursor: "pointer", fontWeight: 500 }} onClick={onSwitch}>
            Login
          </span>
        </p>
      </div>
    </form>
  );
}

export default UserRegister;
