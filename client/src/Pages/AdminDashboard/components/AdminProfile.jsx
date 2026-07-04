import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  LockKeyhole,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../lib/api";
import "./AdminProfile.css";

const DEFAULT_PROFILE = "/default-profile.png";
const VIEW = 260;

const formatRole = (role) => {
  if (!role) return "Admin";

  return String(role)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function AdminProfile() {
  const { role, updateUser } = useAuth();
  const isSuper = role === "super_admin";

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    profile_image_url: "",
    role: role || "admin",
  });

  const [imagePreview, setImagePreview] = useState(DEFAULT_PROFILE);
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const fileRef = useRef(null);

  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState("");
  const [zoom, setZoom] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const [base, setBase] = useState(1);

  const imgRef = useRef({
    w: 0,
    h: 0,
  });

  const dragRef = useRef({
    active: false,
    sx: 0,
    sy: 0,
    ox: 0,
    oy: 0,
  });

  useEffect(() => {
    let cancel = false;

    async function loadProfile() {
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

        setImagePreview(data.profile_image_url || DEFAULT_PROFILE);
        updateUser?.(data);
      } catch (error) {
        setMsg({
          type: "error",
          text: error?.response?.data?.message || "Failed to load profile.",
        });
      }
    }

    loadProfile();

    return () => {
      cancel = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc);
      }
    };
  }, [cropSrc]);

  const onChange = (event) => {
    const { name, value } = event.target;

    setProfile((current) => ({
      ...current,
      [name]: value,
    }));

    if (msg?.type === "error") {
      setMsg(null);
    }
  };

  const onSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const payload = {
        full_name: profile.full_name,
        phone_number: profile.phone_number,
      };

      const { data } = await api.patch("/api/admin/me", payload);
      const updated = data?.admin || payload;

      setProfile((current) => ({
        ...current,
        ...updated,
        email: current.email,
      }));

      updateUser?.(updated);
      setEditMode(false);

      setMsg({
        type: "success",
        text: "Profile updated successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Profile update failed.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (event) => {
    event.preventDefault();

    if (isSuper) {
      setMsg({
        type: "error",
        text: "Super Admin password cannot be changed here.",
      });
      return;
    }

    setMsg(null);

    try {
      await api.patch("/api/admin/me/password", {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      setPasswords({
        currentPassword: "",
        newPassword: "",
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
    }
  };

  const pickFile = () => {
    fileRef.current?.click();
  };

  const onPick = (event) => {
    const file = event.target.files?.[0];

    if (!file || !file.type?.startsWith("image/")) {
      return;
    }

    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }

    const url = URL.createObjectURL(file);

    setCropSrc(url);
    setCropOpen(true);
    setZoom(1);
    setOffX(0);
    setOffY(0);
    setBase(1);

    event.target.value = "";
  };

  const onPreviewLoad = (event) => {
    const img = event.currentTarget;
    const w = img.naturalWidth || 0;
    const h = img.naturalHeight || 0;

    imgRef.current = {
      w,
      h,
    };

    if (!w || !h) return;

    const minSide = Math.min(w, h);
    const nextBase = VIEW / minSide;

    setBase(nextBase);
  };

  const clampOffsets = (nextX, nextY) => {
    const { w, h } = imgRef.current;
    const scaledW = w * base * zoom;
    const scaledH = h * base * zoom;

    const maxX = Math.max(0, (scaledW - VIEW) / 2);
    const maxY = Math.max(0, (scaledH - VIEW) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, nextX)),
      y: Math.max(-maxY, Math.min(maxY, nextY)),
    };
  };

  const onDragStart = (event) => {
    event.preventDefault();

    dragRef.current.active = true;

    const point = "touches" in event ? event.touches[0] : event;

    dragRef.current.sx = point.clientX;
    dragRef.current.sy = point.clientY;
    dragRef.current.ox = offX;
    dragRef.current.oy = offY;
  };

  const onDragMove = (event) => {
    if (!dragRef.current.active) return;

    event.preventDefault();

    const point = "touches" in event ? event.touches[0] : event;
    const dx = point.clientX - dragRef.current.sx;
    const dy = point.clientY - dragRef.current.sy;

    const next = clampOffsets(dragRef.current.ox + dx, dragRef.current.oy + dy);

    setOffX(next.x);
    setOffY(next.y);
  };

  const onDragEnd = () => {
    dragRef.current.active = false;
  };

  const cleanupCrop = () => {
    setCropOpen(false);

    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }

    setCropSrc("");
  };

  const confirmCrop = async () => {
    const size = 512;
    const canvas = document.createElement("canvas");

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const { w, h } = imgRef.current;
    const scale = base * zoom * (size / VIEW);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = cropSrc;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const drawW = w * scale;
    const drawH = h * scale;
    const cx = size / 2 + offX * (size / VIEW) - drawW / 2;
    const cy = size / 2 + offY * (size / VIEW) - drawH / 2;

    ctx.drawImage(img, cx, cy, drawW, drawH);
    ctx.restore();

    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          cleanupCrop();
          return;
        }

        const form = new FormData();
        form.append("profile_image", blob, "avatar.png");

        try {
          const { data } = await api.post("/api/admin/me/avatar", form);
          const updated = data?.admin || {};
          const url = updated.profile_image_url || imagePreview;

          setProfile((current) => ({
            ...current,
            profile_image_url: url,
          }));

          setImagePreview(url);
          updateUser?.(updated);

          setMsg({
            type: "success",
            text: data?.message || "Photo updated successfully.",
          });
        } catch (error) {
          setMsg({
            type: "error",
            text: error?.response?.data?.message || "Failed to update photo.",
          });
        } finally {
          cleanupCrop();
        }
      },
      "image/png",
      0.92,
    );
  };

  return (
    <section className="fm-admin-profile">
      <div className="fm-admin-profile__header">
        <div>
          <span className="fm-admin-profile__eyebrow">Account Settings</span>

          <h1>Admin Profile</h1>

          <p>
            Manage your administrator profile, contact details, profile photo,
            and account password.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-profile__btn fm-admin-profile__btn--outline"
          onClick={() => setEditMode((value) => !value)}>
          <Pencil size={16} />
          {editMode ? "Cancel Edit" : "Edit Profile"}
        </button>
      </div>

      {msg?.text ? (
        <div
          className={`fm-admin-profile__notice fm-admin-profile__notice--${
            msg.type || "info"
          }`}
          role="status"
          aria-live="polite">
          {msg.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <section className="fm-admin-profile__card">
        <div className="fm-admin-profile__identity">
          <div className="fm-admin-profile__photoWrap">
            <img
              className="fm-admin-profile__photo"
              src={imagePreview}
              alt="Profile"
              onError={(event) => {
                event.currentTarget.src = DEFAULT_PROFILE;
              }}
            />

            <button
              type="button"
              className="fm-admin-profile__photoButton"
              onClick={pickFile}
              aria-label="Change profile picture">
              <Camera size={16} />
            </button>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPick}
            />
          </div>

          <div className="fm-admin-profile__identityText">
            <h2>{profile.full_name || "Admin"}</h2>
            <p>{profile.email || "email@example.com"}</p>

            <span className="fm-admin-profile__role">
              <ShieldCheck size={14} />
              {formatRole(profile.role)}
            </span>
          </div>

          <button
            type="button"
            className="fm-admin-profile__btn fm-admin-profile__btn--secondary"
            onClick={pickFile}>
            <Upload size={16} />
            Change Photo
          </button>
        </div>
      </section>

      {!editMode ? (
        <section className="fm-admin-profile__grid">
          <article className="fm-admin-profile__infoCard">
            <span>
              <UserRound size={16} />
            </span>

            <div>
              <p>Full Name</p>
              <strong>{profile.full_name || "-"}</strong>
            </div>
          </article>

          <article className="fm-admin-profile__infoCard">
            <span>
              <Mail size={16} />
            </span>

            <div>
              <p>Email</p>
              <strong>{profile.email || "-"}</strong>
            </div>
          </article>

          <article className="fm-admin-profile__infoCard">
            <span>
              <Phone size={16} />
            </span>

            <div>
              <p>Mobile</p>
              <strong>{profile.phone_number || "-"}</strong>
            </div>
          </article>

          <article className="fm-admin-profile__infoCard">
            <span>
              <ShieldCheck size={16} />
            </span>

            <div>
              <p>Role</p>
              <strong>{formatRole(profile.role)}</strong>
            </div>
          </article>
        </section>
      ) : (
        <form
          className="fm-admin-profile__card fm-admin-profile__form"
          onSubmit={onSave}
          noValidate>
          <div className="fm-admin-profile__cardHeader">
            <div>
              <span>Profile details</span>
              <h2>Edit Profile</h2>
            </div>
          </div>

          <div className="fm-admin-profile__formGrid">
            <div className="fm-admin-profile__field">
              <label htmlFor="fm-admin-profile-name">Full Name</label>
              <input
                id="fm-admin-profile-name"
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={onChange}
                placeholder="Full Name"
                required
              />
            </div>

            <div className="fm-admin-profile__field">
              <label htmlFor="fm-admin-profile-email">Email</label>
              <input
                id="fm-admin-profile-email"
                type="email"
                name="email"
                value={profile.email}
                placeholder="Email"
                readOnly
              />
            </div>

            <div className="fm-admin-profile__field">
              <label htmlFor="fm-admin-profile-phone">Mobile</label>
              <input
                id="fm-admin-profile-phone"
                type="tel"
                name="phone_number"
                value={profile.phone_number}
                onChange={onChange}
                placeholder="Mobile (+94XXXXXXXXX)"
              />
            </div>
          </div>

          <div className="fm-admin-profile__actions">
            <button
              type="submit"
              className="fm-admin-profile__btn fm-admin-profile__btn--primary"
              disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      <section className="fm-admin-profile__card">
        <div className="fm-admin-profile__cardHeader">
          <div>
            <span>Security</span>
            <h2>Change Password</h2>
          </div>
        </div>

        {isSuper ? (
          <div className="fm-admin-profile__securityNote">
            <LockKeyhole size={16} />
            <span>Super Admin password cannot be changed from the app.</span>
          </div>
        ) : null}

        <form
          className="fm-admin-profile__passwordForm"
          onSubmit={onPasswordSubmit}
          noValidate>
          <div className="fm-admin-profile__field">
            <label htmlFor="fm-admin-current-password">Current Password</label>
            <input
              id="fm-admin-current-password"
              type="password"
              name="currentPassword"
              value={passwords.currentPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  currentPassword: event.target.value,
                }))
              }
              placeholder="Current Password"
              required
              disabled={isSuper}
            />
          </div>

          <div className="fm-admin-profile__field">
            <label htmlFor="fm-admin-new-password">New Password</label>
            <input
              id="fm-admin-new-password"
              type="password"
              name="newPassword"
              value={passwords.newPassword}
              onChange={(event) =>
                setPasswords((current) => ({
                  ...current,
                  newPassword: event.target.value,
                }))
              }
              placeholder="New Password"
              required
              disabled={isSuper}
            />
          </div>

          <div className="fm-admin-profile__actions">
            <button
              type="submit"
              className="fm-admin-profile__btn fm-admin-profile__btn--primary"
              disabled={isSuper}>
              <LockKeyhole size={16} />
              {isSuper ? "Not Available for Super Admin" : "Change Password"}
            </button>
          </div>
        </form>
      </section>

      {cropOpen ? (
        <div
          className="fm-admin-profile-crop"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true"
          aria-label="Adjust profile photo">
          <div
            className="fm-admin-profile-crop__modal"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-admin-profile-crop__header">
              <div>
                <span>Profile image</span>
                <h2>Adjust Photo</h2>
              </div>

              <button
                type="button"
                className="fm-admin-profile__iconAction"
                onClick={cleanupCrop}
                aria-label="Close crop modal">
                <X size={16} />
              </button>
            </div>

            <div
              className={`fm-admin-profile-crop__viewport ${
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
                  className="fm-admin-profile-crop__image"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${
                      base * zoom
                    })`,
                  }}
                />
              ) : null}

              <div className="fm-admin-profile-crop__circle" />
            </div>

            <div className="fm-admin-profile-crop__controls">
              <label>
                <span>Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="3"
                  step="0.01"
                  value={zoom}
                  onChange={(event) => setZoom(parseFloat(event.target.value))}
                />
              </label>

              <div className="fm-admin-profile-crop__actions">
                <button
                  type="button"
                  className="fm-admin-profile__btn fm-admin-profile__btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="fm-admin-profile__btn fm-admin-profile__btn--primary"
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
