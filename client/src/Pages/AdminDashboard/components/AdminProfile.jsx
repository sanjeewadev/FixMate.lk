import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/api";
import "./AdminProfile.css";

export default function AdminProfile() {
  const [me, setMe] = useState(null);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    profile_image_url: "",
  });

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirmNewPassword: "" });

  const fileRef = useRef(null);
  const [preview, setPreview] = useState("");

  // load my profile
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/admin/me");
        setMe(data);
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          profile_image_url: data.profile_image_url || "",
        });
        setPreview(data.profile_image_url || "/default-profile.png");
      } catch (e) {
        setMsg(e?.response?.data?.message || "Failed to load profile");
      }
    })();
  }, []);

  const handleChange = (e) => setProfile((p) => ({ ...p, [e.target.name]: e.target.value }));

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true); setMsg("");
    try {
      const { data } = await api.patch("/api/admin/me", {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
      });
      setMe(data.admin || data);
      setMsg("Profile updated ✅");
    } catch (e1) {
      setMsg(e1?.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMsg("");
    if (pwd.newPassword !== pwd.confirmNewPassword) {
      setMsg("Passwords do not match"); return;
    }
    try {
      await api.patch("/api/admin/me/password", {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setMsg("Password changed ✅");
    } catch (e1) {
      setMsg(e1?.response?.data?.message || "Password change failed");
    }
  };

  // avatar upload (multipart) -> field name profile_image
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    (async () => {
      try {
        const fd = new FormData();
        fd.append("profile_image", f);
        const { data } = await api.post("/api/admin/me/avatar", fd);
        setProfile((p) => ({ ...p, profile_image_url: data?.admin?.profile_image_url || p.profile_image_url }));
        setMsg("Profile image updated ✅");
      } catch (e1) {
        setMsg(e1?.response?.data?.message || "Avatar upload failed");
      }
    })();
  };

  if (!me) return <div className="admin-profile"><p>Loading…</p></div>;

  return (
    <div className="admin-profile">
      {msg && <p className="msg">{msg}</p>}

      <div className="header">
        <img src={preview || "/default-profile.png"} alt="avatar" className="avatar large" />
        <input type="file" ref={fileRef} hidden accept="image/*" onChange={onPick} />
        <button className="btn" onClick={() => fileRef.current?.click()}>Change Photo</button>
      </div>

      <form className="profile-form" onSubmit={saveProfile}>
        <input type="text" name="full_name" value={profile.full_name} onChange={handleChange} placeholder="Full Name" required />
        <input type="email" name="email" value={profile.email} readOnly />
        <input type="text" name="phone_number" value={profile.phone_number} onChange={handleChange} placeholder="Phone Number" />
        <button type="submit" className="btn" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
      </form>

      <h3>Change Password</h3>
      <form className="password-form" onSubmit={changePassword}>
        <input type="password" placeholder="Current Password" value={pwd.currentPassword} onChange={(e)=>setPwd({...pwd,currentPassword:e.target.value})} required />
        <input type="password" placeholder="New Password" value={pwd.newPassword} onChange={(e)=>setPwd({...pwd,newPassword:e.target.value})} required />
        <input type="password" placeholder="Confirm New Password" value={pwd.confirmNewPassword} onChange={(e)=>setPwd({...pwd,confirmNewPassword:e.target.value})} required />
        <button className="btn">Update Password</button>
      </form>
    </div>
  );
}
