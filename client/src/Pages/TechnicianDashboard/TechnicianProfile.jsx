import React, { useEffect, useRef, useState } from "react";
import "./technician-profile.css";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext.jsx";

export default function TechnicianProfile() {
  const { user, updateUser } = useAuth?.() || {};

  const [data, setData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    district: "",
    specialization: "",
    experience_years: "",
    profile_image_url: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [imagePreview, setImagePreview] = useState("/default-profile.png");
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isImageDirty, setIsImageDirty] = useState(false);

  const [msg, setMsg] = useState(null); // { type: 'success'|'error'|'info', text: string }

  // Prefill from auth (if available)
  useEffect(() => {
    if (!user) return;
    const p = {
      full_name: user.full_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      address: user.address || "",
      district: user.district || "",
      specialization: user.specialization || "",
      experience_years: user.experience_years || "",
      profile_image_url: user.profile_image_url || "",
    };
    setData(p);
    setImagePreview(p.profile_image_url || "/default-profile.png");
  }, [user]);

  // Load fresh from server
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data: r } = await api.get("/api/technician/me");
        if (cancel) return;
        const p = {
          full_name: r.full_name || "",
          email: r.email || "",
          phone_number: r.phone_number || "",
          address: r.address || "",
          district: r.district || "",
          specialization: r.specialization || "",
          experience_years: r.experience_years || "",
          profile_image_url: r.profile_image_url || "",
        };
        setData(p);
        setImagePreview(p.profile_image_url || "/default-profile.png");
        updateUser?.(r);
      } catch {}
    })();
    return () => { cancel = true; };
  }, [updateUser]);

  /* ---------- Edit fields ---------- */
  const onField = (e) => setData(s => ({ ...s, [e.target.name]: e.target.value }));
  const onPwd    = (e) => setPasswords(s => ({ ...s, [e.target.name]: e.target.value }));

  /* ---------- Save profile (non-image) ---------- */
  const saveProfile = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        full_name: data.full_name,
        phone_number: data.phone_number,
        address: data.address,
        district: data.district,
        specialization: data.specialization,
        experience_years: data.experience_years,
      };
      const { data: res } = await api.patch("/api/technician/me", payload);
      const updated = res || payload;
      setData(prev => ({ ...prev, ...updated, email: prev.email }));
      updateUser?.(updated);
      setEditMode(false);
      setMsg({ type: "success", text: "Profile updated ✅" });
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to update profile" });
    } finally {
      setSaving(false);
    }
  };

  /* ---------- Change password ---------- */
  const submitPassword = async (e) => {
    e.preventDefault();
    setMsg(null);
    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setMsg({ type: "error", text: "New passwords do not match" });
      return;
    }
    try {
      await api.patch("/api/technician/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setMsg({ type: "success", text: "Password changed ✅" });
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Password update failed" });
    }
  };

  /* ---------- Avatar: pick, crop, upload ---------- */
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const imgMeta = useRef({ w: 0, h: 0 });
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOffX: 0, startOffY: 0 });

  const pickFile = () => fileRef.current?.click();
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setCropSrc(url);
    setCropOpen(true);
  };

  const onPreviewLoad = (e) => {
    const img = e.currentTarget;
    imgMeta.current = { w: img.naturalWidth, h: img.naturalHeight };
    const circle = 320;
    const fit = Math.max(circle / img.naturalWidth, circle / img.naturalHeight);
    setBase(fit);
    setZoom(1);
    setOffX(0);
    setOffY(0);
  };

  const clampPan = (x, y, z) => {
    const size = 320;
    const scaledW = imgMeta.current.w * base * z;
    const scaledH = imgMeta.current.h * base * z;
    const maxX = Math.max(0, (scaledW - size) / 2);
    const maxY = Math.max(0, (scaledH - size) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };

  const onDragStart = (e) => {
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    dragRef.current = {
      active: true,
      startX: pt.clientX,
      startY: pt.clientY,
      startOffX: offX,
      startOffY: offY,
    };
  };
  const onDragMove = (e) => {
    if (!dragRef.current.active) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - dragRef.current.startX;
    const dy = pt.clientY - dragRef.current.startY;
    const next = clampPan(dragRef.current.startOffX + dx, dragRef.current.startOffY + dy, zoom);
    setOffX(next.x);
    setOffY(next.y);
  };
  const onDragEnd = () => { dragRef.current.active = false; };

  const dataURLtoFile = (dataUrl, filename = "avatar.jpg") => {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new File([u8], filename, { type: mime });
  };

  const confirmCrop = async () => {
    if (!cropSrc) return;
    const img = new Image();
    img.src = cropSrc;
    await new Promise((res) => (img.onload = res));

    const size = 320;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const scale = base * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (size - drawW) / 2 + offX;
    const dy = (size - drawH) / 2 + offY;

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setImagePreview(dataUrl);
    setData((p) => ({ ...p, profile_image_url: dataUrl }));
    setIsImageDirty(true);
    cleanupCrop();
    setMsg({ type: "success", text: "Photo staged. Click “Save Photo” to upload." });
  };

  const saveNewImage = async () => {
    if (!data.profile_image_url) return;
    setSaving(true);
    setMsg(null);
    try {
      const file = dataURLtoFile(data.profile_image_url, "avatar.jpg");
      const form = new FormData();
      form.append("profile_image", file); // 👈 field name used by your backend
      const { data: res } = await api.post("/api/technician/me/avatar", form);
      const updated = res?.customer || {}; // some backends return {customer: {...}}
      const newUrl = updated.profile_image_url || imagePreview;
      setImagePreview(newUrl);
      setData((p) => ({ ...p, profile_image_url: newUrl }));
      updateUser?.(updated);
      setIsImageDirty(false);
      setMsg({ type: "success", text: "Photo updated ✅" });
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to save photo" });
    } finally {
      setSaving(false);
    }
  };

  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropOpen(false);
  };

  return (
    <div className="tp-profile">
      {/* Header */}
      <div className="tp-header">
        <img src={imagePreview} alt="Profile" className="tp-img" />
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <button type="button" className="tp-btn-secondary" onClick={pickFile}>
          Change Profile Picture
        </button>

        <h3 className="tp-name">{data.full_name || "Technician"}</h3>
        <p className="tp-email">{data.email || ""}</p>

        {msg?.text && <div className={`tp-msg ${msg.type}`}>{msg.text}</div>}

        {isImageDirty && (
          <div className="tp-image-save-row">
            <button className="tp-btn-primary" onClick={saveNewImage} disabled={saving}>
              {saving ? "Saving..." : "Save Photo"}
            </button>
          </div>
        )}
      </div>

      {/* Toggle Edit */}
      <button className="tp-toggle" onClick={() => setEditMode((v) => !v)}>
        {editMode ? "Cancel Edit" : "Edit Profile"}
      </button>

      {/* View mode */}
      {!editMode && (
        <div className="tp-view">
          <div className="tp-item"><div className="tp-label">Full Name</div><div className="tp-value">{data.full_name || "-"}</div></div>
          <div className="tp-item"><div className="tp-label">Email</div><div className="tp-value">{data.email || "-"}</div></div>
          <div className="tp-item"><div className="tp-label">Mobile</div><div className="tp-value">{data.phone_number || "-"}</div></div>
          <div className="tp-item"><div className="tp-label">Address</div><div className="tp-value">{data.address || "-"}</div></div>
          <div className="tp-item"><div className="tp-label">District</div><div className="tp-value">{data.district || "-"}</div></div>
          <div className="tp-item"><div className="tp-label">Specialization</div><div className="tp-value">{data.specialization || "-"}</div></div>
          <div className="tp-item"><div className="tp-label">Experience (years)</div><div className="tp-value">{data.experience_years || "-"}</div></div>
        </div>
      )}

      {/* Edit mode */}
      {editMode && (
        <form className="tp-form" onSubmit={saveProfile} noValidate>
          <input name="full_name" value={data.full_name} onChange={onField} placeholder="Full Name" />
          <input name="email" value={data.email} placeholder="Email" readOnly />
          <input name="phone_number" value={data.phone_number} onChange={onField} placeholder="Mobile (+94XXXXXXXXX)" />
          <input name="address" value={data.address} onChange={onField} placeholder="Address" />
          <input name="district" value={data.district} onChange={onField} placeholder="District" />
          <input name="specialization" value={data.specialization} onChange={onField} placeholder="Specialization" />
          <input type="number" name="experience_years" value={data.experience_years} onChange={onField} placeholder="Years of Experience" />
          <button type="submit" className="tp-btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* Password */}
      <div className="tp-password">
        <h3>Change Password</h3>
        <form className="tp-password-form" onSubmit={submitPassword} noValidate>
          <input type="password" name="currentPassword" value={passwords.currentPassword} onChange={onPwd} placeholder="Current Password" required />
          <input type="password" name="newPassword" value={passwords.newPassword} onChange={onPwd} placeholder="New Password" required />
          <input type="password" name="confirmNewPassword" value={passwords.confirmNewPassword} onChange={onPwd} placeholder="Confirm New Password" required />
          <button className="tp-btn-secondary">Change Password</button>
        </form>
      </div>

      {/* Crop modal */}
      {cropOpen && (
        <div className="tp-crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="tp-crop-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Adjust your photo</h4>
            <div
              className={`tp-crop-viewport ${dragRef.current.active ? "dragging" : ""}`}
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
                  className="tp-crop-img"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base * zoom})`,
                  }}
                />
              )}
              <div className="tp-crop-circle" />
            </div>

            <div className="tp-crop-controls">
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e) => setZoom(parseFloat(e.target.value))} />
              <div className="tp-crop-actions">
                <button type="button" className="tp-btn-secondary" onClick={cleanupCrop}>Cancel</button>
                <button type="button" className="tp-btn-primary" onClick={confirmCrop}>Use Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
