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

  // -------- Form handlers --------
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
        address: profile.address,
        district: profile.district,
      };
      const { data } = await api.patch("/api/coordinator/coordinator/me", payload);
      const updated = data?.coordinator || payload;
      setProfile((p) => ({ ...p, ...updated, email: p.email })); // email read-only here
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

  // -------- Photo & Cropper --------
  const fileRef = useRef(null);
  const pickFile = () => fileRef.current?.click();

  // Crop state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(""); // data URL chosen
  const [zoom, setZoom] = useState(1);        // 1..3
  const [base, setBase] = useState(1);        // base scale to cover circle
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0 });
  const imgRef = useRef(null);
  const vpRef = useRef(null);

  // choose file -> open cropper
  const onPick = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type?.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result);
      setZoom(1);
      setOffX(0); setOffY(0);
      setCropOpen(true);
    };
    reader.readAsDataURL(f);
  };

  // compute base scale to ensure the circle area is covered
  const onPreviewLoad = (e) => {
    const img = e.currentTarget;
    imgRef.current = img;
    const vp = vpRef.current;
    if (!vp) return;
    const vw = vp.clientWidth;
    const vh = vp.clientHeight;
    const circleD = Math.min(vw, vh) * 0.8; // our circle is 80% of the viewport
    const scaleToCover = Math.max(circleD / img.naturalWidth, circleD / img.naturalHeight);
    setBase(scaleToCover);
  };

  const onDragStart = (e) => {
    e.preventDefault();
    const p = dragRef.current;
    p.active = true;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    p.startX = clientX;
    p.startY = clientY;
    p.lastX = offX;
    p.lastY = offY;
  };

  const onDragMove = (e) => {
    const p = dragRef.current;
    if (!p.active) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setOffX(p.lastX + (clientX - p.startX));
    setOffY(p.lastY + (clientY - p.startY));
  };

  const onDragEnd = () => { dragRef.current.active = false; };
  const cleanupCrop = () => { setCropOpen(false); setCropSrc(""); };

  // export circular PNG and upload
  const confirmCrop = async () => {
    const vp = vpRef.current;
    const img = imgRef.current;
    if (!vp || !img) return;

    const OUT = 512; // exported size
    const cx = OUT / 2, cy = OUT / 2;

    const canvas = document.createElement("canvas");
    canvas.width = OUT; canvas.height = OUT;
    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, OUT / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = base * zoom;
    const circleCss = Math.min(vp.clientWidth, vp.clientHeight) * 0.8;
    const pxPerCanvas = OUT / circleCss;

    const drawW = img.naturalWidth * scale * pxPerCanvas;
    const drawH = img.naturalHeight * scale * pxPerCanvas;

    const dx = cx - (drawW / 2) + offX * pxPerCanvas;
    const dy = cy - (drawH / 2) + offY * pxPerCanvas;

    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight, dx, dy, drawW, drawH);
    ctx.restore();

    // optimistic preview
    const dataUrl = canvas.toDataURL("image/png");
    setImagePreview(dataUrl);
    setCropOpen(false);

    // upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const form = new FormData();
      form.append("profile_image", new File([blob], "avatar.png", { type: "image/png" }));
      try {
        const { data } = await api.post("/api/coordinator/coordinator/me/avatar", form);
        const updated = data?.coordinator || {};
        setProfile((p) => ({ ...p, profile_image_url: updated.profile_image_url || p.profile_image_url }));
        setImagePreview(updated.profile_image_url || dataUrl);
        updateUser?.(updated);
        setMsg({ type: "success", text: data?.message || "Photo updated 😃" });
      } catch (err) {
        setMsg({ type: "error", text: err?.response?.data?.message || "Failed to update photo 😓" });
      }
    }, "image/png", 0.95);
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

      {/* Crop modal */}
      {cropOpen && (
        <div className="crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Adjust your photo</h4>

            <div
              ref={vpRef}
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
                className="crop-range"
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
    </div>
  );
}
