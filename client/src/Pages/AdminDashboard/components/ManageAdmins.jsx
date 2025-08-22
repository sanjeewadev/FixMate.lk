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

  // avatar preview + cropped base64 we will send as profile_image_url
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  // ---- cropper state (same feel as your other pages)
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
      const res = await api.get("/api/admin/admins"); // ✅ correct path
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

  // Build payload; password required only on create
  const buildPayload = (isCreate) => {
    const payload = {
      full_name: form.full_name,
      email: form.email,
      phone_number: form.phone_number,
    };
    if (isCreate) payload.password = form.password;
    else if (form.password) payload.password = form.password; // optional on edit
    if (imageDataUrl) payload.profile_image_url = imageDataUrl; // base64 -> server stores string
    return payload;
  };

  // ---------- Create / Update / Delete ----------
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!form.password) { setMessage("Password is required for new admin."); return; }
      await api.post("/api/admin/admins", buildPayload(true)); // ✅ correct path
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
      await api.put(`/api/admin/admins/${editingId}`, buildPayload(false)); // ✅ correct path
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
      await api.delete(`/api/admin/admins/${id}`); // ✅ requires super_admin
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
    setImageDataUrl(""); // only send if user crops again
  };

  // ---------- Image pick & crop ----------
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
    <div className="manage-admins">
      <h2>Manage Admins</h2>
      {message && <p className="msg">{message}</p>}

      {/* Form */}
      <form onSubmit={editingId ? handleUpdate : handleCreate} className="admin-form" autoComplete="off">
        {/* decoys to avoid browser autofill chaos */}
        <input type="text" name="username" autoComplete="username" style={{ display: "none" }} />
        <input type="password" name="password" autoComplete="current-password" style={{ display: "none" }} />

        <div className="avatar-block">
          <img src={imagePreview || "/default-profile.png"} alt="profile" className="admin-avatar large" />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          <button type="button" className="btn" onClick={pickFile}>
            {imagePreview ? "Change Photo" : "Upload Photo"}
          </button>
        </div>

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
        />

        {/* Email field but with nonstandard name to reduce autofill */}
        <input
          type="email"
          name="__no_email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          data-1p-ignore="true"
          data-lpignore="true"
          spellCheck={false}
        />

        {!editingId ? (
          <input
            type="password"
            name="__no_password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            spellCheck={false}
          />
        ) : (
          <input
            type="password"
            name="__no_password"
            placeholder="(Optional) New Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="new-password"
            data-1p-ignore="true"
            data-lpignore="true"
            spellCheck={false}
          />
        )}

        <input
          type="text"
          name="phone_number"
          placeholder="Phone Number"
          value={form.phone_number}
          onChange={handleChange}
          required
        />

        <div className="form-actions">
          <button type="submit" className="btn primary">
            {editingId ? "Update Admin" : "Create Admin"}
          </button>
          {editingId && (
            <button type="button" className="btn" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* List */}
      <h3>Admin List</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="admins-table">
          <thead>
            <tr>
              <th>Profile</th>
              <th>Full Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Role</th>
              <th style={{ width: 160 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a._id}>
                <td>{a.profile_image_url ? <img src={a.profile_image_url} className="avatar" alt="profile" /> : "—"}</td>
                <td>{a.full_name}</td>
                <td>{a.email}</td>
                <td>{a.phone_number}</td>
                <td>{a.role}</td>
                <td>
                  <button onClick={() => startEdit(a)} className="btn small">Edit</button>
                  <button onClick={() => handleDelete(a._id)} className="btn small danger">Delete</button>
                </td>
              </tr>
            ))}
            {admins.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: "center", color: "#64748b" }}>No admins</td></tr>
            )}
          </tbody>
        </table>
      )}

      {/* Crop modal */}
      {cropOpen && (
        <div className="crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Adjust photo</h4>

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
                <button type="button" className="btn" onClick={cleanupCrop}>Cancel</button>
                <button type="button" className="btn primary" onClick={confirmCrop}>Use Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
