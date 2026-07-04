import React, { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  LockKeyhole,
  Save,
  UserRound,
  X,
} from "lucide-react";

import api from "../../../lib/api.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./UserProfile.css";

const defaultProfile = "/default-profile.png";

export default function UserProfile() {
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

  const [imagePreview, setImagePreview] = useState(defaultProfile);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [isImageDirty, setIsImageDirty] = useState(false);
  const [msg, setMsg] = useState(null);

  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);

  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startOffX: 0,
    startOffY: 0,
  });

  const imgMeta = useRef({
    w: 0,
    h: 0,
  });

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

    setImagePreview(user.profile_image_url || defaultProfile);
  }, [user]);

  useEffect(() => {
    let cancel = false;

    async function loadProfile() {
      try {
        const { data } = await api.get("/api/customer/me");

        if (cancel) return;

        const profile = data?.customer || data || {};

        setUserData({
          full_name: profile.full_name || "",
          email: profile.email || "",
          phone_number: profile.phone_number || "",
          address: profile.address || "",
          district: profile.district || "",
          profile_image_url: profile.profile_image_url || "",
        });

        setImagePreview(profile.profile_image_url || defaultProfile);
        updateUser?.(profile);
      } catch {
        // Keep auth user fallback.
      }
    }

    loadProfile();

    return () => {
      cancel = true;
    };
  }, [updateUser]);

  const handleUserChange = (event) => {
    const { name, value } = event.target;

    setUserData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleProfileSave = async (event) => {
    event.preventDefault();
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
      const updated = data?.customer || data || payload;

      setUserData((current) => ({
        ...current,
        ...updated,
        email: current.email,
      }));

      setImagePreview(updated.profile_image_url || imagePreview);
      updateUser?.(updated);
      setEditMode(false);

      setMsg({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setMsg(null);

    if (passwords.newPassword !== passwords.confirmNewPassword) {
      setMsg({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    try {
      setPasswordSaving(true);

      await api.patch("/api/customer/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });

      setMsg({
        type: "success",
        text: "Password changed successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Password update failed.",
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  const pickFile = () => fileRef.current?.click();

  const onPick = (event) => {
    const file = event.target.files?.[0];

    if (!file || !file.type?.startsWith("image/")) return;

    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCropOpen(true);

    event.target.value = "";
  };

  const onPreviewLoad = (event) => {
    const img = event.currentTarget;

    imgMeta.current = {
      w: img.naturalWidth,
      h: img.naturalHeight,
    };

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

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }

  const onDragStart = (event) => {
    event.preventDefault();

    const point = event.touches ? event.touches[0] : event;

    dragRef.current = {
      active: true,
      startX: point.clientX,
      startY: point.clientY,
      startOffX: offX,
      startOffY: offY,
    };
  };

  const onDragMove = (event) => {
    if (!dragRef.current.active) return;

    const point = event.touches ? event.touches[0] : event;
    const dx = point.clientX - dragRef.current.startX;
    const dy = point.clientY - dragRef.current.startY;

    const next = clampPan(
      dragRef.current.startOffX + dx,
      dragRef.current.startOffY + dy,
      zoom,
    );

    setOffX(next.x);
    setOffY(next.y);
  };

  const onDragEnd = () => {
    dragRef.current.active = false;
  };

  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropOpen(false);
  };

  const confirmCrop = async () => {
    if (!cropSrc) return;

    const img = new Image();
    img.src = cropSrc;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

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
    setUserData((current) => ({
      ...current,
      profile_image_url: dataUrl,
    }));

    setIsImageDirty(true);
    cleanupCrop();

    setMsg({
      type: "success",
      text: "Photo updated. Save the new image to keep this change.",
    });
  };

  function dataURLtoFile(dataUrl, filename = "avatar.jpg") {
    const arr = dataUrl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);

    let n = bstr.length;
    const u8 = new Uint8Array(n);

    while (n--) {
      u8[n] = bstr.charCodeAt(n);
    }

    return new File([u8], filename, {
      type: mime,
    });
  }

  const saveNewImage = async () => {
    if (!userData.profile_image_url) return;

    setSaving(true);
    setMsg(null);

    try {
      const file = dataURLtoFile(userData.profile_image_url, "avatar.jpg");
      const form = new FormData();

      form.append("profile_image", file);

      const { data } = await api.post("/api/customer/me/avatar", form);
      const updated = data?.customer || data || {};

      setUserData((current) => ({
        ...current,
        profile_image_url:
          updated.profile_image_url || current.profile_image_url,
      }));

      setImagePreview(updated.profile_image_url || imagePreview);
      updateUser?.(updated);
      setIsImageDirty(false);

      setMsg({
        type: "success",
        text: "Photo saved successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to save photo.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="fm-user-profile">
      <div className="fm-user-profile__header">
        <div>
          <span className="fm-user-profile__eyebrow">Account</span>

          <h1>Profile</h1>

          <p>
            Manage your customer profile, contact details, profile photo, and
            password.
          </p>
        </div>
      </div>

      {msg?.text ? (
        <div
          className={`fm-user-profile__notice fm-user-profile__notice--${msg.type}`}>
          {msg.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <div className="fm-user-profile__layout">
        <aside className="fm-user-profile__sideCard">
          <div className="fm-user-profile__avatarBox">
            <img
              src={imagePreview || defaultProfile}
              alt="Profile"
              onError={(event) => {
                event.currentTarget.src = defaultProfile;
              }}
            />

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPick}
            />

            <button
              type="button"
              className="fm-user-profile__photoBtn"
              onClick={pickFile}>
              <Camera size={15} />
              Change photo
            </button>
          </div>

          <h2>{userData.full_name || "Customer"}</h2>
          <p>{userData.email || "customer@email.com"}</p>

          {isImageDirty ? (
            <button
              type="button"
              className="fm-user-profile__btn fm-user-profile__btn--primary"
              onClick={saveNewImage}
              disabled={saving}>
              <Save size={15} />
              {saving ? "Saving" : "Save New Image"}
            </button>
          ) : null}

          <button
            type="button"
            className="fm-user-profile__btn fm-user-profile__btn--outline"
            onClick={() => setEditMode((current) => !current)}>
            {editMode ? "Cancel Edit" : "Edit Profile"}
          </button>
        </aside>

        <main className="fm-user-profile__main">
          <section className="fm-user-profile__card">
            <div className="fm-user-profile__cardHeader">
              <span>
                <UserRound size={17} />
              </span>

              <div>
                <h2>Profile Details</h2>
                <p>Your personal and contact information.</p>
              </div>
            </div>

            {!editMode ? (
              <div className="fm-user-profile__infoGrid">
                <InfoItem label="Full Name" value={userData.full_name} />
                <InfoItem label="Email" value={userData.email} />
                <InfoItem label="Mobile" value={userData.phone_number} />
                <InfoItem label="District" value={userData.district} />
                <InfoItem label="Address" value={userData.address} wide />
              </div>
            ) : (
              <form
                onSubmit={handleProfileSave}
                className="fm-user-profile__form"
                noValidate>
                <label>
                  <span>Full Name</span>
                  <input
                    type="text"
                    name="full_name"
                    value={userData.full_name}
                    onChange={handleUserChange}
                    placeholder="Full Name"
                    required
                  />
                </label>

                <label>
                  <span>Email</span>
                  <input
                    type="email"
                    name="email"
                    value={userData.email}
                    placeholder="Email"
                    readOnly
                  />
                </label>

                <label>
                  <span>Mobile</span>
                  <input
                    type="tel"
                    name="phone_number"
                    value={userData.phone_number}
                    onChange={handleUserChange}
                    placeholder="Mobile number"
                  />
                </label>

                <label>
                  <span>District</span>
                  <input
                    type="text"
                    name="district"
                    value={userData.district}
                    onChange={handleUserChange}
                    placeholder="District"
                  />
                </label>

                <label className="isWide">
                  <span>Address</span>
                  <textarea
                    name="address"
                    rows="3"
                    value={userData.address}
                    onChange={handleUserChange}
                    placeholder="Address"
                  />
                </label>

                <div className="fm-user-profile__actions">
                  <button
                    type="submit"
                    className="fm-user-profile__btn fm-user-profile__btn--primary"
                    disabled={saving}>
                    <Save size={15} />
                    {saving ? "Saving" : "Save Changes"}
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="fm-user-profile__card">
            <div className="fm-user-profile__cardHeader">
              <span>
                <LockKeyhole size={17} />
              </span>

              <div>
                <h2>Change Password</h2>
                <p>Update your account password securely.</p>
              </div>
            </div>

            <form
              onSubmit={handlePasswordSubmit}
              className="fm-user-profile__form"
              noValidate>
              <label>
                <span>Current Password</span>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwords.currentPassword}
                  onChange={handlePasswordChange}
                  placeholder="Current password"
                  required
                />
              </label>

              <label>
                <span>New Password</span>
                <input
                  type="password"
                  name="newPassword"
                  value={passwords.newPassword}
                  onChange={handlePasswordChange}
                  placeholder="New password"
                  required
                />
              </label>

              <label>
                <span>Confirm New Password</span>
                <input
                  type="password"
                  name="confirmNewPassword"
                  value={passwords.confirmNewPassword}
                  onChange={handlePasswordChange}
                  placeholder="Confirm new password"
                  required
                />
              </label>

              <div className="fm-user-profile__actions">
                <button
                  type="submit"
                  className="fm-user-profile__btn fm-user-profile__btn--primary"
                  disabled={passwordSaving}>
                  <LockKeyhole size={15} />
                  {passwordSaving ? "Updating" : "Change Password"}
                </button>
              </div>
            </form>
          </section>
        </main>
      </div>

      {cropOpen ? (
        <div
          className="fm-user-profile__cropOverlay"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true">
          <div
            className="fm-user-profile__cropModal"
            onClick={(event) => event.stopPropagation()}>
            <header>
              <div>
                <span>Profile Photo</span>
                <h2>Adjust your photo</h2>
              </div>

              <button type="button" onClick={cleanupCrop} aria-label="Close">
                <X size={16} />
              </button>
            </header>

            <div
              className={`fm-user-profile__cropViewport ${
                dragRef.current.active ? "isDragging" : ""
              }`}
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}>
              {cropSrc ? (
                <img
                  src={cropSrc}
                  alt="Crop preview"
                  className="fm-user-profile__cropImg"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${
                      base * zoom
                    })`,
                  }}
                />
              ) : null}

              <div className="fm-user-profile__cropCircle" />
            </div>

            <div className="fm-user-profile__cropControls">
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(event) => setZoom(parseFloat(event.target.value))}
              />

              <div className="fm-user-profile__cropActions">
                <button
                  type="button"
                  className="fm-user-profile__btn fm-user-profile__btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="fm-user-profile__btn fm-user-profile__btn--primary"
                  onClick={confirmCrop}>
                  Use Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function InfoItem({ label, value, wide = false }) {
  return (
    <div className={`fm-user-profile__infoItem ${wide ? "isWide" : ""}`}>
      <span>{label}</span>
      <strong>{value || "—"}</strong>
    </div>
  );
}
