import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/api";
import "./ManageTechnicians.css";

const DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya",
  "Galle","Matara","Hambantota","Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu",
  "Batticaloa","Ampara","Trincomalee","Kurunegala","Puttalam",
  "Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle",
];

export default function ManageTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showConverted, setShowConverted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone_number: "",
    address: "",
    district: "",
    specialization: "",
    experience_years: 0,
  });
  const [editId, setEditId] = useState(null);

  // avatar preview + payload
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

  // ---------- load ----------
  async function loadTechnicians() {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/technicians");
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load technicians");
    } finally {
      setLoading(false);
    }
  }
  async function loadApplications(includeConverted = false) {
    try {
      setAppsLoading(true);
      const { data } = await api.get(`/api/admin/technicians/applications${includeConverted ? "?includeConverted=1" : ""}`);
      setApplications(Array.isArray(data) ? data : []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to load applications");
    } finally {
      setAppsLoading(false);
    }
  }
  useEffect(() => { loadTechnicians(); loadApplications(false); }, []);
  useEffect(() => { loadApplications(showConverted); }, [showConverted]);

  // ---------- form ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: name === "experience_years" ? Number(value) : value }));
  };

  const resetForm = () => {
    setEditId(null);
    setForm({
      full_name:"", email:"", password:"", phone_number:"",
      address:"", district:"", specialization:"", experience_years:0
    });
    setImagePreview(""); setImageDataUrl("");
  };

  // ---------- create/update ----------
  async function handleSubmit(e) {
    e.preventDefault();
    setMsg("");
    const required = ["full_name","email","phone_number","address","district","specialization", ...(editId ? [] : ["password"])];
    const missing = required.filter(k => !String(form[k] ?? "").trim());
    if (missing.length) { setMsg(`Please fill: ${missing.join(", ")}`); return; }

    try {
      if (editId) {
        const payload = {
          full_name: form.full_name,
          email: form.email,
          phone_number: form.phone_number,
          address: form.address,
          district: form.district,
          specialization: form.specialization,
          experience_years: Number(form.experience_years) || 0,
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
        };
        await api.put(`/api/admin/technicians/${editId}`, payload);
        setMsg("Technician updated ✨");
      } else {
        const payload = {
          full_name: form.full_name,
          email: form.email,
          phone_number: form.phone_number,
          address: form.address,
          district: form.district,
          specialization: form.specialization,
          experience_years: Number(form.experience_years) || 0,
          password: form.password,
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
        };
        await api.post("/api/admin/technicians", payload);
        setMsg("Technician created ✅");
      }
      resetForm();
      loadTechnicians();
    } catch (e) {
      setMsg(e?.response?.data?.message || "Error saving technician");
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this technician?")) return;
    try { await api.delete(`/api/admin/technicians/${id}`); loadTechnicians(); }
    catch (e) { setMsg(e?.response?.data?.message || "Delete failed"); }
  }

  function handleEdit(t) {
    setEditId(t._id);
    setForm({
      full_name: t.full_name || "",
      email: t.email || "",
      password: "",
      phone_number: t.phone_number || "",
      address: t.address || "",
      district: t.district || "",
      specialization: t.specialization || "",
      experience_years: t.experience_years || 0,
    });
    const img = t.profile_image_url || t.profile_image?.url || "";
    setImagePreview(img || ""); setImageDataUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleSuspend(t) {
    try {
      if (t.is_suspended) await api.post(`/api/admin/technicians/${t._id}/unsuspend`);
      else await api.post(`/api/admin/technicians/${t._id}/suspend`);
      loadTechnicians();
    } catch (e) { setMsg(e?.response?.data?.message || "Failed to update suspension"); }
  }

  async function convertApplication(id) {
    const password = prompt("Enter initial password for technician:");
    if (!password) return;
    try {
      await api.post(`/api/admin/technicians/convert/${id}`, { password });
      loadApplications(showConverted); loadTechnicians();
    } catch (e) { setMsg(e?.response?.data?.message || "Error converting application"); }
  }

  async function deleteApplication(id) {
    if (!window.confirm("Delete this application?")) return;
    try { await api.delete(`/api/admin/technicians/applications/${id}`); loadApplications(showConverted); }
    catch (e) { setMsg(e?.response?.data?.message || "Failed to delete application"); }
  }

  // ---------- pick & crop ----------
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
  const clampPan = (x,y,z) => {
    const S = 256;
    const w = imgMeta.current.w * base * z;
    const h = imgMeta.current.h * base * z;
    const maxX = Math.max(0, (w - S) / 2);
    const maxY = Math.max(0, (h - S) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  };
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
    let q = startQ, out = canvas.toDataURL("image/jpeg", q);
    const maxBytes = 80 * 1024;
    while (out.length * 0.75 > maxBytes && q > 0.5) { q -= 0.1; out = canvas.toDataURL("image/jpeg", q); }
    return out;
  }
  const confirmCrop = async () => {
    if (!cropSrc) return;
    const img = new Image(); img.src = cropSrc;
    await new Promise((r) => (img.onload = r));
    const data = exportCroppedDataUrl(img, 256, 0.8);
    setImageDataUrl(data); setImagePreview(data); cleanupCrop();
  };
  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null); setCropOpen(false);
  };

  return (
    <div className="mt">
      {/* Header */}
      <div className="mt-header">
        <div className="mt-title">
          <h2>Manage Technicians</h2>
          <div className="mt-sub">Create, update, suspend, and convert applications. Avatars are optional.</div>
        </div>
      </div>

      {msg && <div className="mt-alert mt-alert--info">{msg}</div>}

      {/* Form Card */}
      <form className="mt-card mt-form" onSubmit={handleSubmit} autoComplete="off">
        {/* decoys */}
        <input type="text" name="username" autoComplete="username" style={{display:"none"}} />
        <input type="password" name="password" autoComplete="current-password" style={{display:"none"}} />

        <div className="mt-form-grid">
          <div className="mt-fields">
            <div className="mt-field">
              <label>Full Name</label>
              <input name="full_name" type="text" value={form.full_name} onChange={handleChange} placeholder="Full Name" required />
            </div>

            <div className="mt-field">
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
              {editId && <div className="tiny muted">Changing email updates the technician’s login.</div>}
            </div>

            <div className="mt-cols-2">
              <div className="mt-field">
                <label>{editId ? "New Password (optional)" : "Password"}</label>
                <input
                  name="__no_password"
                  type="password"
                  value={form.password}
                  onChange={(e)=>setForm(p=>({...p,password:e.target.value}))}
                  placeholder={editId ? "Leave blank to keep current password" : "Set a strong password"}
                  required={!editId}
                  autoComplete="new-password"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
              </div>

              <div className="mt-field">
                <label>Phone Number</label>
                <input name="phone_number" type="text" value={form.phone_number} onChange={handleChange} placeholder="+94XXXXXXXXX" required />
              </div>
            </div>

            <div className="mt-cols-2">
              <div className="mt-field">
                <label>Address</label>
                <input name="address" type="text" value={form.address} onChange={handleChange} placeholder="Street, City" required />
              </div>

              <div className="mt-field">
                <label>District</label>
                <select name="district" value={form.district} onChange={handleChange} required>
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="mt-cols-2">
              <div className="mt-field">
                <label>Specialization</label>
                <input name="specialization" type="text" value={form.specialization} onChange={handleChange} placeholder="e.g., Electrician" required />
              </div>

              <div className="mt-field">
                <label>Experience (years)</label>
                <input name="experience_years" type="number" min="0" value={form.experience_years} onChange={handleChange} />
              </div>
            </div>

            <div className="mt-actions">
              <button type="submit" className="mt-btn mt-btn--primary">
                {editId ? "Update Technician" : "Add Technician"}
              </button>
              {editId && (
                <button type="button" className="mt-btn mt-btn--outline" onClick={resetForm}>Cancel</button>
              )}
            </div>
          </div>

          {/* Avatar side */}
          <div className="mt-avatar-card">
            <div className="mt-avatar-wrap">
              <img src={imagePreview || "/default-profile.png"} alt="profile" className="mt-avatar" />
            </div>
            <div className="mt-avatar-actions">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
              <button type="button" className="mt-btn mt-btn--secondary" onClick={pickFile}>
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </button>
              {imagePreview && (
                <button type="button" className="mt-btn mt-btn--danger" onClick={() => { setImagePreview(""); setImageDataUrl(""); }}>
                  Remove Photo
                </button>
              )}
            </div>
            <div className="tiny muted">Square images look best · JPG/PNG</div>
          </div>
        </div>
      </form>

      {/* Technicians List */}
      <div className="mt-card">
        <div className="mt-list-head">
          <h3>Technicians</h3>
          <button className="mt-btn mt-btn--outline" onClick={loadTechnicians} disabled={loading}>
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        <div className="mt-table-wrap">
          <table className="mt-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>District</th><th>Specialization</th><th>Exp (yrs)</th><th style={{width:240}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {technicians.map(t => (
                <tr key={t._id}>
                  <td>
                    {t.full_name}
                    {t.is_suspended && <span className="mt-badge mt-badge--red">Suspended</span>}
                  </td>
                  <td className="mt-clip">{t.email}</td>
                  <td>{t.phone_number}</td>
                  <td>{t.district}</td>
                  <td>{t.specialization}</td>
                  <td>{t.experience_years}</td>
                  <td className="mt-row-actions">
                    <button className="mt-btn mt-btn--small mt-btn--primary" onClick={()=>handleEdit(t)}>Edit</button>
                    <button className="mt-btn mt-btn--small mt-btn--secondary" onClick={()=>toggleSuspend(t)}>
                      {t.is_suspended ? "Unsuspend" : "Suspend"}
                    </button>
                    <button className="mt-btn mt-btn--small mt-btn--danger" onClick={()=>handleDelete(t._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!technicians.length && !loading && (
                <tr><td colSpan="7" className="muted" style={{textAlign:"center"}}>No technicians</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Applications */}
      <div className="mt-card">
        <div className="mt-list-head">
          <h3>Technician Applications</h3>
          <label className="mt-toggle">
            <input type="checkbox" checked={showConverted} onChange={(e)=>setShowConverted(e.target.checked)} />
            <span>Show converted</span>
          </label>
        </div>

        <div className="mt-table-wrap">
          <table className="mt-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Phone</th><th>District</th><th>Specialization</th><th>Exp (yrs)</th><th style={{width:220}}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map(a => (
                <tr key={a._id}>
                  <td>
                    {a.full_name}
                    {a.status === "converted" && <span className="mt-badge mt-badge--green">Converted</span>}
                  </td>
                  <td className="mt-clip">{a.email}</td>
                  <td>{a.phone_number}</td>
                  <td>{a.district}</td>
                  <td>{a.specialization}</td>
                  <td>{a.experience_years}</td>
                  <td className="mt-row-actions">
                    {a.status !== "converted" && (
                      <button className="mt-btn mt-btn--small mt-btn--secondary" onClick={()=>convertApplication(a._id)}>Convert</button>
                    )}
                    <button className="mt-btn mt-btn--small mt-btn--danger" onClick={()=>deleteApplication(a._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!applications.length && !appsLoading && (
                <tr><td colSpan="7" className="muted" style={{textAlign:"center"}}>No applications</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Crop modal */}
      {cropOpen && (
        <div className="mt-crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="mt-crop-modal" onClick={(e)=>e.stopPropagation()}>
            <div className="mt-crop-head">
              <h4>Adjust Photo</h4>
              <button type="button" className="mt-btn mt-btn--danger mt-btn--small" onClick={cleanupCrop}>Close</button>
            </div>

            <div
              className={`mt-crop-viewport ${dragRef.current.active ? "dragging" : ""}`}
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
                  className="mt-crop-img"
                  onLoad={onPreviewLoad}
                  style={{ transform:`translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base*zoom})` }}
                />
              )}
              <div className="mt-crop-circle" />
            </div>

            <div className="mt-crop-controls">
              <input type="range" min="1" max="3" step="0.01" value={zoom} onChange={(e)=>setZoom(parseFloat(e.target.value))} />
              <div className="mt-crop-actions">
                <button type="button" className="mt-btn mt-btn--danger mt-btn--outline" onClick={cleanupCrop}>Cancel</button>
                <button type="button" className="mt-btn mt-btn--primary" onClick={confirmCrop}>Use Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
