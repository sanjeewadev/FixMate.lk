import React, { useEffect, useRef, useState, useEffect as ReactUseEffect } from "react";
import api from "../../../lib/api";
import "./ManageStaff.css";

const DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya",
  "Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu",
  "Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam",
  "Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle",
];

export default function ManageStaff() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
    district: "",
  });

  // avatar (preview + payload base64)
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  // ---- cropper ----
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const dragRef = useRef({ active:false, startX:0, startY:0, startOffX:0, startOffY:0 });
  const imgMeta = useRef({ w:0, h:0 });

  async function fetchRows() {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/coordinators");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { fetchRows(); }, []);

  // ----- helpers -----
  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const resetForm = () => {
    setEditingId(null);
    setForm({ full_name:"", email:"", password:"", phone_number:"", address:"", district:"" });
    setImagePreview(""); setImageDataUrl("");
  };

  // ----- create/update -----
  const buildPayload = (isCreate) => ({
    full_name: form.full_name,
    email: form.email,
    phone_number: form.phone_number,
    address: form.address,
    district: form.district,
    ...(isCreate ? { password: form.password } : (form.password ? { password: form.password } : {})),
    ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
  });

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    const req = ["full_name","email","phone_number","address","district", ...(editingId ? [] : ["password"])];
    const missing = req.filter(k => !String(form[k] || "").trim());
    if (missing.length) { setMsg(`Please fill: ${missing.join(", ")}`); return; }

    try {
      if (editingId) {
        await api.put(`/api/admin/coordinators/${editingId}`, buildPayload(false));
        setMsg("Coordinator updated ✅");
      } else {
        await api.post("/api/admin/coordinators", buildPayload(true));
        setMsg("Coordinator created ✅");
      }
      resetForm();
      fetchRows();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Save failed");
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this coordinator?")) return;
    try {
      await api.delete(`/api/admin/coordinators/${id}`);
      fetchRows();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Delete failed");
    }
  }

  function startEdit(c) {
    setEditingId(c._id);
    setForm({
      full_name: c.full_name || "",
      email: c.email || "",
      password: "",
      phone_number: c.phone_number || "",
      address: c.address || "",
      district: c.district || "",
    });
    const img = c.profile_image_url || c.profile_image?.url || "";
    setImagePreview(img || "");
    setImageDataUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ----- pick & crop -----
  const pickFile = () => fileRef.current?.click();
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setCropSrc(url); setCropOpen(true);
    e.target.value = "";
  };

  const onPreviewLoad = (e) => {
    const img = e.currentTarget;
    imgMeta.current = { w: img.naturalWidth, h: img.naturalHeight };
    const S = 256;
    const fit = Math.max(S / img.naturalWidth, S / img.naturalHeight);
    setBase(fit); setZoom(1); setOffX(0); setOffY(0);
  };

  function clampPan(x, y, z) {
    const S = 256;
    const w = imgMeta.current.w * base * z;
    const h = imgMeta.current.h * base * z;
    const maxX = Math.max(0, (w - S) / 2);
    const maxY = Math.max(0, (h - S) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }

  const onDragStart = (e) => {
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = { active:true, startX:p.clientX, startY:p.clientY, startOffX:offX, startOffY:offY };
  };
  const onDragMove = (e) => {
    if (!dragRef.current.active) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - dragRef.current.startX;
    const dy = p.clientY - dragRef.current.startY;
    const next = clampPan(dragRef.current.startOffX + dx, dragRef.current.startOffY + dy, zoom);
    setOffX(next.x); setOffY(next.y);
  };
  const onDragEnd = () => (dragRef.current.active = false);

  ReactUseEffect(() => {
    if (!cropSrc) return;
    const { x, y } = clampPan(offX, offY, zoom);
    if (x !== offX) setOffX(x);
    if (y !== offY) setOffY(y);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, base, cropSrc]);

  function exportCropped(img, size = 256, startQ = 0.75) {
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
    let q = startQ, out = canvas.toDataURL("image/jpeg", q);
    const maxBytes = 80 * 1024;
    while (out.length * 0.75 > maxBytes && q > 0.5) { q -= 0.1; out = canvas.toDataURL("image/jpeg", q); }
    return out;
  }

  const confirmCrop = async () => {
    if (!cropSrc) return;
    const img = new Image();
    img.src = cropSrc;
    await new Promise((r) => (img.onload = r));
    const data = exportCropped(img, 256, 0.8);
    setImageDataUrl(data); setImagePreview(data); cleanupCrop();
  };
  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null); setCropOpen(false);
  };

  return (
    <div className="ms">
      {/* Header */}
      <div className="ms-header">
        <div className="ms-title">
          <h2>Manage Staff</h2>
          <div className="ms-sub">Create, update, or remove coordinators. Avatars are optional.</div>
        </div>
      </div>

      {msg && <div className="ms-alert ms-alert--info">{msg}</div>}

      {/* Form Card */}
      <form className="ms-card ms-form" onSubmit={onSubmit} autoComplete="off">
        {/* autofill decoys */}
        <input type="text" name="username" autoComplete="username" style={{display:"none"}} />
        <input type="password" name="password" autoComplete="current-password" style={{display:"none"}} />

        <div className="ms-form-grid">
          <div className="ms-fields">
            <div className="ms-field">
              <label>Full Name</label>
              <input name="full_name" type="text" value={form.full_name} onChange={handleChange} placeholder="Full Name" required />
            </div>

            <div className="ms-field">
              <label>Email</label>
              <input
                name="__no_email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={(e)=>setForm(p=>({...p,email:e.target.value}))}
                onBlur={(e)=>setForm(p=>({...p,email:e.target.value.trim()}))}
                placeholder="email@example.com"
                required
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
              />
              {editingId && <div className="tiny muted">Changing email updates login for this staff member.</div>}
            </div>

            <div className="ms-cols-2">
              <div className="ms-field">
                <label>{editingId ? "New Password (optional)" : "Password"}</label>
                <input
                  name="__no_password"
                  type="password"
                  value={form.password}
                  onChange={(e)=>setForm(p=>({...p,password:e.target.value}))}
                  placeholder={editingId ? "Leave blank to keep current password" : "Set a strong password"}
                  required={!editingId}
                  autoComplete="new-password"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
              </div>

              <div className="ms-field">
                <label>Phone Number</label>
                <input name="phone_number" type="text" value={form.phone_number} onChange={handleChange} placeholder="+94XXXXXXXXX" required />
              </div>
            </div>

            <div className="ms-cols-2">
              <div className="ms-field">
                <label>Address</label>
                <input name="address" type="text" value={form.address} onChange={handleChange} placeholder="Street, City" required />
              </div>

              <div className="ms-field">
                <label>District</label>
                <select name="district" value={form.district} onChange={handleChange} required>
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="ms-actions">
              <button type="submit" className="ms-btn ms-btn--primary">
                {editingId ? "Update Coordinator" : "Add Coordinator"}
              </button>
              {editingId && (
                <button type="button" className="ms-btn ms-btn--outline" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </div>

          {/* Avatar side */}
          <div className="ms-avatar-card">
            <div className="ms-avatar-wrap">
              <img src={imagePreview || "/default-profile.png"} alt="profile" className="ms-avatar" />
            </div>
            <div className="ms-avatar-actions">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
              <button type="button" className="ms-btn ms-btn--secondary" onClick={pickFile}>
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </button>
              {imagePreview && (
                <button type="button" className="ms-btn ms-btn--danger" onClick={()=>{ setImagePreview(""); setImageDataUrl(""); }}>
                  Remove Photo
                </button>
              )}
            </div>
            <div className="tiny muted">Square images look best · JPG/PNG</div>
          </div>
        </div>
      </form>

      {/* List Card */}
      <div className="ms-card">
        <div className="ms-list-head">
          <h3>Staff List</h3>
          <button className="ms-btn ms-btn--outline" onClick={fetchRows} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="ms-table-wrap">
          <table className="ms-table">
            <thead>
              <tr>
                <th>Profile</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>District</th>
                <th style={{width:180}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => {
                const img = r.profile_image_url || r.profile_image?.url || "";
                return (
                  <tr key={r._id}>
                    <td>{img ? <img className="ms-avatar--sm" src={img} alt="profile" /> : <span className="tiny muted">—</span>}</td>
                    <td>{r.full_name}</td>
                    <td className="ms-clip">{r.email}</td>
                    <td>{r.phone_number}</td>
                    <td>{r.district || "—"}</td>
                    <td className="ms-row-actions">
                      <button className="ms-btn ms-btn--small ms-btn--primary" onClick={()=>startEdit(r)}>Edit</button>
                      <button className="ms-btn ms-btn--small ms-btn--danger" onClick={()=>onDelete(r._id)}>Delete</button>
                    </td>
                  </tr>
                );
              })}
              {!rows.length && !loading && (
                <tr><td colSpan="6" className="muted" style={{textAlign:"center"}}>No staff found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crop modal */}
      {cropOpen && (
        <div className="ms-crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="ms-crop-modal" onClick={(e)=>e.stopPropagation()}>
            <div className="ms-crop-head">
              <h4>Adjust Photo</h4>
              <button type="button" className="ms-btn ms-btn--danger ms-btn--small" onClick={cleanupCrop}>Close</button>
            </div>

            <div
              className={`ms-crop-viewport ${dragRef.current.active ? "dragging" : ""}`}
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
                  className="ms-crop-img"
                  onLoad={onPreviewLoad}
                  style={{ transform:`translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base*zoom})` }}
                />
              )}
              <div className="ms-crop-circle" />
            </div>

            <div className="ms-crop-controls">
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e)=>setZoom(parseFloat(e.target.value))} />
              <div className="ms-crop-actions">
                <button type="button" className="ms-btn ms-btn--danger ms-btn--outline" onClick={cleanupCrop}>Cancel</button>
                <button type="button" className="ms-btn ms-btn--primary" onClick={confirmCrop}>Use Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
