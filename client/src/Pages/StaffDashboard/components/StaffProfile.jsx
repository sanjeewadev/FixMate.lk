import React, { useEffect, useRef, useState } from "react";
import "./StaffProfile.css";
import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function StaffProfile() {
  const { role, updateUser } = useAuth(); // role should be "coordinator"

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    district: "",
    profile_image_url: "",
    role: role || "coordinator",
  });

  const [imagePreview, setImagePreview] = useState("/default-profile.png");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // -------- Load my profile --------
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        // GET /api/coordinator/me  -> returns coordinator object
        const { data } = await api.get("/api/coordinator/coordinator/me");
        if (cancel) return;
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          district: data.district || "",
          profile_image_url: data.profile_image_url || "",
          role: "coordinator",
        });
        setImagePreview(data.profile_image_url || "/default-profile.png");
        updateUser?.(data);
      } catch (e) {
        setMsg({ type: "error", text: e?.response?.data?.message || "Failed to load profile" });
      }
    })();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // -------- Handlers --------
  const onChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      // PATCH /api/coordinator/me  (full_name?, phone_number?, address?, district?)
      const payload = {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        address: profile.address,
        district: profile.district,
      };
      const { data } = await api.patch("/api/coordinator/coordinator/me", payload);
      // controller returns { message, coordinator }
      const updated = data?.coordinator || payload;
      setProfile((p) => ({ ...p, ...updated, email: p.email })); // email is read‑only
      updateUser?.(updated);
      setEditMode(false);
      setMsg({ type: "success", text: data?.message || "Profile updated successfully 😃" });
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Update failed 😣" });
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);
    try {
      // PATCH /api/coordinator/me/password
      await api.patch("/api/coordinator/coordinator/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "" });
      setMsg({ type: "success", text: "Password changed successfully 😃" });
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Password update failed 😣" });
    }
  };

  // -------- Photo upload --------
  const fileRef = useRef(null);
  const pickFile = () => fileRef.current?.click();

  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type?.startsWith("image/")) return;
    const preview = URL.createObjectURL(f);
    setImagePreview(preview);

    try {
      // POST /api/coordinator/me/avatar (form-data key: profile_image)
      const form = new FormData();
      form.append("profile_image", f);
      const { data } = await api.post("/api/coordinator/coordinator/me/avatar", form);
      // returns { message, coordinator }
      const updated = data?.coordinator || {};
      setProfile((p) => ({ ...p, profile_image_url: updated.profile_image_url || p.profile_image_url }));
      setImagePreview(updated.profile_image_url || preview);
      updateUser?.(updated);
      setMsg({ type: "success", text: data?.message || "Photo updated 😃" });
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to update photo 😓" });
    } finally {
      setTimeout(() => URL.revokeObjectURL(preview), 2000);
    }
  };

  return (
    <div className="staff-profile">
      {/* Header */}
      <div className="profile-header">
        <img className="profile-img" src={imagePreview} alt="Profile" />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <button type="button" className="change-pic" onClick={pickFile}>
          Change Profile Picture
        </button>

        <h3>{profile.full_name || "Coordinator"}</h3>
        <p className="profile-email">{profile.email || "email@example.com"}</p>

        <div className="profile-msg-slot" aria-live="polite" aria-atomic="true">
          {msg?.text && <div className={`msg ${msg.type || "info"}`}>{msg.text}</div>}
        </div>
      </div>

      {/* Toggle */}
      <button className="edit-toggle-btn" onClick={() => setEditMode((v) => !v)}>
        {editMode ? "Cancel Edit" : "Edit Profile"}
      </button>

      {/* VIEW MODE */}
      {!editMode && (
        <div className="info-grid">
          <div className="info-card">
            <div className="label">Full Name</div>
            <div className="value">{profile.full_name || "-"}</div>
          </div>
          <div className="info-card">
            <div className="label">Email</div>
            <div className="value">{profile.email || "-"}</div>
          </div>
          <div className="info-card">
            <div className="label">Mobile</div>
            <div className="value">{profile.phone_number || "-"}</div>
          </div>
          <div className="info-card">
            <div className="label">Address</div>
            <div className="value">{profile.address || "-"}</div>
          </div>
          <div className="info-card">
            <div className="label">District</div>
            <div className="value">{profile.district || "-"}</div>
          </div>
          <div className="info-card">
            <div className="label">Role</div>
            <div className="value">{profile.role}</div>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {editMode && (
        <form className="profile-form" onSubmit={onSave} noValidate>
          <input
            type="text"
            name="full_name"
            value={profile.full_name}
            onChange={onChange}
            placeholder="Full Name"
            required
          />
          <input type="email" name="email" value={profile.email} placeholder="Email" readOnly />
          <input
            type="tel"
            name="phone_number"
            value={profile.phone_number}
            onChange={onChange}
            placeholder="Mobile (+94XXXXXXXXX)"
          />
          <input
            type="text"
            name="address"
            value={profile.address}
            onChange={onChange}
            placeholder="Address"
          />
          <input
            type="text"
            name="district"
            value={profile.district}
            onChange={onChange}
            placeholder="District"
          />

          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* Password */}
      <div className="password-section">
        <h3>Change Password</h3>
        <form className="password-form" onSubmit={onPasswordSubmit} noValidate>
          <input
            type="password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Current Password"
            required
          />
          <input
            type="password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
            placeholder="New Password"
            required
          />
          <button type="submit" className="btn-password">
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
