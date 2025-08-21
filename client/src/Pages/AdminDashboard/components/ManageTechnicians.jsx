import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/api";
import "./ManageTechnicians.css";

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

function ManageTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [applications, setApplications] = useState([]);

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

  // --- image preview + cropped dataURL to send as profile_image_url
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  // --- cropper state (same feel as your user profile flow)
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOffX: 0, startOffY: 0 });
  const imgMeta = useRef({ w: 0, h: 0 });

  // ================= Loaders =================
  const loadTechnicians = async () => {
    try {
      const res = await api.get("/api/admin/technicians");
      setTechnicians(res.data || []);
    } catch (err) {
      if (err?.response?.status === 401) alert("Unauthorized. Please log in again as admin.");
      else console.error(err);
    }
  };

  const loadApplications = async () => {
    try {
      const res = await api.get("/api/admin/technicians/applications");
      setApplications(res.data || []);
    } catch (err) {
      if (err?.response?.status === 401) alert("Unauthorized. Please log in again as admin.");
      else console.error(err);
    }
  };

  useEffect(() => {
    loadTechnicians();
    loadApplications();
  }, []);

  // ================= Form handlers (autofill-safe) =================
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "experience_years" ? Number(value) : value }));
  };
  const handleEmailChange = (e) => setForm((p) => ({ ...p, email: e.target.value }));
  const handlePasswordChange = (e) => setForm((p) => ({ ...p, password: e.target.value }));

  // ================= Image pick + crop =================
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
    const circle = 256; // smaller output = smaller payload
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
  const onDragEnd = () => { dragRef.current.active = false; };

  function exportCroppedDataUrl(img, size = 256, startQ = 0.75) {
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
    ctx.beginPath(); ctx.arc(size/2, size/2, size/2, 0, Math.PI*2); ctx.closePath(); ctx.clip();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    // keep payload small
    let q = startQ;
    let out = canvas.toDataURL("image/jpeg", q);
    const maxBytes = 60 * 1024; // ~60KB
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
    cleanupCrop();
  };

  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropOpen(false);
  };

  // ================= Create/Update (JSON only) =================
  const handleSubmit = async (e) => {
    e.preventDefault();
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
          ...(form.password ? { password: form.password } : {}),
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
        };
        await api.put(`/api/admin/technicians/${editId}`, payload);
        alert("Technician updated!");
      } else {
        if (!form.password) return alert("Password is required for new technician.");
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
        alert("Technician created!");
      }

      setForm({
        full_name: "",
        email: "",
        password: "",
        phone_number: "",
        address: "",
        district: "",
        specialization: "",
        experience_years: 0,
      });
      setEditId(null);
      setImagePreview("");
      setImageDataUrl("");
      loadTechnicians();
    } catch (err) {
      if (err?.response?.status === 401) {
        alert("Unauthorized. Please log in again as admin.");
      } else {
        console.error(err);
        alert(err?.response?.data?.message || "Error saving technician");
      }
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this technician?")) return;
    try {
      await api.delete(`/api/admin/technicians/${id}`);
      loadTechnicians();
    } catch (err) {
      if (err?.response?.status === 401) alert("Unauthorized. Please log in again as admin.");
      else console.error(err);
    }
  };

  const handleEdit = (tech) => {
    setForm({
      full_name: tech.full_name || "",
      email: tech.email || "",
      password: "",
      phone_number: tech.phone_number || "",
      address: tech.address || "",
      district: tech.district || "",
      specialization: tech.specialization || "",
      experience_years: tech.experience_years || 0,
    });
    const img = tech.profile_image_url || tech.profile_image?.url || "";
    setImagePreview(img || "");
    setImageDataUrl(""); // only send if changed
    setEditId(tech._id);
  };

  const convertApplication = async (id) => {
    const password = prompt("Enter initial password for technician:");
    if (!password) return;
    try {
      await api.post(`/api/admin/technicians/convert/${id}`, { password });
      alert("Application converted!");
      loadApplications();
      loadTechnicians();
    } catch (err) {
      if (err?.response?.status === 401) alert("Unauthorized. Please log in again as admin.");
      else {
        console.error(err);
        alert("Error converting application");
      }
    }
  };

  return (
    <div className="manage-technicians">
      <h2>Manage Technicians</h2>

      {/* Form */}
      <form className="tech-form" onSubmit={handleSubmit} autoComplete="off">
        {/* decoys to absorb autofill */}
        <input type="text" name="username" autoComplete="username" style={{ display: "none" }} />
        <input type="password" name="password" autoComplete="current-password" style={{ display: "none" }} />

        {/* avatar */}
        <div className="avatar-block">
          <img src={imagePreview || "/default-profile.png"} alt="preview" className="tech-avatar large" />
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
          <button type="button" className="btn status" onClick={pickFile}>Change Photo</button>
        </div>

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          required
          autoComplete="off"
        />

        {/* Email: nonstandard name + no readOnly so you can type; still blocks most autofill */}
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

        {/* Password: required on create; optional on edit */}
        {!editId ? (
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
        ) : (
          <input
            type="password"
            name="__no_password"
            placeholder="(Optional) New Password"
            value={form.password}
            onChange={handlePasswordChange}
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

        <input
          type="text"
          name="specialization"
          placeholder="Specialization"
          value={form.specialization}
          onChange={handleChange}
          required
          autoComplete="off"
        />

        <input
          type="number"
          name="experience_years"
          placeholder="Experience Years"
          value={form.experience_years}
          onChange={handleChange}
          min="0"
        />

        <button type="submit" className="btn accept">
          {editId ? "Update Technician" : "Add Technician"}
        </button>
        {editId && (
          <button
            type="button"
            className="btn close"
            onClick={() => {
              setEditId(null);
              setForm({
                full_name: "",
                email: "",
                password: "",
                phone_number: "",
                address: "",
                district: "",
                specialization: "",
                experience_years: 0,
              });
              setImagePreview("");
              setImageDataUrl("");
            }}
          >
            Cancel
          </button>
        )}
      </form>

      {/* Technicians list */}
      <h3>Technicians</h3>
      <table className="tech-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>District</th><th>Specialization</th><th>Exp (yrs)</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {technicians.map((tech) => (
            <tr key={tech._id}>
              <td>{tech.full_name}</td>
              <td>{tech.email}</td>
              <td>{tech.phone_number}</td>
              <td>{tech.district}</td>
              <td>{tech.specialization}</td>
              <td>{tech.experience_years}</td>
              <td>
                <button onClick={() => handleEdit(tech)} className="btn view">Edit</button>
                <button className="btn danger" onClick={() => handleDelete(tech._id)}>Delete</button>
              </td>
            </tr>
          ))}
          {technicians.length === 0 && (
            <tr><td colSpan="7" style={{ textAlign:"center",color:"#64748b" }}>No technicians</td></tr>
          )}
        </tbody>
      </table>

      {/* Applications */}
      <h3>Technician Applications</h3>
      <table className="tech-table">
        <thead>
          <tr>
            <th>Name</th><th>Email</th><th>Phone</th><th>District</th><th>Specialization</th><th>Exp (yrs)</th><th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {applications.map((app) => (
            <tr key={app._id}>
              <td>{app.full_name}</td>
              <td>{app.email}</td>
              <td>{app.phone_number}</td>
              <td>{app.district}</td>
              <td>{app.specialization}</td>
              <td>{app.experience_years}</td>
              <td><button onClick={() => convertApplication(app._id)} className="btn status">Convert</button></td>
            </tr>
          ))}
          {applications.length === 0 && (
            <tr><td colSpan="7" style={{ textAlign:"center",color:"#64748b" }}>No applications</td></tr>
          )}
        </tbody>
      </table>

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
                <button type="button" className="btn close" onClick={cleanupCrop}>Cancel</button>
                <button type="button" className="btn accept" onClick={confirmCrop}>Use Photo</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageTechnicians;
