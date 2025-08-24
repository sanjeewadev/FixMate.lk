import React, { useEffect, useRef, useState } from "react";
import "./AdminProfile.css";
import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function AdminProfile() {
  const { role, updateUser } = useAuth(); // role: 'admin' | 'super_admin'
  const isSuper = role === "super_admin";

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    profile_image_url: "",
    role: role || "admin",
  });

  const [imagePreview, setImagePreview] = useState("/default-profile.png");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  // ---------- load profile ----------
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data } = await api.get("/api/admin/me");
        if (cancel) return;
        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          profile_image_url: data.profile_image_url || "",
          role: data.role || role || "admin",
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

  // ---------- edit handlers ----------
  const onChange = (e) => {
    const { name, value } = e.target;
    setProfile((p) => ({ ...p, [name]: value }));
  };

  const onSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
      };
      const { data } = await api.patch("/api/admin/me", payload);
      const updated = data?.admin || payload;
      setProfile((p) => ({ ...p, ...updated, email: p.email }));
      updateUser?.(updated);
      setEditMode(false);
      setMsg({ type: "success", text: "Profile updated successfully 😃" });
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Update failed 😣" });
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (e) => {
    e.preventDefault();
    if (isSuper) {
      setMsg({ type: "error", text: "Super Admin password can’t be changed here." });
      return;
    }
    setMsg(null);
    try {
      await api.patch("/api/admin/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "" });
      setMsg({ type: "success", text: "Password changed successfully 😃" });
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Password update failed 😣" });
    }
  };

  // ---------- photo pick + CROP ----------
  const fileRef = useRef(null);
  const pickFile = () => fileRef.current?.click();

  // crop state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const [base, setBase] = useState(1); // base scale to fit viewport
  const imgRef = useRef({ w: 0, h: 0 });
  const dragRef = useRef({ active: false, sx: 0, sy: 0, ox: 0, oy: 0 });

  const VIEW = 260; // square viewport (matches CSS)

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setCropSrc(url);
    setCropOpen(true);
    setZoom(1);
    setOffX(0);
    setOffY(0);
    setBase(1);
  };

  const onPreviewLoad = (ev) => {
    const img = ev.currentTarget;
    const w = img.naturalWidth || 0;
    const h = img.naturalHeight || 0;
    imgRef.current = { w, h };
    if (!w || !h) return;
    // Fit the smaller side to viewport
    const minSide = Math.min(w, h);
    const b = VIEW / minSide;
    setBase(b);
  };

  const clampOffsets = (nx, ny) => {
    const { w, h } = imgRef.current;
    const scaledW = w * base * zoom;
    const scaledH = h * base * zoom;
    const maxX = Math.max(0, (scaledW - VIEW) / 2);
    const maxY = Math.max(0, (scaledH - VIEW) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, nx)),
      y: Math.max(-maxY, Math.min(maxY, ny)),
    };
  };

  const onDragStart = (e) => {
    dragRef.current.active = true;
    const pt = ("touches" in e) ? e.touches[0] : e;
    dragRef.current.sx = pt.clientX;
    dragRef.current.sy = pt.clientY;
    dragRef.current.ox = offX;
    dragRef.current.oy = offY;
  };
  const onDragMove = (e) => {
    if (!dragRef.current.active) return;
    e.preventDefault();
    const pt = ("touches" in e) ? e.touches[0] : e;
    const dx = pt.clientX - dragRef.current.sx;
    const dy = pt.clientY - dragRef.current.sy;
    const { x, y } = clampOffsets(dragRef.current.ox + dx, dragRef.current.oy + dy);
    setOffX(x);
    setOffY(y);
  };
  const onDragEnd = () => {
    dragRef.current.active = false;
  };

  const cleanupCrop = () => {
    setCropOpen(false);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc("");
  };

  const confirmCrop = async () => {
    // Draw to canvas (transparent outside the circle)
    const size = 512; // export size (square)
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    // circle mask
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    // compute draw scale/offset from viewport to canvas coords
    const { w, h } = imgRef.current;
    const scale = (base * zoom) * (size / VIEW); // viewport→canvas
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = cropSrc;

    await new Promise((res) => { img.onload = res; });

    // In viewport, the image is centered (50%,50%) then shifted by offX/offY px.
    // Compute top-left draw position in canvas coords:
    const drawW = w * scale;
    const drawH = h * scale;
    const cx = size / 2 + (offX * (size / VIEW)) - (drawW / 2);
    const cy = size / 2 + (offY * (size / VIEW)) - (drawH / 2);

    ctx.drawImage(img, cx, cy, drawW, drawH);
    ctx.restore();

    canvas.toBlob(async (blob) => {
      if (!blob) return cleanupCrop();

      const form = new FormData();
      // keep the field name the same as before
      form.append("profile_image", blob, "avatar.png");

      try {
        const { data } = await api.post("/api/admin/me/avatar", form);
        const updated = data?.admin || {};
        const url = updated.profile_image_url || imagePreview;

        setProfile((p) => ({ ...p, profile_image_url: url }));
        setImagePreview(url);
        updateUser?.(updated);
        setMsg({ type: "success", text: data?.message || "Photo updated 😃" });
      } catch (err) {
        setMsg({ type: "error", text: err?.response?.data?.message || "Failed to update photo 😓" });
      } finally {
        cleanupCrop();
      }
    }, "image/png", 0.92);
  };

  return (
    <div className="admin-profile">
      {/* Header */}
      <div className="profile-header">
        <img className="profile-img" src={imagePreview} alt="Profile" />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <button type="button" className="change-pic" onClick={pickFile}>
          Change Profile Picture
        </button>

        <h3>{profile.full_name || "Admin"}</h3>
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
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* Password */}
      <div className="password-section">
        <h3>Change Password</h3>
        {isSuper && (
          <div className="note muted tiny" style={{ marginBottom: 8 }}>
            Super Admin password can’t be changed from the app.
          </div>
        )}
        <form className="password-form" onSubmit={onPasswordSubmit} noValidate>
          <input
            type="password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
            placeholder="Current Password"
            required
            disabled={isSuper}
          />
          <input
            type="password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
            placeholder="New Password"
            required
            disabled={isSuper}
          />
          <button type="submit" className="btn-password" disabled={isSuper}>
            {isSuper ? "Not Available for Super Admin" : "Change Password"}
          </button>
        </form>
      </div>

      {/* Crop modal (NEW) */}
      {cropOpen && (
        <div className="crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Adjust your photo</h4>

            <div
              className={`crop-viewport ${dragRef.current.active ? "dragging" : ""}`}
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}
            >
              {cropSrc && (
                <img
                  src={cropSrc}
                  alt="Crop preview"
                  className="crop-img"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base * zoom})`,
                  }}
                />
              )}
              <div className="crop-circle" />
            </div>

            <div className="crop-controls">
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
              <div className="crop-actions">
                <button type="button" className="btn-secondary" onClick={cleanupCrop}>
                  Cancel
                </button>
                <button type="button" className="btn-primary" onClick={confirmCrop}>
                  Use Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
    </div>
  );
}
