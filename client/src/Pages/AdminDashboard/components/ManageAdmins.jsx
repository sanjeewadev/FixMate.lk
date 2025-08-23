import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/api";
import "./ManageAdmins.css";

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
  });
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // avatar preview + cropped base64
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  // ---- cropper state
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOffX: 0, startOffY: 0 });
  const imgMeta = useRef({ w: 0, h: 0 });

  // ---------- Load ----------
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/admins");
      setAdmins(res.data || []);
    } catch (err) {
      const s = err?.response?.status;
      if (s === 401) setMessage("Unauthorized. Please log in again.");
      else if (s === 403) setMessage("Forbidden. You must be admin or super admin.");
      else setMessage(err?.response?.data?.message || "Failed to load admins");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAdmins(); }, []);

  // ---------- Form handlers ----------
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setEditingId(null);
    setForm({ full_name: "", email: "", password: "", phone_number: "" });
    setImagePreview("");
    setImageDataUrl("");
  };

  const buildPayload = (isCreate) => {
    const payload = {
      full_name: form.full_name,
      email: form.email,               // keep email in both create & update
      phone_number: form.phone_number,
    };
    if (isCreate) payload.password = form.password;
    else if (form.password) payload.password = form.password;
    if (imageDataUrl) payload.profile_image_url = imageDataUrl;
    return payload;
  };

  // ---------- Create / Update / Delete ----------
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!form.password) { setMessage("Password is required for new admin."); return; }
      await api.post("/api/admin/admins", buildPayload(true));
      setMessage("Admin created successfully ✅");
      resetForm();
      fetchAdmins();
    } catch (err) {
      const s = err?.response?.status;
      if (s === 401) setMessage("Unauthorized. Please log in again.");
      else if (s === 403) setMessage("Forbidden. You must be admin or super admin.");
      else setMessage(err?.response?.data?.message || "Error creating admin");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/admins/${editingId}`, buildPayload(false));
      setMessage("Admin updated successfully ✨");
      resetForm();
      fetchAdmins();
    } catch (err) {
      const s = err?.response?.status;
      if (s === 401) setMessage("Unauthorized. Please log in again.");
      else if (s === 403) setMessage("Forbidden.");
      else setMessage(err?.response?.data?.message || "Error updating admin");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this admin? (Only super admin can delete)")) return;
    try {
      await api.delete(`/api/admin/admins/${id}`);
      setMessage("Admin deleted 🗑️");
      fetchAdmins();
    } catch (err) {
      const s = err?.response?.status;
      if (s === 403) setMessage("Only Super Admin can delete admins.");
      else setMessage(err?.response?.data?.message || "Error deleting admin");
    }
  };

  const startEdit = (admin) => {
    setEditingId(admin._id);
    setForm({
      full_name: admin.full_name || "",
      email: admin.email || "",
      password: "",
      phone_number: admin.phone_number || "",
    });
    const img = admin.profile_image_url || "";
    setImagePreview(img);
    setImageDataUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------- Image pick & crop ----------
  const pickFile = () => fileRef.current?.click();
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setCropSrc(url);
    setCropOpen(true);
    e.target.value = ""; // allow reselecting the same file
  };

  const onPreviewLoad = (e) => {
    const img = e.currentTarget;
    imgMeta.current = { w: img.naturalWidth, h: img.naturalHeight };
    const size = 256;
    const fit = Math.max(size / img.naturalWidth, size / img.naturalHeight);
    setBase(fit); setZoom(1); setOffX(0); setOffY(0);
  };

  function clampPan(x, y, z) {
    const size = 256;
    const scaledW = imgMeta.current.w * base * z;
    const scaledH = imgMeta.current.h * base * z;
    const maxX = Math.max(0, (scaledW - size) / 2);
    const maxY = Math.max(0, (scaledH - size) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }

  const onDragStart = (e) => {
    e.preventDefault();
    const pt = e.touches ? e.touches[0] : e;
    dragRef.current = { active: true, startX: pt.clientX, startY: pt.clientY, startOffX: offX, startOffY: offY };
  };
  const onDragMove = (e) => {
    if (!dragRef.current.active) return;
    const pt = e.touches ? e.touches[0] : e;
    const dx = pt.clientX - dragRef.current.startX;
    const dy = pt.clientY - dragRef.current.startY;
    const next = clampPan(dragRef.current.startOffX + dx, dragRef.current.startOffY + dy, zoom);
    setOffX(next.x); setOffY(next.y);
  };
  const onDragEnd = () => (dragRef.current.active = false);

  // Re‑clamp when zoom/base/source changes
  useEffect(() => {
    if (!cropSrc) return;
    const { x, y } = clampPan(offX, offY, zoom);
    if (x !== offX) setOffX(x);
    if (y !== offY) setOffY(y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, base, cropSrc]);

  function exportCroppedDataUrl(img, size = 256, startQ = 0.75) {
    const canvas = document.createElement("canvas");
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");

    const scale = base * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (size - drawW) / 2 + offX;
    const dy = (size - drawH) / 2 + offY;

    ctx.save();
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.closePath(); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    let q = startQ;
    let out = canvas.toDataURL("image/jpeg", q);
    const maxBytes = 80 * 1024;
    while (out.length * 0.75 > maxBytes && q > 0.5) {
      q -= 0.1;
      out = canvas.toDataURL("image/jpeg", q);
    }
    return out;
  }

  const confirmCrop = async () => {
    if (!cropSrc) return;
    const img = new Image();
    img.src = cropSrc;
    await new Promise((res) => (img.onload = res));
    const dataUrl = exportCroppedDataUrl(img, 256, 0.8);
    setImageDataUrl(dataUrl);
    setImagePreview(dataUrl);
    cleanupCrop();
  };

  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null); setCropOpen(false);
  };

  return (
    <div className="ma">
      <div className="ma-header">
        <div className="ma-title">
          <h2>Manage Admins</h2>
          <div className="ma-sub">Create, update, or remove admin accounts. Avatars are optional.</div>
        </div>
      </div>

      {message && <div className="ma-alert ma-alert--info">{message}</div>}

      {/* Form */}
      <form onSubmit={editingId ? handleUpdate : handleCreate} className="ma-card ma-form" autoComplete="off">
        {/* decoys to avoid autofill chaos */}
        <input type="text" name="username" autoComplete="username" style={{ display: "none" }} />
        <input type="password" name="password" autoComplete="current-password" style={{ display: "none" }} />

        <div className="ma-form-grid">
          <div className="ma-fields">
            <div className="ma-field">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                placeholder="Full Name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="ma-field">
              <label>Email</label>
              <input
                type="email"
                name="__no_email"
                inputMode="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                onBlur={(e) => setForm((f) => ({ ...f, email: e.target.value.trim() }))}
                required
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                data-1p-ignore="true"
                data-lpignore="true"
                spellCheck={false}
              />
              {editingId && <div className="tiny muted">Changing email updates the admin’s login address.</div>}
            </div>

            <div className="ma-cols-2">
              <div className="ma-field">
                <label>{editingId ? "New Password (optional)" : "Password"}</label>
                <input
                  type="password"
                  name="__no_password"
                  placeholder={editingId ? "Leave blank to keep current password" : "Set a strong password"}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                  autoComplete="new-password"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  spellCheck={false}
                />
              </div>

              <div className="ma-field">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone_number"
                  placeholder="+94XXXXXXXXX"
                  value={form.phone_number}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="ma-actions">
              <button type="submit" className="ma-btn ma-btn--primary">
                {editingId ? "Update Admin" : "Create Admin"}
              </button>
              {editingId && (
                <button type="button" className="ma-btn ma-btn--outline" onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Avatar side */}
          <div className="ma-avatar-card">
            <div className="ma-avatar-wrap">
              <img src={imagePreview || "/default-profile.png"} alt="profile" className="ma-avatar" />
            </div>
            <div className="ma-avatar-actions">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
              <button type="button" className="ma-btn ma-btn--secondary" onClick={pickFile}>
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </button>
              {imagePreview && (
                <button
                  type="button"
                  className="ma-btn ma-btn--danger"
                  onClick={() => { setImagePreview(""); setImageDataUrl(""); }}
                >
                  Remove Photo
                </button>
              )}
            </div>
            <div className="ma-hint tiny">Square images look best · JPG/PNG</div>
          </div>
        </div>
      </form>

      {/* Admin list */}
      <div className="ma-card">
        <div className="ma-list-head">
          <h3>Admin List</h3>
          <button className="ma-btn ma-btn--outline" onClick={fetchAdmins} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="ma-table-wrap">
          <table className="ma-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Role</th>
                <th style={{ width: 180 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a._id}>
                  <td>{a.profile_image_url ? <img src={a.profile_image_url} className="ma-avatar--sm" alt="profile" /> : "—"}</td>
                  <td>{a.full_name}</td>
                  <td className="ma-clip">{a.email}</td>
                  <td>{a.phone_number}</td>
                  <td><span className={`ma-role ${a.role === "super_admin" ? "super" : "admin"}`}>{a.role}</span></td>
                  <td className="ma-row-actions">
                    <button onClick={() => startEdit(a)} className="ma-btn ma-btn--small ma-btn--primary">Edit</button>
                    <button onClick={() => handleDelete(a._id)} className="ma-btn ma-btn--small ma-btn--danger">Delete</button>
                  </td>
                </tr>
              ))}
              {admins.length === 0 && !loading && (
                <tr><td colSpan="6" style={{ textAlign: "center" }} className="muted">No admins</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crop modal */}
      {cropOpen && (
        <div className="crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="crop-head">
              <h4>Adjust Photo</h4>
              <button type="button" className="ma-btn ma-btn--danger ma-btn--small" onClick={cleanupCrop}>Close</button>
            </div>

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
                  style={{ transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base * zoom})` }}
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
                <button type="button" className="ma-btn ma-btn--danger ma-btn--outline" onClick={cleanupCrop}>Cancel</button>
                <button type="button" className="ma-btn ma-btn--primary" onClick={confirmCrop}>Use Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
