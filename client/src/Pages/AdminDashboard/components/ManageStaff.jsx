import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BriefcaseBusiness,
  Check,
  Mail,
  MapPin,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./ManageStaff.css";

const DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];

const EMPTY_FORM = {
  full_name: "",
  email: "",
  password: "",
  phone_number: "",
  address: "",
  district: "",
};

const getInitial = (name, email) => {
  const source = name || email || "S";
  return String(source).charAt(0).toUpperCase();
};

export default function ManageStaff() {
  const [rows, setRows] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
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

  const fetchRows = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/coordinators");
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to load staff.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    return () => {
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc);
      }
    };
  }, [cropSrc]);

  const stats = useMemo(() => {
    const districts = new Set(rows.map((row) => row.district).filter(Boolean));
    const withPhotos = rows.filter(
      (row) => row.profile_image_url || row.profile_image?.url,
    ).length;

    return {
      total: rows.length,
      districts: districts.size,
      withPhotos,
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    if (!searchText) return rows;

    return rows.filter((row) =>
      [row.full_name, row.email, row.phone_number, row.address, row.district]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText)),
    );
  }, [query, rows]);

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

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setImageDataUrl("");
  };

  const validateForm = () => {
    const required = [
      "full_name",
      "email",
      "phone_number",
      "address",
      "district",
      ...(editingId ? [] : ["password"]),
    ];

    const missing = required.filter((key) => !String(form[key] || "").trim());

    if (missing.length) {
      return "Please complete all required fields.";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    return null;
  };

  const buildPayload = (isCreate) => ({
    full_name: form.full_name.trim(),
    email: form.email.trim(),
    phone_number: form.phone_number.trim(),
    address: form.address.trim(),
    district: form.district,
    ...(isCreate
      ? { password: form.password }
      : form.password
        ? { password: form.password }
        : {}),
    ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
  });

  async function onSubmit(event) {
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
        await api.put(
          `/api/admin/coordinators/${editingId}`,
          buildPayload(false),
        );

        setMsg({
          type: "success",
          text: "Coordinator updated successfully.",
        });
      } else {
        await api.post("/api/admin/coordinators", buildPayload(true));

        setMsg({
          type: "success",
          text: "Coordinator created successfully.",
        });
      }

      resetForm();
      fetchRows();
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Save failed.",
      });
    }
  }

  async function onDelete(id) {
    if (!window.confirm("Delete this coordinator?")) return;

    try {
      await api.delete(`/api/admin/coordinators/${id}`);
      fetchRows();

      setMsg({
        type: "success",
        text: "Coordinator deleted successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Delete failed.",
      });
    }
  }

  function startEdit(row) {
    setEditingId(row._id);

    setForm({
      full_name: row.full_name || "",
      email: row.email || "",
      password: "",
      phone_number: row.phone_number || "",
      address: row.address || "",
      district: row.district || "",
    });

    const image = row.profile_image_url || row.profile_image?.url || "";

    setImagePreview(image);
    setImageDataUrl("");
    setMsg(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

  function clampPan(x, y, z) {
    const size = 256;
    const width = imgMeta.current.w * base * z;
    const height = imgMeta.current.h * base * z;

    const maxX = Math.max(0, (width - size) / 2);
    const maxY = Math.max(0, (height - size) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }

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

  useEffect(() => {
    if (!cropSrc) return;

    const next = clampPan(offX, offY, zoom);

    if (next.x !== offX) setOffX(next.x);
    if (next.y !== offY) setOffY(next.y);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, base, cropSrc]);

  function exportCropped(img, size = 256, startQuality = 0.8) {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d");

    const scale = base * zoom;
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const dx = (size - drawW) / 2 + offX;
    const dy = (size - drawH) / 2 + offY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, drawW, drawH);

    let quality = startQuality;
    let output = canvas.toDataURL("image/jpeg", quality);
    const maxBytes = 80 * 1024;

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

    const data = exportCropped(img, 256, 0.8);

    setImageDataUrl(data);
    setImagePreview(data);
    cleanupCrop();
  };

  const cleanupCrop = () => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }

    setCropSrc(null);
    setCropOpen(false);
  };

  return (
    <section className="fm-admin-staff">
      <div className="fm-admin-staff__header">
        <div>
          <span className="fm-admin-staff__eyebrow">Staff Management</span>

          <h1>Manage Staff</h1>

          <p>
            Create, update, and remove coordinator accounts used for service
            operations and request handling.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-staff__btn fm-admin-staff__btn--outline"
          onClick={fetchRows}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-admin-staff__summaryGrid">
        <article className="fm-admin-staff__summaryCard">
          <span>
            <Users size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total staff</p>
          </div>
        </article>

        <article className="fm-admin-staff__summaryCard">
          <span>
            <MapPin size={17} />
          </span>
          <div>
            <strong>{stats.districts}</strong>
            <p>Districts covered</p>
          </div>
        </article>

        <article className="fm-admin-staff__summaryCard">
          <span>
            <BriefcaseBusiness size={17} />
          </span>
          <div>
            <strong>{stats.withPhotos}</strong>
            <p>Profile photos</p>
          </div>
        </article>
      </div>

      {msg?.text ? (
        <div
          className={`fm-admin-staff__notice fm-admin-staff__notice--${msg.type}`}
          role="status"
          aria-live="polite">
          {msg.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <form
        className="fm-admin-staff__card"
        onSubmit={onSubmit}
        autoComplete="off">
        <div className="fm-admin-staff__cardHeader">
          <div>
            <span>{editingId ? "Edit coordinator" : "New coordinator"}</span>
            <h2>
              {editingId ? "Update staff details" : "Create staff account"}
            </h2>
          </div>

          {editingId ? (
            <button
              type="button"
              className="fm-admin-staff__btn fm-admin-staff__btn--outline"
              onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>

        <input
          type="text"
          name="username"
          autoComplete="username"
          className="fm-admin-staff__hiddenInput"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="fm-admin-staff__hiddenInput"
        />

        <div className="fm-admin-staff__formLayout">
          <div className="fm-admin-staff__fields">
            <div className="fm-admin-staff__field">
              <label htmlFor="fm-staff-full-name">Full name *</label>
              <input
                id="fm-staff-full-name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
            </div>

            <div className="fm-admin-staff__field">
              <label htmlFor="fm-staff-email">Email *</label>
              <input
                id="fm-staff-email"
                name="email"
                type="email"
                inputMode="email"
                value={form.email}
                onChange={handleChange}
                onBlur={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value.trim(),
                  }))
                }
                placeholder="email@example.com"
                required
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                data-1p-ignore="true"
                data-lpignore="true"
              />

              {editingId ? (
                <div className="fm-admin-staff__hint">
                  Changing email updates login for this staff member.
                </div>
              ) : null}
            </div>

            <div className="fm-admin-staff__fieldGrid">
              <div className="fm-admin-staff__field">
                <label htmlFor="fm-staff-password">
                  {editingId ? "New password" : "Password *"}
                </label>
                <input
                  id="fm-staff-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editingId
                      ? "Leave blank to keep current password"
                      : "Set a password"
                  }
                  required={!editingId}
                  autoComplete="new-password"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
              </div>

              <div className="fm-admin-staff__field">
                <label htmlFor="fm-staff-phone">Phone number *</label>
                <input
                  id="fm-staff-phone"
                  name="phone_number"
                  type="text"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+94XXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div className="fm-admin-staff__fieldGrid">
              <div className="fm-admin-staff__field">
                <label htmlFor="fm-staff-address">Address *</label>
                <input
                  id="fm-staff-address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, city"
                  required
                />
              </div>

              <div className="fm-admin-staff__field">
                <label htmlFor="fm-staff-district">District *</label>
                <select
                  id="fm-staff-district"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  required>
                  <option value="">Select district</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fm-admin-staff__actions">
              <button
                type="submit"
                className="fm-admin-staff__btn fm-admin-staff__btn--primary">
                <UserPlus size={16} />
                {editingId ? "Update Coordinator" : "Add Coordinator"}
              </button>
            </div>
          </div>

          <aside className="fm-admin-staff__photoPanel">
            <div className="fm-admin-staff__photoPreview">
              {imagePreview ? (
                <img src={imagePreview} alt="Selected staff profile" />
              ) : (
                <UserRound size={44} />
              )}
            </div>

            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onPick}
            />

            <div className="fm-admin-staff__photoActions">
              <button
                type="button"
                className="fm-admin-staff__btn fm-admin-staff__btn--secondary"
                onClick={pickFile}>
                <Upload size={16} />
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </button>

              {imagePreview ? (
                <button
                  type="button"
                  className="fm-admin-staff__btn fm-admin-staff__btn--dangerLight"
                  onClick={() => {
                    setImagePreview("");
                    setImageDataUrl("");
                  }}>
                  Remove
                </button>
              ) : null}
            </div>

            <p>
              Profile photo is optional. Square JPG or PNG images work best.
            </p>
          </aside>
        </div>
      </form>

      <section className="fm-admin-staff__card">
        <div className="fm-admin-staff__listHeader">
          <div>
            <span>Coordinator records</span>
            <h2>Staff List</h2>
          </div>

          <label className="fm-admin-staff__search">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search staff"
            />
          </label>
        </div>

        <div className="fm-admin-staff__tableWrap">
          <table className="fm-admin-staff__table">
            <thead>
              <tr>
                <th>Staff member</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>District</th>
                <th>Address</th>
                <th className="fm-admin-staff__actionsCol">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRows.map((row) => {
                const image =
                  row.profile_image_url || row.profile_image?.url || "";

                return (
                  <tr key={row._id}>
                    <td>
                      <div className="fm-admin-staff__identity">
                        {image ? (
                          <img src={image} alt={row.full_name} />
                        ) : (
                          <span>{getInitial(row.full_name, row.email)}</span>
                        )}

                        <div>
                          <strong>{row.full_name || "Unnamed staff"}</strong>
                          <small>{row._id}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div className="fm-admin-staff__cellIcon">
                        <Mail size={14} />
                        <span>{row.email || "—"}</span>
                      </div>
                    </td>

                    <td>
                      <div className="fm-admin-staff__cellIcon">
                        <Phone size={14} />
                        <span>{row.phone_number || "—"}</span>
                      </div>
                    </td>

                    <td>{row.district || "—"}</td>
                    <td className="fm-admin-staff__clip">
                      {row.address || "—"}
                    </td>

                    <td>
                      <div className="fm-admin-staff__rowActions">
                        <button
                          type="button"
                          className="fm-admin-staff__iconAction"
                          onClick={() => startEdit(row)}
                          aria-label={`Edit ${row.full_name || "staff"}`}>
                          <Pencil size={15} />
                        </button>

                        <button
                          type="button"
                          className="fm-admin-staff__iconAction fm-admin-staff__iconAction--danger"
                          onClick={() => onDelete(row._id)}
                          aria-label={`Delete ${row.full_name || "staff"}`}>
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!filteredRows.length && !loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="fm-admin-staff__empty">
                      <BriefcaseBusiness size={24} />
                      <strong>No staff found</strong>
                      <span>
                        {query
                          ? "Try a different search keyword."
                          : "Create a coordinator to show staff records here."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="fm-admin-staff__empty">
                      <RefreshCw size={24} />
                      <strong>Loading staff</strong>
                      <span>
                        Please wait while coordinator records are loaded.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {cropOpen ? (
        <div
          className="fm-admin-staff-crop"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true"
          aria-label="Crop staff profile photo">
          <div
            className="fm-admin-staff-crop__modal"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-admin-staff-crop__header">
              <div>
                <span>Profile image</span>
                <h2>Adjust Photo</h2>
              </div>

              <button
                type="button"
                className="fm-admin-staff__iconAction"
                onClick={cleanupCrop}
                aria-label="Close crop modal">
                <X size={16} />
              </button>
            </div>

            <div
              className="fm-admin-staff-crop__viewport"
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
                  className="fm-admin-staff-crop__image"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${
                      base * zoom
                    })`,
                  }}
                />
              ) : null}
            </div>

            <div className="fm-admin-staff-crop__controls">
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

              <div className="fm-admin-staff-crop__actions">
                <button
                  type="button"
                  className="fm-admin-staff__btn fm-admin-staff__btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="fm-admin-staff__btn fm-admin-staff__btn--primary"
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
