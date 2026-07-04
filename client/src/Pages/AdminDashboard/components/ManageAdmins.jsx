import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  Crown,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./ManageAdmins.css";

const EMPTY_FORM = {
  full_name: "",
  email: "",
  password: "",
  phone_number: "",
};

const getInitial = (name, email) => {
  const source = name || email || "A";
  return String(source).charAt(0).toUpperCase();
};

const formatRole = (role) => {
  if (!role) return "admin";

  return String(role)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

export default function ManageAdmins() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [query, setQuery] = useState("");

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

  const fetchAdmins = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/admins");
      setAdmins(Array.isArray(data) ? data : []);
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401) {
        setMessage({
          type: "error",
          text: "Unauthorized. Please log in again.",
        });
      } else if (status === 403) {
        setMessage({
          type: "error",
          text: "Forbidden. You must be admin or super admin.",
        });
      } else {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || "Failed to load admins.",
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  useEffect(() => {
    return () => {
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc);
      }
    };
  }, [cropSrc]);

  const stats = useMemo(() => {
    const superAdmins = admins.filter((admin) => admin.role === "super_admin");
    const normalAdmins = admins.filter((admin) => admin.role !== "super_admin");
    const withPhotos = admins.filter((admin) => admin.profile_image_url).length;

    return {
      total: admins.length,
      superAdmins: superAdmins.length,
      normalAdmins: normalAdmins.length,
      withPhotos,
    };
  }, [admins]);

  const filteredAdmins = useMemo(() => {
    const searchText = query.trim().toLowerCase();

    if (!searchText) return admins;

    return admins.filter((admin) =>
      [admin.full_name, admin.email, admin.phone_number, admin.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText)),
    );
  }, [admins, query]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (message?.type === "error") {
      setMessage(null);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setImageDataUrl("");
  };

  const validateForm = (isCreate) => {
    if (!form.full_name.trim()) return "Please enter full name.";
    if (!form.email.trim()) return "Please enter email address.";

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!form.phone_number.trim()) return "Please enter phone number.";

    if (isCreate && !form.password.trim()) {
      return "Password is required for new admin.";
    }

    return null;
  };

  const buildPayload = (isCreate) => {
    const payload = {
      full_name: form.full_name.trim(),
      email: form.email.trim(),
      phone_number: form.phone_number.trim(),
    };

    if (isCreate) {
      payload.password = form.password;
    } else if (form.password) {
      payload.password = form.password;
    }

    if (imageDataUrl) {
      payload.profile_image_url = imageDataUrl;
    }

    return payload;
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage(null);

    const validationMessage = validateForm(true);

    if (validationMessage) {
      setMessage({
        type: "error",
        text: validationMessage,
      });
      return;
    }

    try {
      await api.post("/api/admin/admins", buildPayload(true));

      setMessage({
        type: "success",
        text: "Admin created successfully.",
      });

      resetForm();
      fetchAdmins();
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401) {
        setMessage({
          type: "error",
          text: "Unauthorized. Please log in again.",
        });
      } else if (status === 403) {
        setMessage({
          type: "error",
          text: "Forbidden. You must be admin or super admin.",
        });
      } else {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || "Error creating admin.",
        });
      }
    }
  };

  const handleUpdate = async (event) => {
    event.preventDefault();
    setMessage(null);

    const validationMessage = validateForm(false);

    if (validationMessage) {
      setMessage({
        type: "error",
        text: validationMessage,
      });
      return;
    }

    try {
      await api.put(`/api/admin/admins/${editingId}`, buildPayload(false));

      setMessage({
        type: "success",
        text: "Admin updated successfully.",
      });

      resetForm();
      fetchAdmins();
    } catch (error) {
      const status = error?.response?.status;

      if (status === 401) {
        setMessage({
          type: "error",
          text: "Unauthorized. Please log in again.",
        });
      } else if (status === 403) {
        setMessage({
          type: "error",
          text: "Forbidden.",
        });
      } else {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || "Error updating admin.",
        });
      }
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("Delete this admin? Only super admin can delete admins.")
    ) {
      return;
    }

    try {
      await api.delete(`/api/admin/admins/${id}`);

      setMessage({
        type: "success",
        text: "Admin deleted successfully.",
      });

      fetchAdmins();
    } catch (error) {
      const status = error?.response?.status;

      if (status === 403) {
        setMessage({
          type: "error",
          text: "Only Super Admin can delete admins.",
        });
      } else {
        setMessage({
          type: "error",
          text: error?.response?.data?.message || "Error deleting admin.",
        });
      }
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

    setImagePreview(admin.profile_image_url || "");
    setImageDataUrl("");
    setMessage(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const pickFile = () => {
    fileRef.current?.click();
  };

  const onPick = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type?.startsWith("image/")) {
      setMessage({
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
    const scaledW = imgMeta.current.w * base * z;
    const scaledH = imgMeta.current.h * base * z;

    const maxX = Math.max(0, (scaledW - size) / 2);
    const maxY = Math.max(0, (scaledH - size) / 2);

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

  function exportCroppedDataUrl(img, size = 256, startQuality = 0.8) {
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

    const dataUrl = exportCroppedDataUrl(img, 256, 0.8);

    setImageDataUrl(dataUrl);
    setImagePreview(dataUrl);
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
    <section className="fm-admin-admins">
      <div className="fm-admin-admins__header">
        <div>
          <span className="fm-admin-admins__eyebrow">Admin Management</span>

          <h1>Manage Admins</h1>

          <p>
            Create, update, and remove administrator accounts. Admin deletion is
            protected by backend permissions.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-admins__btn fm-admin-admins__btn--outline"
          onClick={fetchAdmins}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-admin-admins__summaryGrid">
        <article className="fm-admin-admins__summaryCard">
          <span>
            <Users size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total admins</p>
          </div>
        </article>

        <article className="fm-admin-admins__summaryCard">
          <span>
            <Crown size={17} />
          </span>
          <div>
            <strong>{stats.superAdmins}</strong>
            <p>Super admins</p>
          </div>
        </article>

        <article className="fm-admin-admins__summaryCard">
          <span>
            <ShieldCheck size={17} />
          </span>
          <div>
            <strong>{stats.normalAdmins}</strong>
            <p>Admins</p>
          </div>
        </article>

        <article className="fm-admin-admins__summaryCard">
          <span>
            <UserRound size={17} />
          </span>
          <div>
            <strong>{stats.withPhotos}</strong>
            <p>Profile photos</p>
          </div>
        </article>
      </div>

      {message?.text ? (
        <div
          className={`fm-admin-admins__notice fm-admin-admins__notice--${message.type}`}
          role="status"
          aria-live="polite">
          {message.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{message.text}</span>
        </div>
      ) : null}

      <form
        onSubmit={editingId ? handleUpdate : handleCreate}
        className="fm-admin-admins__card"
        autoComplete="off">
        <div className="fm-admin-admins__cardHeader">
          <div>
            <span>{editingId ? "Edit admin" : "New admin"}</span>
            <h2>
              {editingId ? "Update admin details" : "Create admin account"}
            </h2>
          </div>

          {editingId ? (
            <button
              type="button"
              className="fm-admin-admins__btn fm-admin-admins__btn--outline"
              onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>

        <input
          type="text"
          name="username"
          autoComplete="username"
          className="fm-admin-admins__hiddenInput"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="fm-admin-admins__hiddenInput"
        />

        <div className="fm-admin-admins__formLayout">
          <div className="fm-admin-admins__fields">
            <div className="fm-admin-admins__field">
              <label htmlFor="fm-admin-name">Full name *</label>
              <input
                id="fm-admin-name"
                type="text"
                name="full_name"
                placeholder="Full name"
                value={form.full_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="fm-admin-admins__field">
              <label htmlFor="fm-admin-email">Email *</label>
              <input
                id="fm-admin-email"
                type="email"
                name="email"
                inputMode="email"
                placeholder="email@example.com"
                value={form.email}
                onChange={handleChange}
                onBlur={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value.trim(),
                  }))
                }
                required
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                data-1p-ignore="true"
                data-lpignore="true"
                spellCheck={false}
              />

              {editingId ? (
                <div className="fm-admin-admins__hint">
                  Changing email updates the admin login address.
                </div>
              ) : null}
            </div>

            <div className="fm-admin-admins__fieldGrid">
              <div className="fm-admin-admins__field">
                <label htmlFor="fm-admin-password">
                  {editingId ? "New password" : "Password *"}
                </label>
                <input
                  id="fm-admin-password"
                  type="password"
                  name="password"
                  placeholder={
                    editingId
                      ? "Leave blank to keep current password"
                      : "Set a password"
                  }
                  value={form.password}
                  onChange={handleChange}
                  required={!editingId}
                  autoComplete="new-password"
                  data-1p-ignore="true"
                  data-lpignore="true"
                  spellCheck={false}
                />
              </div>

              <div className="fm-admin-admins__field">
                <label htmlFor="fm-admin-phone">Phone number *</label>
                <input
                  id="fm-admin-phone"
                  type="text"
                  name="phone_number"
                  placeholder="+94XXXXXXXXX"
                  value={form.phone_number}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="fm-admin-admins__actions">
              <button
                type="submit"
                className="fm-admin-admins__btn fm-admin-admins__btn--primary">
                <UserPlus size={16} />
                {editingId ? "Update Admin" : "Create Admin"}
              </button>
            </div>
          </div>

          <aside className="fm-admin-admins__photoPanel">
            <div className="fm-admin-admins__photoPreview">
              {imagePreview ? (
                <img src={imagePreview} alt="Selected admin profile" />
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

            <div className="fm-admin-admins__photoActions">
              <button
                type="button"
                className="fm-admin-admins__btn fm-admin-admins__btn--secondary"
                onClick={pickFile}>
                <Upload size={16} />
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </button>

              {imagePreview ? (
                <button
                  type="button"
                  className="fm-admin-admins__btn fm-admin-admins__btn--dangerLight"
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

      <section className="fm-admin-admins__card">
        <div className="fm-admin-admins__listHeader">
          <div>
            <span>Administrator records</span>
            <h2>Admin List</h2>
          </div>

          <label className="fm-admin-admins__search">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search admins"
            />
          </label>
        </div>

        <div className="fm-admin-admins__tableWrap">
          <table className="fm-admin-admins__table">
            <thead>
              <tr>
                <th>Admin</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>Role</th>
                <th className="fm-admin-admins__actionsCol">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredAdmins.map((admin) => (
                <tr key={admin._id}>
                  <td>
                    <div className="fm-admin-admins__identity">
                      {admin.profile_image_url ? (
                        <img
                          src={admin.profile_image_url}
                          alt={admin.full_name}
                        />
                      ) : (
                        <span>{getInitial(admin.full_name, admin.email)}</span>
                      )}

                      <div>
                        <strong>{admin.full_name || "Unnamed admin"}</strong>
                        <small>{admin._id}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="fm-admin-admins__cellIcon">
                      <Mail size={14} />
                      <span>{admin.email || "—"}</span>
                    </div>
                  </td>

                  <td>
                    <div className="fm-admin-admins__cellIcon">
                      <Phone size={14} />
                      <span>{admin.phone_number || "—"}</span>
                    </div>
                  </td>

                  <td>
                    <span
                      className={`fm-admin-admins__role ${
                        admin.role === "super_admin" ? "isSuper" : "isAdmin"
                      }`}>
                      {formatRole(admin.role)}
                    </span>
                  </td>

                  <td>
                    <div className="fm-admin-admins__rowActions">
                      <button
                        type="button"
                        onClick={() => startEdit(admin)}
                        className="fm-admin-admins__iconAction"
                        aria-label={`Edit ${admin.full_name || "admin"}`}>
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(admin._id)}
                        className="fm-admin-admins__iconAction fm-admin-admins__iconAction--danger"
                        aria-label={`Delete ${admin.full_name || "admin"}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredAdmins.length && !loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="fm-admin-admins__empty">
                      <ShieldCheck size={24} />
                      <strong>No admins found</strong>
                      <span>
                        {query
                          ? "Try a different search keyword."
                          : "Create an admin to show administrator records here."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {loading ? (
                <tr>
                  <td colSpan="5">
                    <div className="fm-admin-admins__empty">
                      <RefreshCw size={24} />
                      <strong>Loading admins</strong>
                      <span>
                        Please wait while administrator records are loaded.
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
          className="fm-admin-admins-crop"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true"
          aria-label="Crop admin profile photo">
          <div
            className="fm-admin-admins-crop__modal"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-admin-admins-crop__header">
              <div>
                <span>Profile image</span>
                <h2>Adjust Photo</h2>
              </div>

              <button
                type="button"
                className="fm-admin-admins__iconAction"
                onClick={cleanupCrop}
                aria-label="Close crop modal">
                <X size={16} />
              </button>
            </div>

            <div
              className="fm-admin-admins-crop__viewport"
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
                  className="fm-admin-admins-crop__image"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${
                      base * zoom
                    })`,
                  }}
                />
              ) : null}
            </div>

            <div className="fm-admin-admins-crop__controls">
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

              <div className="fm-admin-admins-crop__actions">
                <button
                  type="button"
                  className="fm-admin-admins__btn fm-admin-admins__btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="fm-admin-admins__btn fm-admin-admins__btn--primary"
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
