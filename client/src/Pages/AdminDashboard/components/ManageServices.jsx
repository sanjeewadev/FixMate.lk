import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BadgeDollarSign,
  Check,
  ImagePlus,
  Layers3,
  PackageCheck,
  Pencil,
  Power,
  PowerOff,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./ManageServices.css";

const EMPTY_FORM = {
  name: "",
  description: "",
  basePrice: "",
  category: "",
};

const getServiceImage = (service) => {
  if (service?.serviceImages?.[0]?.url) return service.serviceImages[0].url;

  if (Array.isArray(service?.imageUrls)) {
    return service.imageUrls[0] || "";
  }

  return service?.imageUrls || "";
};

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "") return "—";
  return `Rs. ${Number(value).toLocaleString("en-LK")}`;
};

export default function ManageServices() {
  const [services, setServices] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [hideInactive, setHideInactive] = useState(false);
  const [query, setQuery] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);

  const [imagePreview, setImagePreview] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");

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

  const fetchServices = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/services");
      setServices(data?.data || data || []);
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to fetch services.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useEffect(() => {
    return () => {
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc);
      }
    };
  }, [cropSrc]);

  const stats = useMemo(() => {
    const active = services.filter((service) => service.isActive).length;
    const inactive = services.filter((service) => !service.isActive).length;
    const categories = new Set(
      services.map((service) => service.category).filter(Boolean),
    );

    return {
      total: services.length,
      active,
      inactive,
      categories: categories.size,
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    return services
      .filter((service) => (hideInactive ? service.isActive : true))
      .filter((service) => {
        if (!searchText) return true;

        return [service.name, service.category, service.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchText));
      });
  }, [hideInactive, query, services]);

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (msg?.type === "error") {
      setMsg(null);
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    updateField(name, value);
  };

  const buildPayload = () => {
    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category.trim(),
    };

    if (form.basePrice !== "") {
      payload.basePrice = Number(form.basePrice);
    }

    if (imageDataUrl) {
      payload.imageUrls = imageDataUrl;
      payload.replaceImages = editingId ? true : undefined;
    }

    return payload;
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setImageDataUrl("");
  };

  const validateForm = () => {
    if (!form.name.trim()) return "Please enter the service name.";

    if (form.basePrice !== "" && Number(form.basePrice) < 0) {
      return "Base price cannot be negative.";
    }

    return null;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMsg(null);

    const validationMessage = validateForm();

    if (validationMessage) {
      setMsg({
        type: "error",
        text: validationMessage,
      });
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/admin/services/${editingId}`, buildPayload());

        setMsg({
          type: "success",
          text: "Service updated successfully.",
        });
      } else {
        await api.post("/api/admin/services", buildPayload());

        setMsg({
          type: "success",
          text: "Service created successfully.",
        });
      }

      resetForm();
      fetchServices();
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error saving service.",
      });
    }
  };

  const startEdit = (service) => {
    setEditingId(service._id);

    setForm({
      name: service.name || "",
      description: service.description || "",
      basePrice: service.basePrice ?? "",
      category: service.category || "",
    });

    setImagePreview(getServiceImage(service));
    setImageDataUrl("");
    setMsg(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSoftDelete = async (id) => {
    if (!window.confirm("Deactivate this service?")) return;

    try {
      await api.delete(`/api/admin/services/${id}`);

      setServices((current) =>
        current.map((service) =>
          service._id === id ? { ...service, isActive: false } : service,
        ),
      );

      setMsg({
        type: "success",
        text: "Service deactivated successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error deactivating service.",
      });
    }
  };

  const handleActivate = async (id) => {
    try {
      await api.patch(`/api/admin/services/${id}/activate`);

      setServices((current) =>
        current.map((service) =>
          service._id === id ? { ...service, isActive: true } : service,
        ),
      );

      setMsg({
        type: "success",
        text: "Service activated successfully.",
      });
    } catch {
      try {
        await api.patch(`/api/admin/services/${id}`, { isActive: true });

        setServices((current) =>
          current.map((service) =>
            service._id === id ? { ...service, isActive: true } : service,
          ),
        );

        setMsg({
          type: "success",
          text: "Service activated successfully.",
        });
      } catch (error) {
        setMsg({
          type: "error",
          text: error?.response?.data?.message || "Error activating service.",
        });
      }
    }
  };

  const handleHardDelete = async (id) => {
    if (!window.confirm("Permanently delete this service?")) return;

    try {
      await api.delete(`/api/admin/services/${id}?hard=true`);

      setServices((current) => current.filter((service) => service._id !== id));

      setMsg({
        type: "success",
        text: "Service permanently deleted.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error deleting service.",
      });
    }
  };

  const pickFile = () => {
    fileRef.current?.click();
  };

  const onPick = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type?.startsWith("image/")) {
      setMsg({
        type: "error",
        text: "Please select a valid image file.",
      });
      return;
    }

    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }

    const url = URL.createObjectURL(selectedFile);
    setCropSrc(url);
    setCropOpen(true);
    event.target.value = "";
  };

  const onPreviewLoad = (event) => {
    const img = event.currentTarget;

    imgMeta.current = {
      w: img.naturalWidth,
      h: img.naturalHeight,
    };

    const size = 256;
    const fit = Math.max(size / img.naturalWidth, size / img.naturalHeight);

    setBase(fit);
    setZoom(1);
    setOffX(0);
    setOffY(0);
  };

  const clampPan = (x, y, z) => {
    const size = 256;
    const w = imgMeta.current.w * base * z;
    const h = imgMeta.current.h * base * z;

    const maxX = Math.max(0, (w - size) / 2);
    const maxY = Math.max(0, (h - size) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  };

  const onDragStart = (event) => {
    event.preventDefault();

    const point = event.touches ? event.touches[0] : event;

    dragRef.current = {
      active: true,
      startX: point.clientX,
      startY: point.clientY,
      startOffX: offX,
      startOffY: offY,
    };
  };

  const onDragMove = (event) => {
    if (!dragRef.current.active) return;

    const point = event.touches ? event.touches[0] : event;
    const dx = point.clientX - dragRef.current.startX;
    const dy = point.clientY - dragRef.current.startY;

    const next = clampPan(
      dragRef.current.startOffX + dx,
      dragRef.current.startOffY + dy,
      zoom,
    );

    setOffX(next.x);
    setOffY(next.y);
  };

  const onDragEnd = () => {
    dragRef.current.active = false;
  };

  function exportCroppedDataUrl(img, size = 256, startQuality = 0.85) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    const scale = base * zoom;
    const width = img.naturalWidth * scale;
    const height = img.naturalHeight * scale;
    const dx = (size - width) / 2 + offX;
    const dy = (size - height) / 2 + offY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, width, height);

    let quality = startQuality;
    let output = canvas.toDataURL("image/jpeg", quality);
    const maxBytes = 70 * 1024;

    while (output.length * 0.75 > maxBytes && quality > 0.5) {
      quality -= 0.1;
      output = canvas.toDataURL("image/jpeg", quality);
    }

    return output;
  }

  const confirmCrop = async () => {
    if (!cropSrc) return;

    const img = new Image();
    img.src = cropSrc;

    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const data = exportCroppedDataUrl(img, 256, 0.85);

    setImageDataUrl(data);
    setImagePreview(data);
    setCropOpen(false);

    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);

    setMsg({
      type: "info",
      text: "Image ready. Save the service to apply it.",
    });
  };

  const cleanupCrop = () => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }

    setCropSrc(null);
    setCropOpen(false);
  };

  return (
    <section className="fm-admin-services">
      <div className="fm-admin-services__header">
        <div>
          <span className="fm-admin-services__eyebrow">Service Management</span>

          <h1>Manage Services</h1>

          <p>
            Create, update, activate, deactivate, and maintain service
            categories shown to customers.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-services__btn fm-admin-services__btn--outline"
          onClick={fetchServices}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-admin-services__summaryGrid">
        <article className="fm-admin-services__summaryCard">
          <span>
            <PackageCheck size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total services</p>
          </div>
        </article>

        <article className="fm-admin-services__summaryCard">
          <span>
            <Power size={17} />
          </span>
          <div>
            <strong>{stats.active}</strong>
            <p>Active services</p>
          </div>
        </article>

        <article className="fm-admin-services__summaryCard">
          <span>
            <PowerOff size={17} />
          </span>
          <div>
            <strong>{stats.inactive}</strong>
            <p>Inactive services</p>
          </div>
        </article>

        <article className="fm-admin-services__summaryCard">
          <span>
            <Layers3 size={17} />
          </span>
          <div>
            <strong>{stats.categories}</strong>
            <p>Categories</p>
          </div>
        </article>
      </div>

      {msg?.text ? (
        <div
          className={`fm-admin-services__notice fm-admin-services__notice--${msg.type}`}
          role="status"
          aria-live="polite">
          {msg.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <form
        className="fm-admin-services__card"
        onSubmit={handleSubmit}
        autoComplete="off">
        <div className="fm-admin-services__cardHeader">
          <div>
            <span>{editingId ? "Edit service" : "New service"}</span>
            <h2>{editingId ? "Update service details" : "Create service"}</h2>
          </div>

          {editingId ? (
            <button
              type="button"
              className="fm-admin-services__btn fm-admin-services__btn--outline"
              onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>

        <input
          type="text"
          name="username"
          autoComplete="username"
          className="fm-admin-services__hiddenInput"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="fm-admin-services__hiddenInput"
        />

        <div className="fm-admin-services__formLayout">
          <div className="fm-admin-services__fields">
            <div className="fm-admin-services__fieldGrid">
              <div className="fm-admin-services__field">
                <label htmlFor="fm-service-name">Service name *</label>
                <input
                  id="fm-service-name"
                  name="name"
                  type="text"
                  placeholder="e.g., AC Repair"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="fm-admin-services__field">
                <label htmlFor="fm-service-category">Category</label>
                <input
                  id="fm-service-category"
                  name="category"
                  type="text"
                  placeholder="e.g., Electrical"
                  value={form.category}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="fm-admin-services__fieldGrid fm-admin-services__fieldGrid--single">
              <div className="fm-admin-services__field">
                <label htmlFor="fm-service-price">Base price</label>
                <input
                  id="fm-service-price"
                  name="basePrice"
                  type="number"
                  min="0"
                  placeholder="e.g., 2500"
                  value={form.basePrice}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="fm-admin-services__field">
              <label htmlFor="fm-service-description">Description</label>
              <textarea
                id="fm-service-description"
                name="description"
                rows={4}
                placeholder="Short service description"
                value={form.description}
                onChange={handleChange}
              />
            </div>

            <div className="fm-admin-services__actions">
              <button
                type="submit"
                className="fm-admin-services__btn fm-admin-services__btn--primary">
                <PackageCheck size={16} />
                {editingId ? "Update Service" : "Create Service"}
              </button>
            </div>
          </div>

          <aside className="fm-admin-services__imagePanel">
            <div className="fm-admin-services__imagePreview">
              {imagePreview ? (
                <img src={imagePreview} alt="Selected service" />
              ) : (
                <ImagePlus size={44} />
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPick}
            />

            <div className="fm-admin-services__imageActions">
              <button
                type="button"
                className="fm-admin-services__btn fm-admin-services__btn--secondary"
                onClick={pickFile}>
                <Upload size={16} />
                {imagePreview ? "Change Image" : "Upload Image"}
              </button>

              {imagePreview ? (
                <button
                  type="button"
                  className="fm-admin-services__btn fm-admin-services__btn--dangerLight"
                  onClick={() => {
                    setImagePreview("");
                    setImageDataUrl("");
                  }}>
                  Remove
                </button>
              ) : null}
            </div>

            <p>Square service images are recommended. JPG or PNG supported.</p>
          </aside>
        </div>
      </form>

      <section className="fm-admin-services__card">
        <div className="fm-admin-services__listHeader">
          <div>
            <span>Service records</span>
            <h2>Service List</h2>
          </div>

          <div className="fm-admin-services__tools">
            <label className="fm-admin-services__checkbox">
              <input
                type="checkbox"
                checked={hideInactive}
                onChange={(event) => setHideInactive(event.target.checked)}
              />
              <span>Hide inactive</span>
            </label>

            <label className="fm-admin-services__search">
              <Search size={16} />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search services"
              />
            </label>
          </div>
        </div>

        <div className="fm-admin-services__grid">
          {filteredServices.map((service) => {
            const image = getServiceImage(service);
            const inactive = !service.isActive;

            return (
              <article
                key={service._id}
                className={`fm-admin-services__serviceCard ${
                  inactive ? "isInactive" : ""
                }`}>
                <div className="fm-admin-services__serviceImage">
                  {image ? (
                    <img src={image} alt={service.name} />
                  ) : (
                    <ImagePlus size={28} />
                  )}
                </div>

                <div className="fm-admin-services__serviceBody">
                  <div className="fm-admin-services__serviceTitleRow">
                    <h3>{service.name || "Unnamed service"}</h3>

                    <span
                      className={`fm-admin-services__status ${
                        inactive ? "isInactive" : ""
                      }`}>
                      {inactive ? "Inactive" : "Active"}
                    </span>
                  </div>

                  <p>{service.description || "No description added."}</p>

                  <div className="fm-admin-services__metaGrid">
                    <div>
                      <Layers3 size={14} />
                      <span>{service.category || "No category"}</span>
                    </div>

                    <div>
                      <BadgeDollarSign size={14} />
                      <span>{formatPrice(service.basePrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="fm-admin-services__rowActions">
                  <button
                    type="button"
                    className="fm-admin-services__iconAction"
                    onClick={() => startEdit(service)}
                    aria-label={`Edit ${service.name || "service"}`}>
                    <Pencil size={15} />
                  </button>

                  {inactive ? (
                    <button
                      type="button"
                      className="fm-admin-services__iconAction"
                      onClick={() => handleActivate(service._id)}
                      aria-label={`Activate ${service.name || "service"}`}>
                      <Power size={15} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="fm-admin-services__iconAction"
                      onClick={() => handleSoftDelete(service._id)}
                      aria-label={`Deactivate ${service.name || "service"}`}>
                      <PowerOff size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    className="fm-admin-services__iconAction fm-admin-services__iconAction--danger"
                    onClick={() => handleHardDelete(service._id)}
                    aria-label={`Delete ${service.name || "service"}`}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </article>
            );
          })}

          {!filteredServices.length && !loading ? (
            <div className="fm-admin-services__empty">
              <PackageCheck size={24} />
              <strong>No services found</strong>
              <span>
                {query
                  ? "Try a different search keyword."
                  : "Create a service to show it here."}
              </span>
            </div>
          ) : null}

          {loading ? (
            <div className="fm-admin-services__empty">
              <RefreshCw size={24} />
              <strong>Loading services</strong>
              <span>Please wait while service records are loaded.</span>
            </div>
          ) : null}
        </div>
      </section>

      {cropOpen ? (
        <div
          className="fm-admin-services-crop"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true"
          aria-label="Crop service image">
          <div
            className="fm-admin-services-crop__modal"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-admin-services-crop__header">
              <div>
                <span>Service image</span>
                <h2>Adjust Image</h2>
              </div>

              <button
                type="button"
                className="fm-admin-services__iconAction"
                onClick={cleanupCrop}
                aria-label="Close crop modal">
                <X size={16} />
              </button>
            </div>

            <div
              className="fm-admin-services-crop__viewport"
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
                  className="fm-admin-services-crop__image"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${
                      base * zoom
                    })`,
                  }}
                />
              ) : null}
            </div>

            <div className="fm-admin-services-crop__controls">
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

              <div className="fm-admin-services-crop__actions">
                <button
                  type="button"
                  className="fm-admin-services__btn fm-admin-services__btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="fm-admin-services__btn fm-admin-services__btn--primary"
                  onClick={confirmCrop}>
                  Use Image
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
