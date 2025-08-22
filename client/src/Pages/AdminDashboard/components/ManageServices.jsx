// src/Pages/AdminDashboard/components/ManageServices.jsx
import React, { useEffect, useRef, useState } from "react";
import api from "../../../lib/api";
import "./ManageServices.css";

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    basePrice: "",
    category: "",
  });

  // crop & preview (sends base64 as JSON)
  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // UI filter: hide inactive in view (admin can toggle)
  const [hideInactive, setHideInactive] = useState(false);

  // ====== cropper state ======
  const fileRef = useRef(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropSrc, setCropSrc] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [base, setBase] = useState(1);
  const [offX, setOffX] = useState(0);
  const [offY, setOffY] = useState(0);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startOffX: 0, startOffY: 0 });
  const imgMeta = useRef({ w: 0, h: 0 });

  // ====== fetch ALL services (admin view) ======
  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/admin/services");
      setServices(res.data?.data || res.data || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to fetch services");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchServices(); }, []);

  // ====== form handlers ======
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: name === "basePrice" ? value : value }));
  };

  // ====== pick & crop image (circle) ======
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
    const square = 256;
    const fit = Math.max(square / img.naturalWidth, square / img.naturalHeight);
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
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext("2d");

    const scale = base * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (size - drawW) / 2 + offX;
    const dy = (size - drawH) / 2 + offY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, drawW, drawH);

    // ~60KB cap
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
    cleanupCrop();
    setMessage("Image ready. Remember to save ✅");
  };

  const cleanupCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCropOpen(false);
  };

  // Build JSON payload (sends base64 in imageUrls for controller compatibility)
  const buildPayload = () => {
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
    };
    if (form.basePrice !== "") payload.basePrice = Number(form.basePrice);
    if (imageDataUrl) {
      payload.imageUrls = imageDataUrl; // controller already supports 'imageUrls'
    }
    return payload;
  };

  // ====== create / update ======
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/admin/services", buildPayload());
      setMessage("Service created ✅");
      resetForm();
      fetchServices();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error creating service");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/admin/services/${editingId}`, buildPayload());
      setMessage("Service updated ✨");
      resetForm();
      fetchServices();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error updating service");
    }
  };

  // ====== soft deactivate / reactivate / hard delete ======
  const handleSoftDelete = async (id) => {
    if (!window.confirm("Deactivate this service?")) return;
    try {
      await api.delete(`/api/admin/services/${id}`);
      // Update local state immediately for button flip UX
      setServices((prev) => prev.map(s => s._id === id ? { ...s, isActive: false } : s));
      setMessage("Service deactivated ❌");
    } catch (err) {
      if (err?.response?.status === 401) setMessage("Unauthorized. Please log in again as admin.");
      else setMessage(err?.response?.data?.message || "Error deactivating service");
    }
  };

  const handleActivate = async (id) => {
    try {
      // Try explicit activate endpoint first
      await api.patch(`/api/admin/services/${id}/activate`);
      setServices((prev) => prev.map(s => s._id === id ? { ...s, isActive: true } : s));
      setMessage("Service activated ✅");
    } catch (err) {
      // Fallback: generic PATCH (some setups)
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        try {
          await api.patch(`/api/admin/services/${id}`, { isActive: true });
          setServices((prev) => prev.map(s => s._id === id ? { ...s, isActive: true } : s));
          setMessage("Service activated ✅");
          return;
        } catch (e2) {
          setMessage(e2?.response?.data?.message || "Error activating service");
          return;
        }
      }
      setMessage(err?.response?.data?.message || "Error activating service");
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm("⚠️ Permanently delete this service? This cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/services/${id}?hard=true`);
      setServices((prev) => prev.filter(s => s._id !== id));
      setMessage("Service permanently deleted 🗑️");
    } catch (err) {
      if (err?.response?.status === 401) setMessage("Unauthorized. Please log in again as admin.");
      else setMessage(err?.response?.data?.message || "Error deleting service");
    }
  };

  // ====== edit / reset ======
  const startEdit = (service) => {
    setEditingId(service._id);
    setForm({
      name: service.name || "",
      description: service.description || "",
      basePrice: service.basePrice ?? "",
      category: service.category || "",
    });
    const existingUrl = service?.serviceImages?.[0]?.url || "";
    setImagePreview(existingUrl);
    setImageDataUrl("");
  };

  const resetForm = () => {
    setEditingId(null);
    setForm({ name: "", description: "", basePrice: "", category: "" });
    setImagePreview("");
    setImageDataUrl("");
  };

  const list = hideInactive ? services.filter(s => s.isActive) : services;

  return (
    <div className="manage-services">
      <h2>Manage Services</h2>
      {message && <p className="msg">{message}</p>}

      {/* View toggle */}
      <div className="list-filter">
        <label>
          <input
            type="checkbox"
            checked={hideInactive}
            onChange={(e) => setHideInactive(e.target.checked)}
          />
          &nbsp;Hide inactive
        </label>
      </div>

      {/* Form */}
      <form onSubmit={editingId ? handleUpdate : handleCreate} className="service-form" autoComplete="off">
        <div className="avatar-block">
          <img
            src={imagePreview || "/default-service.png"}
            alt="Service"
            className="service-thumb large"
          />
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />
        <button type="button" className="btn" onClick={pickFile}>
          {imagePreview ? "Change Image" : "Upload Image"}
        </button>

        <input
          type="text"
          name="name"
          placeholder="Service Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="category"
          placeholder="Category"
          value={form.category}
          onChange={handleChange}
        />
        <input
          type="number"
          name="basePrice"
          placeholder="Base Price"
          value={form.basePrice}
          onChange={handleChange}
        />
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          rows={4}
        />

        <button type="submit" className="btn">
          {editingId ? "Update Service" : "Create Service"}
        </button>
        {editingId && (
          <button type="button" className="btn cancel" onClick={resetForm}>
            Cancel
          </button>
        )}
      </form>

      {/* Service List */}
      <h3>Service List</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="service-cards">
          {list.map((s) => {
            const img = s?.serviceImages?.[0]?.url || "";
            const inactive = !s.isActive;
            return (
              <div key={s._id} className={`service-card ${inactive ? "inactive" : ""}`}>
                {img ? (
                  <img src={img} alt={s.name} className="thumbnail" />
                ) : (
                  <div className="thumbnail placeholder" />
                )}
                <h4>{s.name}</h4>
                <p>{s.category}</p>
                <p>${s.basePrice}</p>
                <p>Status: {inactive ? "❌ Inactive" : "✅ Active"}</p>
                <div className="actions">
                  <button onClick={() => startEdit(s)} className="btn small">Edit</button>

                  {inactive ? (
                    <button onClick={() => handleActivate(s._id)} className="btn small">
                      Activate
                    </button>
                  ) : (
                    <button onClick={() => handleSoftDelete(s._id)} className="btn small warn">
                      Deactivate
                    </button>
                  )}

                  <button onClick={() => handleHardDelete(s._id)} className="btn small danger">
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
          {list.length === 0 && <p style={{ color: "#64748b" }}>No services</p>}
        </div>
      )}

      {/* Crop modal */}
      {cropOpen && (
        <div className="crop-overlay" onClick={cleanupCrop} role="dialog" aria-modal="true">
          <div className="crop-modal" onClick={(e) => e.stopPropagation()}>
            <h4>Adjust image</h4>

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
                <button type="button" className="btn" onClick={confirmCrop}>Use Image</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
