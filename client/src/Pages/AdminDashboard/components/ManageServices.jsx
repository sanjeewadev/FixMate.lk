import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/api";
import "./ManageServices.css";

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // view toggle
  const [hideInactive, setHideInactive] = useState(false);

  // form state
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "",
  });

  // preview + payload (base64) for service image
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  // ---- cropper (square)
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
  const imgMeta = useRef({ w: 0, h: 0 });

  // ---------- load ----------
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/services");
      setServices(res.data?.data || res.data || []);
    } catch (e) {
      setMsg(e?.response?.data?.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchServices();
  }, []);

  // ---------- form ----------
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "basePrice" ? value : value }));
  };

  const buildPayload = () => {
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
    };
    if (form.basePrice !== "") payload.basePrice = Number(form.basePrice);
    if (imageDataUrl) payload.imageUrls = imageDataUrl; // controller accepts 'imageUrls'
    return payload;
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", description: "", basePrice: "", category: "" });
    setImagePreview("");
    setImageDataUrl("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/admin/services/${editingId}`, buildPayload());
        setMsg("Service updated ✨");
      } else {
        await api.post("/api/admin/services", buildPayload());
        setMsg("Service created ");
      }
      resetForm();
      fetchServices();
    } catch (e2) {
      setMsg(e2?.response?.data?.message || "Error saving service");
    }
  };

  // ---------- actions ----------
  const startEdit = (s) => {
    setEditingId(s._id);
    setForm({
      name: s.name || "",
      description: s.description || "",
      basePrice: s.basePrice ?? "",
      category: s.category || "",
    });
    const existing = s?.serviceImages?.[0]?.url || "";
    setImagePreview(existing);
    setImageDataUrl("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Deactivate this service?")) return;
    try {
      await api.delete(`/api/admin/services/${id}`);
      setServices((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: false } : s)),
      );
      setMsg("Service deactivated ");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Error deactivating service");
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/api/admin/services/${id}/activate`);
      setServices((prev) =>
        prev.map((s) => (s._id === id ? { ...s, isActive: true } : s)),
      );
      setMsg("Service activated ");
    } catch (err) {
      // fallback PATCH
      try {
        await api.patch(`/api/admin/services/${id}`, { isActive: true });
        setServices((prev) =>
          prev.map((s) => (s._id === id ? { ...s, isActive: true } : s)),
        );
        setMsg("Service activated ");
      } catch (e2) {
        setMsg(e2?.response?.data?.message || "Error activating service");
      }
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm("⚠️ Permanently delete this service?")) return;
    try {
      await api.delete(`/api/admin/services/${id}?hard=true`);
      setServices((prev) => prev.filter((s) => s._id !== id));
      setMsg("Service permanently deleted 🗑️");
    } catch (e) {
      setMsg(e?.response?.data?.message || "Error deleting service");
    }
  };

  // ---------- image pick & crop (square) ----------
  const pickFile = () => fileRef.current?.click();
  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f || !f.type?.startsWith("image/")) return;
    const url = URL.createObjectURL(f);
    setCropSrc(url);
    setCropOpen(true);
    e.target.value = "";
  };
  const onPreviewLoad = (e) => {
    const img = e.currentTarget;
    imgMeta.current = { w: img.naturalWidth, h: img.naturalHeight };
    const S = 256;
    const fit = Math.max(S / img.naturalWidth, S / img.naturalHeight);
    setBase(fit);
    setZoom(1);
    setOffX(0);
    setOffY(0);
  };
  const clampPan = (x, y, z) => {
    const S = 256;
    const w = imgMeta.current.w * base * z;
    const h = imgMeta.current.h * base * z;
    const maxX = Math.max(0, (w - S) / 2);
    const maxY = Math.max(0, (h - S) / 2);
    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };
  const onDragStart = (e) => {
    e.preventDefault();
    const p = e.touches ? e.touches[0] : e;
    dragRef.current = {
      active: true,
      startX: p.clientX,
      startY: p.clientY,
      startOffX: offX,
      startOffY: offY,
    };
  };
  const onDragMove = (e) => {
    if (!dragRef.current.active) return;
    const p = e.touches ? e.touches[0] : e;
    const dx = p.clientX - dragRef.current.startX;
    const dy = p.clientY - dragRef.current.startY;
    const next = clampPan(
      dragRef.current.startOffX + dx,
      dragRef.current.startOffY + dy,
      zoom,
    );
    setOffX(next.x);
    setOffY(next.y);
  };
  const onDragEnd = () => (dragRef.current.active = false);

  function exportCroppedDataUrl(img, size = 256, startQ = 0.8) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    const scale = base * zoom;
    const w = img.naturalWidth * scale;
    const h = img.naturalHeight * scale;
    const dx = (size - w) / 2 + offX;
    const dy = (size - h) / 2 + offY;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, w, h);
    let q = startQ,
      out = canvas.toDataURL("image/jpeg", q);
    const maxBytes = 70 * 1024;
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
    await new Promise((r) => (img.onload = r));
    const data = exportCroppedDataUrl(img, 256, 0.85);
    setImageDataUrl(data);
    setImagePreview(data);
    setCropOpen(false);
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setMsg("Image ready. Remember to save ");
  };
  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropOpen(false);
  };

  const list = hideInactive ? services.filter((s) => s.isActive) : services;

  return (
    <div className="ms">
      {/* Header */}
      <div className="ms-header">
        <div className="ms-title">
          <h2>Manage Services</h2>
          <div className="ms-sub">
            Create, update, activate/deactivate, or delete services.
          </div>
        </div>
      </div>

      {msg && <div className="ms-alert ms-alert--info">{msg}</div>}

      {/* Form Card */}
      <form
        className="ms-card ms-form"
        onSubmit={handleSubmit}
        autoComplete="off">
        {/* hidden decoys for autofill sanity */}
        <input
          type="text"
          name="username"
          autoComplete="username"
          style={{ display: "none" }}
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          style={{ display: "none" }}
        />

        <div className="ms-form-grid">
          {/* Fields */}
          <div className="ms-fields">
            <div className="ms-cols-2">
              <div className="ms-field">
                <label>Service Name</label>
                <input
                  name="name"
                  type="text"
                  placeholder="e.g., AC Repair"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="ms-field">
                <label>Category</label>
                <input
                  name="category"
                  type="text"
                  placeholder="e.g., Electrical"
                  value={form.category}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="ms-cols-2">
              <div className="ms-field">
                <label>Base Price</label>
                <input
                  name="basePrice"
                  type="number"
                  min="0"
                  placeholder="e.g., 2500"
                  value={form.basePrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="ms-field">
              <label>Description</label>
              <textarea
                name="description"
                rows={4}
                placeholder="Short description…"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="ms-actions">
              <button type="submit" className="ms-btn ms-btn--primary">
                {editingId ? "Update Service" : "Create Service"}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="ms-btn ms-btn--outline"
                  onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Image side card */}
          <div className="ms-avatar-card">
            <div className="ms-thumb-wrap">
              {imagePreview ? (
                <img src={imagePreview} alt="Service" className="ms-thumb" />
              ) : (
                <div className="ms-thumb placeholder" />
              )}
            </div>
            <div className="ms-avatar-actions">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={onPick}
              />
              <button
                type="button"
                className="ms-btn ms-btn--secondary"
                onClick={pickFile}>
                {imagePreview ? "Change Image" : "Upload Image"}
              </button>
              {imagePreview && (
                <button
                  type="button"
                  className="ms-btn ms-btn--danger"
                  onClick={() => {
                    setImagePreview("");
                    setImageDataUrl("");
                  }}>
                  Remove Image
                </button>
              )}
              <div className="tiny muted">
                Square images recommended · JPG/PNG
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* List Card */}
      <div className="ms-card">
        <div className="ms-list-head">
          <h3>Service List</h3>
          <div className="ms-list-controls">
            <label className="tiny muted">
              <input
                type="checkbox"
                checked={hideInactive}
                onChange={(e) => setHideInactive(e.target.checked)}
              />
              <span>&nbsp;Hide inactive</span>
            </label>
            <button
              className="ms-btn ms-btn--outline"
              onClick={fetchServices}
              disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="ms-cards">
          {list.map((s) => {
            const img = s?.serviceImages?.[0]?.url || "";
            const inactive = !s.isActive;
            return (
              <div
                key={s._id}
                className={`ms-card-item ${inactive ? "inactive" : ""}`}>
                {img ? (
                  <img src={img} className="ms-card-thumb" alt={s.name} />
                ) : (
                  <div className="ms-card-thumb placeholder" />
                )}
                <h4>{s.name}</h4>
                <p className="muted">{s.category || "—"}</p>
                <p className="muted">
                  {s.basePrice != null ? `Rs. ${s.basePrice}` : "—"}
                </p>
                <p>Status: {inactive ? " Inactive" : " Active"}</p>
                <div className="ms-row-actions">
                  <button
                    className="ms-btn ms-btn--small ms-btn--primary"
                    onClick={() => startEdit(s)}>
                    Edit
                  </button>
                  {inactive ? (
                    <button
                      className="ms-btn ms-btn--small ms-btn--outline"
                      onClick={() => handleActivate(s._id)}>
                      Activate
                    </button>
                  ) : (
                    <button
                      className="ms-btn ms-btn--small ms-btn--warn"
                      onClick={() => handleSoftDelete(s._id)}>
                      Deactivate
                    </button>
                  )}
                  <button
                    className="ms-btn ms-btn--small ms-btn--danger"
                    onClick={() => handleHardDelete(s._id)}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {!list.length && !loading && (
            <div className="muted tiny" style={{ padding: "6px 2px" }}>
              No services
            </div>
          )}
        </div>
      </div>

      {/* Crop modal */}
      {cropOpen && (
        <div
          className="ms-crop-overlay"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true">
          <div className="ms-crop-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ms-crop-head">
              <h4>Adjust Image</h4>
              <button
                type="button"
                className="ms-btn ms-btn--danger ms-btn--small"
                onClick={cleanupCrop}>
                Close
              </button>
            </div>

            <div
              className={`ms-crop-viewport ${dragRef.current.active ? "dragging" : ""}`}
              onMouseDown={onDragStart}
              onMouseMove={onDragMove}
              onMouseUp={onDragEnd}
              onMouseLeave={onDragEnd}
              onTouchStart={onDragStart}
              onTouchMove={onDragMove}
              onTouchEnd={onDragEnd}>
              {cropSrc && (
                <img
                  src={cropSrc}
                  alt="Crop preview"
                  className="ms-crop-img"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${base * zoom})`,
                  }}
                />
              )}
            </div>

            <div className="ms-crop-controls">
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
              />
              <div className="ms-crop-actions">
                <button
                  type="button"
                  className="ms-btn ms-btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="ms-btn ms-btn--primary"
                  onClick={confirmCrop}>
                  Use Image
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
