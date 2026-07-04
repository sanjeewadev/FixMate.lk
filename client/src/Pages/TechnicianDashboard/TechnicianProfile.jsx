import React, { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  LockKeyhole,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext.jsx";
import "./TechnicianProfile.css";

const DEFAULT_PROFILE = "/default-profile.png";

const formatSpecialization = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object"
          ? item.name || item.code || item.category || item.slug
          : String(item),
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object" && value) {
    return value.name || value.code || value.category || value.slug || "";
  }

  return String(value || "");
};

export default function TechnicianProfile() {
  const { user, updateUser } = useAuth();

  const [profile, setProfile] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    district: "",
    specialization: "",
    experience_years: "",
    profile_image_url: "",
    role: "technician",
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
  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);

  const dragRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });

  const imgRef = useRef(null);
  const vpRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    setProfile((current) => ({
      ...current,
      full_name: user.full_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      address: user.address || "",
      district: user.district || "",
      specialization: formatSpecialization(user.specialization),
      experience_years: user.experience_years ?? "",
      profile_image_url: user.profile_image_url || "",
    }));

    setImagePreview(user.profile_image_url || DEFAULT_PROFILE);
  }, [user]);

  useEffect(() => {
    let cancel = false;

    async function loadProfile() {
      try {
        const { data } = await api.get("/api/technician/me");

        if (cancel) return;

        setProfile({
          full_name: data.full_name || "",
          email: data.email || "",
          phone_number: data.phone_number || "",
          address: data.address || "",
          district: data.district || "",
          specialization: formatSpecialization(data.specialization),
          experience_years: data.experience_years ?? "",
          profile_image_url: data.profile_image_url || "",
          role: "technician",
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
  }, [updateUser]);

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
        address: profile.address,
        district: profile.district,
        specialization: profile.specialization,
        experience_years: profile.experience_years,
      };

      const { data } = await api.patch("/api/technician/me", payload);
      const updated = data?.technician || data?.user || data || payload;

      setProfile((current) => ({
        ...current,
        ...updated,
        email: current.email,
        specialization: formatSpecialization(
          updated.specialization ?? current.specialization,
        ),
      }));

      updateUser?.(updated);
      setEditMode(false);

      setMsg({
        type: "success",
        text: data?.message || "Profile updated successfully.",
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
    setMsg(null);

    try {
      await api.patch("/api/technician/me/password", {
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

    const reader = new FileReader();

    reader.onload = () => {
      setCropSrc(reader.result);
      setZoom(1);
      setBase(1);
      setOffX(0);
      setOffY(0);
      setCropOpen(true);
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const onPreviewLoad = (event) => {
    const img = event.currentTarget;
    const viewport = vpRef.current;

    imgRef.current = img;

    if (!viewport) return;

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    const circleDiameter = Math.min(viewportWidth, viewportHeight) * 0.8;

    const scaleToCover = Math.max(
      circleDiameter / img.naturalWidth,
      circleDiameter / img.naturalHeight,
    );

    setBase(scaleToCover);
  };

  const onDragStart = (event) => {
    event.preventDefault();

    const point = "touches" in event ? event.touches[0] : event;

    dragRef.current = {
      active: true,
      startX: point.clientX,
      startY: point.clientY,
      lastX: offX,
      lastY: offY,
    };
  };

  const onDragMove = (event) => {
    if (!dragRef.current.active) return;

    const point = "touches" in event ? event.touches[0] : event;

    setOffX(dragRef.current.lastX + (point.clientX - dragRef.current.startX));
    setOffY(dragRef.current.lastY + (point.clientY - dragRef.current.startY));
  };

  const onDragEnd = () => {
    dragRef.current.active = false;
  };

  const cleanupCrop = () => {
    setCropOpen(false);
    setCropSrc("");
  };

  const confirmCrop = async () => {
    const viewport = vpRef.current;
    const img = imgRef.current;

    if (!viewport || !img) return;

    const outputSize = 512;
    const center = outputSize / 2;

    const canvas = document.createElement("canvas");
    canvas.width = outputSize;
    canvas.height = outputSize;

    const ctx = canvas.getContext("2d");

    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, outputSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    const scale = base * zoom;
    const circleCss =
      Math.min(viewport.clientWidth, viewport.clientHeight) * 0.8;
    const canvasRatio = outputSize / circleCss;

    const drawW = img.naturalWidth * scale * canvasRatio;
    const drawH = img.naturalHeight * scale * canvasRatio;

    const dx = center - drawW / 2 + offX * canvasRatio;
    const dy = center - drawH / 2 + offY * canvasRatio;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(
      img,
      0,
      0,
      img.naturalWidth,
      img.naturalHeight,
      dx,
      dy,
      drawW,
      drawH,
    );
    ctx.restore();

    const dataUrl = canvas.toDataURL("image/png");

    setImagePreview(dataUrl);
    setCropOpen(false);

    canvas.toBlob(
      async (blob) => {
        if (!blob) return;

        const form = new FormData();
        form.append(
          "profile_image",
          new File([blob], "avatar.png", {
            type: "image/png",
          }),
        );

        try {
          const { data } = await api.post("/api/technician/me/avatar", form);
          const updated = data?.technician || data?.user || {};
          const newUrl = updated.profile_image_url || dataUrl;

          setProfile((current) => ({
            ...current,
            profile_image_url: newUrl,
          }));

          setImagePreview(newUrl);
          updateUser?.(updated);

          setMsg({
            type: "success",
            text: data?.message || "Photo updated successfully.",
          });
        } catch (error) {
          setMsg({
            type: "error",
            text:
              error?.response?.data?.message ||
              "Failed to update profile photo.",
          });
        } finally {
          setCropSrc("");
        }
      },
      "image/png",
      0.95,
    );
  };

  const niceSpec = formatSpecialization(profile.specialization);

  return (
    <section className="fm-tech-profile">
      <div className="fm-tech-profile__header">
        <div>
          <span className="fm-tech-profile__eyebrow">Account Settings</span>

          <h1>Technician Profile</h1>

          <p>
            Manage your technician profile, contact details, specialization,
            experience, profile photo, and account password.
          </p>
        </div>

        <button
          type="button"
          className="fm-tech-profile__btn fm-tech-profile__btn--outline"
          onClick={() => setEditMode((value) => !value)}>
          <Pencil size={16} />
          {editMode ? "Cancel Edit" : "Edit Profile"}
        </button>
      </div>

      {msg?.text ? (
        <div
          className={`fm-tech-profile__notice fm-tech-profile__notice--${
            msg.type || "info"
          }`}
          role="status"
          aria-live="polite">
          {msg.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <section className="fm-tech-profile__card">
        <div className="fm-tech-profile__identity">
          <div className="fm-tech-profile__photoWrap">
            <img
              className="fm-tech-profile__photo"
              src={imagePreview}
              alt="Technician profile"
              onError={(event) => {
                event.currentTarget.src = DEFAULT_PROFILE;
              }}
            />

            <button
              type="button"
              className="fm-tech-profile__photoButton"
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

          <div className="fm-tech-profile__identityText">
            <h2>{profile.full_name || "Technician"}</h2>
            <p>{profile.email || "email@example.com"}</p>

            <span className="fm-tech-profile__role">
              <ShieldCheck size={14} />
              Technician
            </span>
          </div>

          <button
            type="button"
            className="fm-tech-profile__btn fm-tech-profile__btn--secondary"
            onClick={pickFile}>
            <Upload size={16} />
            Change Photo
          </button>
        </div>
      </section>

      {!editMode ? (
        <section className="fm-tech-profile__grid">
          <article className="fm-tech-profile__infoCard">
            <span>
              <UserRound size={16} />
            </span>
            <div>
              <p>Full Name</p>
              <strong>{profile.full_name || "-"}</strong>
            </div>
          </article>

          <article className="fm-tech-profile__infoCard">
            <span>
              <Mail size={16} />
            </span>
            <div>
              <p>Email</p>
              <strong>{profile.email || "-"}</strong>
            </div>
          </article>

          <article className="fm-tech-profile__infoCard">
            <span>
              <Phone size={16} />
            </span>
            <div>
              <p>Mobile</p>
              <strong>{profile.phone_number || "-"}</strong>
            </div>
          </article>

          <article className="fm-tech-profile__infoCard">
            <span>
              <MapPin size={16} />
            </span>
            <div>
              <p>Address</p>
              <strong>{profile.address || "-"}</strong>
            </div>
          </article>

          <article className="fm-tech-profile__infoCard">
            <span>
              <MapPin size={16} />
            </span>
            <div>
              <p>District</p>
              <strong>{profile.district || "-"}</strong>
            </div>
          </article>

          <article className="fm-tech-profile__infoCard">
            <span>
              <Wrench size={16} />
            </span>
            <div>
              <p>Specialization</p>
              <strong>{niceSpec || "-"}</strong>
            </div>
          </article>

          <article className="fm-tech-profile__infoCard">
            <span>
              <ShieldCheck size={16} />
            </span>
            <div>
              <p>Experience</p>
              <strong>{profile.experience_years ?? "-"} years</strong>
            </div>
          </article>

          <article className="fm-tech-profile__infoCard">
            <span>
              <ShieldCheck size={16} />
            </span>
            <div>
              <p>Role</p>
              <strong>{profile.role || "technician"}</strong>
            </div>
          </article>
        </section>
      ) : (
        <form
          className="fm-tech-profile__card fm-tech-profile__form"
          onSubmit={onSave}
          noValidate>
          <div className="fm-tech-profile__cardHeader">
            <div>
              <span>Profile details</span>
              <h2>Edit Profile</h2>
            </div>
          </div>

          <div className="fm-tech-profile__formGrid">
            <div className="fm-tech-profile__field">
              <label htmlFor="fm-tech-profile-name">Full Name</label>
              <input
                id="fm-tech-profile-name"
                type="text"
                name="full_name"
                value={profile.full_name}
                onChange={onChange}
                placeholder="Full Name"
                required
              />
            </div>

            <div className="fm-tech-profile__field">
              <label htmlFor="fm-tech-profile-email">Email</label>
              <input
                id="fm-tech-profile-email"
                type="email"
                name="email"
                value={profile.email}
                placeholder="Email"
                readOnly
              />
            </div>

            <div className="fm-tech-profile__field">
              <label htmlFor="fm-tech-profile-phone">Mobile</label>
              <input
                id="fm-tech-profile-phone"
                type="tel"
                name="phone_number"
                value={profile.phone_number}
                onChange={onChange}
                placeholder="Mobile (+94XXXXXXXXX)"
              />
            </div>

            <div className="fm-tech-profile__field">
              <label htmlFor="fm-tech-profile-address">Address</label>
              <input
                id="fm-tech-profile-address"
                type="text"
                name="address"
                value={profile.address}
                onChange={onChange}
                placeholder="Address"
              />
            </div>

            <div className="fm-tech-profile__field">
              <label htmlFor="fm-tech-profile-district">District</label>
              <input
                id="fm-tech-profile-district"
                type="text"
                name="district"
                value={profile.district}
                onChange={onChange}
                placeholder="District"
              />
            </div>

            <div className="fm-tech-profile__field">
              <label htmlFor="fm-tech-profile-specialization">
                Specialization
              </label>
              <input
                id="fm-tech-profile-specialization"
                type="text"
                name="specialization"
                value={profile.specialization}
                onChange={onChange}
                placeholder="Specialization, comma separated"
              />
            </div>

            <div className="fm-tech-profile__field">
              <label htmlFor="fm-tech-profile-experience">
                Experience Years
              </label>
              <input
                id="fm-tech-profile-experience"
                type="number"
                name="experience_years"
                value={profile.experience_years}
                onChange={onChange}
                placeholder="Years of experience"
              />
            </div>
          </div>

          <div className="fm-tech-profile__actions">
            <button
              type="submit"
              className="fm-tech-profile__btn fm-tech-profile__btn--primary"
              disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      )}

      <section className="fm-tech-profile__card">
        <div className="fm-tech-profile__cardHeader">
          <div>
            <span>Security</span>
            <h2>Change Password</h2>
          </div>
        </div>

        <form
          className="fm-tech-profile__passwordForm"
          onSubmit={onPasswordSubmit}
          noValidate>
          <div className="fm-tech-profile__field">
            <label htmlFor="fm-tech-current-password">Current Password</label>
            <input
              id="fm-tech-current-password"
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
            />
          </div>

          <div className="fm-tech-profile__field">
            <label htmlFor="fm-tech-new-password">New Password</label>
            <input
              id="fm-tech-new-password"
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
            />
          </div>

          <div className="fm-tech-profile__actions">
            <button
              type="submit"
              className="fm-tech-profile__btn fm-tech-profile__btn--primary">
              <LockKeyhole size={16} />
              Change Password
            </button>
          </div>
        </form>
      </section>

      {cropOpen ? (
        <div
          className="fm-tech-profile-crop"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true"
          aria-label="Adjust profile photo">
          <div
            className="fm-tech-profile-crop__modal"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-tech-profile-crop__header">
              <div>
                <span>Profile image</span>
                <h2>Adjust Photo</h2>
              </div>

              <button
                type="button"
                className="fm-tech-profile__iconAction"
                onClick={cleanupCrop}
                aria-label="Close crop modal">
                <X size={16} />
              </button>
            </div>

            <div
              ref={vpRef}
              className={`fm-tech-profile-crop__viewport ${
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
                  className="fm-tech-profile-crop__image"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${
                      base * zoom
                    })`,
                  }}
                />
              ) : null}

              <div className="fm-tech-profile-crop__circle" />
            </div>

            <div className="fm-tech-profile-crop__controls">
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

              <div className="fm-tech-profile-crop__actions">
                <button
                  type="button"
                  className="fm-tech-profile__btn fm-tech-profile__btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="fm-tech-profile__btn fm-tech-profile__btn--primary"
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
