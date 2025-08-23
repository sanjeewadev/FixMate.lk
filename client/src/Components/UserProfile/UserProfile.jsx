import React, { useEffect, useRef, useState } from "react";
import "./UserProfile.css";
import "../TypingAnimation/ta.css";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext.jsx";

function UserProfile() {
  const { user, updateUser } = useAuth();

  const [userData, setUserData] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    district: "",
    profile_image_url: "",
  });

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);

  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const name = (userData.full_name || "").split(" ")[0] || "there";
    setMsg({
      type: "info",
      text: (
        <span className="msg-hello">
          Hey <strong>{name}</strong> - hope your day's going great! ✨
        </span>
      ),
    });
  }, [userData.full_name]);

  useEffect(() => {
    if (!user) return;
    setUserData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      address: user.address || "",
      district: user.district || "",
      profile_image_url: user.profile_image_url || "",
    });
    setImagePreview(user.profile_image_url || "/default-profile.png");
  }, [user]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const { data } = await api.get("/api/customer/me");
        if (cancel) return;
        setUserData({
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          district: data.district || "",
          profile_image_url: data.profile_image_url || "",
        });
        setImagePreview(data.profile_image_url || "/default-profile.png");
        updateUser?.(data);
      } catch {}
    })();
    return () => {
      cancel = true;
    };
  }, [updateUser]);

  const handleUserChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const payload = {
        full_name: userData.full_name,
        phone_number: userData.phone_number,
        address: userData.address,
        district: userData.district,
        profile_image_url: userData.profile_image_url,
      };
      const { data } = await api.patch("/api/customer/me", payload);
      const updated = data.customer || payload;

      setUserData((prev) => ({ ...prev, ...updated, email: prev.email }));
      setImagePreview(updated.profile_image_url || imagePreview);
      updateUser?.(updated);
      setEditMode(false);

      setMsg({ type: "success", text: " Profile updated successfully 😃" });
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to update profile 😓",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setMsg({ type: "error", text: "New passwords do not match 😣" });
      return;
    }
    try {
      await api.patch("/api/customer/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswords({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
      setMsg({ type: "success", text: " Password changed successfully 😃" });
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || " Password update failed 😣",
      });
    }
  };

// c
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);

  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOffX: 0, startOffY: 0 });
  const imgMeta = useRef({ w: 0, h: 0 });

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

  function clampPan(x, y, z) {
    const size = 320;
    const scaledW = imgMeta.current.w * base * z;
    const scaledH = imgMeta.current.h * base * z;
    const maxX = Math.max(0, (scaledW - size) / 2);
    const maxY = Math.max(0, (scaledH - size) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }

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
  const onDragEnd = () => {
    dragRef.current.active = false;
  };

  const [isImageDirty, setIsImageDirty] = useState(false);

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

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9); // resizer
    setImagePreview(dataUrl);
    setUserData((prev) => ({ ...prev, profile_image_url: dataUrl }));
    setIsImageDirty(true);

    setImagePreview(dataUrl);
    setUserData((prev) => ({ ...prev, profile_image_url: dataUrl }));
    cleanupCrop();

    setMsg({ type: "success", text: "Photo updated (remember to Save Changes 😊)." });
  };

  function dataURLtoFile(dataUrl, filename = "avatar.jpg") {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8 = new Uint8Array(n);
    while (n--) u8[n] = bstr.charCodeAt(n);
    return new File([u8], filename, { type: mime });
  }

  const saveNewImage = async () => {
    if (!userData.profile_image_url) return;
    setSaving(true);
    setMsg(null);
    try {
      const file = dataURLtoFile(userData.profile_image_url, "avatar.jpg");
      const form = new FormData();
      form.append("profile_image", file);

      const { data } = await api.post("/api/customer/me/avatar", form, {
      });

      const updated = data?.customer || {};
      setUserData((p) => ({
        ...p,
        profile_image_url: updated.profile_image_url || p.profile_image_url,
      }));
      setImagePreview(updated.profile_image_url || imagePreview);
      updateUser?.(updated);
      setIsImageDirty(false);
      setMsg({ type: "success", text: " Photo updated 😃" });
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Failed to save photo 😓",
      });
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
    <div className="user-profile">
      {/* Header */}
      <div className="profile-header">
        <img
          src={imagePreview || "/default-profile.png"}
          alt="Profile"
          className="profile-img"
        />

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <button type="button" className="change-pic" onClick={pickFile}>
          Change Profile Picture
        </button>

        <h3>{userData.full_name || "User Name"}</h3>
        <p className="profile-email">{userData.email || "email@example.com"}</p>

        {/* message slot */}
        <div className="profile-msg-slot" aria-live="polite" aria-atomic="true">
          {msg?.text && <div className={`msg ${msg.type} show`}>{msg.text}</div>}
        </div>
      </div>

      {/* Toggle Edit */}
      <button className="edit-toggle-btn" onClick={() => setEditMode((v) => !v)}>
        {editMode ? "Cancel Edit" : "Edit Profile"}
      </button>

      {/* VIEW MODE */}
      {!editMode && (
        <div className="user-info-view">
          <div className="info-item">
            <div className="info-label">Full Name</div>
            <div className="info-value">{userData.full_name || "-"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Email</div>
            <div className="info-value">{userData.email || "-"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Mobile</div>
            <div className="info-value">{userData.phone_number || "-"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Address</div>
            <div className="info-value">{userData.address || "-"}</div>
          </div>
          <div className="info-item">
            <div className="info-label">District</div>
            <div className="info-value">{userData.district || "-"}</div>
          </div>

          {/* Only show the button if a new image is staged */}
          {isImageDirty && (
            <div className="image-save-row">
              <button
                type="button"
                className="btn-save-btn"
                onClick={saveNewImage}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save New Image 🤝"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* EDIT MODE */}
      {editMode && (
        <form onSubmit={handleProfileSave} className="profile-form" noValidate>
          <input
            type="text"
            name="full_name"
            value={userData.full_name}
            onChange={handleUserChange}
            placeholder="Full Name"
            required
          />
          <input type="email" name="email" value={userData.email} placeholder="Email" readOnly />
          <input
            type="tel"
            name="phone_number"
            value={userData.phone_number}
            onChange={handleUserChange}
            placeholder="Mobile (+94XXXXXXXXX)"
          />
          <input
            type="text"
            name="address"
            value={userData.address}
            onChange={handleUserChange}
            placeholder="Address"
          />
          <input
            type="text"
            name="district"
            value={userData.district}
            onChange={handleUserChange}
            placeholder="District"
          />
          <button type="submit" className="btn-save" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      )}

      {/* Change Password */}
      <div className="password-section">
        <h3>Change Password</h3>
        <form onSubmit={handlePasswordSubmit} className="password-form" noValidate>
          <input
            type="password"
            name="currentPassword"
            value={passwords.currentPassword}
            onChange={handlePasswordChange}
            placeholder="Current Password"
            required
          />
          <input
            type="password"
            name="newPassword"
            value={passwords.newPassword}
            onChange={handlePasswordChange}
            placeholder="New Password"
            required
          />
          <input
            type="password"
            name="confirmNewPassword"
            value={passwords.confirmNewPassword}
            onChange={handlePasswordChange}
            placeholder="Confirm New Password"
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
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base *
                      zoom})`,
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
    </div>
  );
}

export default UserProfile;
