import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/api";
import "./ManageUsers.css";

const DISTRICTS = [
  "Colombo","Gampaha","Kalutara",
  "Kandy","Matale","Nuwara Eliya",
  "Galle","Matara","Hambantota",
  "Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu",
  "Batticaloa","Ampara","Trincomalee",
  "Kurunegala","Puttalam",
  "Anuradhapura","Polonnaruwa",
  "Badulla","Monaragala",
  "Ratnapura","Kegalle",
];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    district: "",
    // we won’t render a text field for this; it will hold cropped base64
    profile_image_url: "",
    password: "",
  });

  // preview (what you see) + cropped base64 to send
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  // ---------- cropper state (circle avatar) ----------
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOffX: 0, startOffY: 0 });
  const imgMeta = useRef({ w: 0, h: 0 });

  // ---------- load users ----------
  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/customers");
      setUsers(res.data || []);
    } catch (e) {
      console.error("Error loading users", e);
    } finally {
      setLoading(false);
    }
  }

  // ---------- form handlers (autofill-safe email/password) ----------
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }
  const handleEmailChange = (e) => setForm((p) => ({ ...p, email: e.target.value }));
  const handlePasswordChange = (e) => setForm((p) => ({ ...p, password: e.target.value }));

  // ---------- image pick & crop ----------
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
    const circle = 256; // output size; small keeps JSON payload small
    const fit = Math.max(circle / img.naturalWidth, circle / img.naturalHeight);
    setBase(fit);
    setZoom(1);
    setOffX(0);
    setOffY(0);
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

    // circle mask (avatar)
    ctx.save();
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, Math.PI*2);
    ctx.closePath();
    ctx.clip();

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    // compress to ~60KB
    let q = startQ;
    let out = canvas.toDataURL("image/jpeg", q);
    const maxBytes = 60 * 1024;
    while (out.length * 0.75 > maxBytes && q > 0.45) {
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
    const dataUrl = exportCroppedDataUrl(img, 256, 0.75);
    setImageDataUrl(dataUrl);
    setImagePreview(dataUrl);
    // also stage it into form so update can include it if desired
    setForm((p) => ({ ...p, profile_image_url: dataUrl }));
    cleanupCrop();
  };

  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropOpen(false);
  };

  // ---------- submit ----------
  async function handleSubmit(e) {
    e.preventDefault();
    try {
      if (editingUser) {
        // Backend update allows: full_name,email,phone_number,address,district,profile_image_url
        const payload = {
          full_name: form.full_name,
          email: form.email,
          phone_number: form.phone_number,
          address: form.address,
          district: form.district,
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}), // only send if changed
        };
        await api.put(`/api/admin/customers/${editingUser._id}`, payload);
      } else {
        // Create requires password; send profile_image_url if we have one
        const payload = {
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          phone_number: form.phone_number,
          address: form.address,
          district: form.district,
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
        };
        await api.post("/api/admin/customers", payload);
      }
      resetForm();
      fetchUsers();
    } catch (e) {
      alert(e?.response?.data?.message || "Error saving user");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/api/admin/customers/${id}`);
      fetchUsers();
    } catch (e) {
      alert("Error deleting user");
    }
  }

  function startEdit(user) {
    setEditingUser(user);
    setForm({
      full_name: user.full_name || "",
      email: user.email || "",
      phone_number: user.phone_number || "",
      address: user.address || "",
      district: user.district || "",
      profile_image_url: user.profile_image_url || "",
      password: "", // edit path doesn't use password
    });
    setImagePreview(user.profile_image_url || "");
    setImageDataUrl(""); // only send if changed
  }

  function resetForm() {
    setEditingUser(null);
    setForm({
      full_name: "",
      email: "",
      phone_number: "",
      address: "",
      district: "",
      profile_image_url: "",
      password: "",
    });
    setImagePreview("");
    setImageDataUrl("");
  }

  return (
    <div className="manage-users">
      <h2>👥 Manage Users</h2>

      <form className="user-form" onSubmit={handleSubmit} autoComplete="off">
        <h3>{editingUser ? "Edit User" : "Add User"}</h3>

        {/* decoys to absorb browser autofill */}
        <input type="text" name="username" autoComplete="username" style={{ display: "none" }} />
        <input type="password" name="password" autoComplete="current-password" style={{ display: "none" }} />

        <div className="avatar-block">
          <img
            src={imagePreview || "/default-profile.png"}
            alt="preview"
            className="avatar large"
          />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          <button type="button" className="btn secondary" onClick={pickFile}>
            {imagePreview ? "Change Photo" : "Upload Photo"}
          </button>
        </div>

        <div className="form-grid">
          <input
            type="text"
            name="full_name"
            placeholder="Full Name"
            value={form.full_name}
            onChange={handleChange}
            required
            autoComplete="off"
          />

          {/* Email: nonstandard name + no readOnly (typing allowed) */}
          <input
            type="email"
            name="__no_email"
            placeholder="Email"
            value={form.email}
            onChange={handleEmailChange}
            required
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore="true"
            data-lpignore="true"
          />

          {/* Password only when creating */}
          {!editingUser && (
            <input
              type="password"
              name="__no_password"
              placeholder="Password"
              value={form.password}
              onChange={handlePasswordChange}
              required
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
            autoComplete="off"
          />

          <input
            type="text"
            name="address"
            placeholder="Address"
            value={form.address}
            onChange={handleChange}
            required
            autoComplete="off"
          />

          {/* District dropdown */}
          <select
            name="district"
            value={form.district}
            onChange={handleChange}
            required
          >
            <option value="" disabled>-- Select District --</option>
            {DISTRICTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="actions-row">
          <button type="submit" className="btn primary">
            {editingUser ? "Update" : "Create"}
          </button>
          {editingUser && (
            <button type="button" className="btn cancel" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <h3 className="list-title">All Users</h3>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>District</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id}>
                  <td>
                    {u.profile_image_url ? (
                      <img src={u.profile_image_url} alt={u.full_name} className="avatar" />
                    ) : ("—")}
                  </td>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.phone_number || "—"}</td>
                  <td>{u.district}</td>
                  <td>{u.address}</td>
                  <td>
                    <button className="btn small" onClick={() => startEdit(u)}>✏️</button>
                    <button className="btn small danger" onClick={() => handleDelete(u._id)}>🗑️</button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: "center" }}>No users found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base * zoom})`,
                  }}
                />
              )}
              <div className="crop-mask-circle" />
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
                <button type="button" className="btn cancel" onClick={cleanupCrop}>Cancel</button>
                <button type="button" className="btn primary" onClick={confirmCrop}>Use Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
