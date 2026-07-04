import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  ImagePlus,
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
import "./ManageUsers.css";

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
  phone_number: "",
  address: "",
  district: "",
  password: "",
};

const getInitial = (name, email) => {
  const source = name || email || "U";
  return String(source).charAt(0).toUpperCase();
};

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);
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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/customers");
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to load users.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    return () => {
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc);
      }
    };
  }, [cropSrc]);

  const filteredUsers = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) return users;

    return users.filter((user) => {
      return [
        user.full_name,
        user.email,
        user.phone_number,
        user.district,
        user.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text));
    });
  }, [query, users]);

  const stats = useMemo(() => {
    const districts = new Set(
      users.map((user) => user.district).filter(Boolean),
    );
    const withPhotos = users.filter((user) => user.profile_image_url).length;

    return {
      total: users.length,
      withPhotos,
      districts: districts.size,
    };
  }, [users]);

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

  const validateForm = () => {
    const required = [
      "full_name",
      "email",
      "phone_number",
      "address",
      "district",
      ...(editingUser ? [] : ["password"]),
    ];

    const missing = required.filter((key) => !String(form[key] ?? "").trim());

    if (missing.length) {
      return "Please complete all required fields.";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    return null;
  };

  async function handleSubmit(event) {
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
      if (editingUser) {
        const payload = {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone_number: form.phone_number.trim(),
          address: form.address.trim(),
          district: form.district,
          ...(form.password.trim() ? { password: form.password } : {}),
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
        };

        await api.put(`/api/admin/customers/${editingUser._id}`, payload);

        setMsg({
          type: "success",
          text: "User updated successfully.",
        });
      } else {
        const payload = {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          password: form.password,
          phone_number: form.phone_number.trim(),
          address: form.address.trim(),
          district: form.district,
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
        };

        await api.post("/api/admin/customers", payload);

        setMsg({
          type: "success",
          text: "User created successfully.",
        });
      }

      resetForm();
      fetchUsers();
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error saving user.",
      });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this user?")) return;

    try {
      await api.delete(`/api/admin/customers/${id}`);
      fetchUsers();

      setMsg({
        type: "success",
        text: "User deleted successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error deleting user.",
      });
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
      password: "",
    });

    setImagePreview(user.profile_image_url || "");
    setImageDataUrl("");
    setMsg(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setImagePreview("");
    setImageDataUrl("");
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

    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, dx, dy, drawW, drawH);
    ctx.restore();

    let quality = startQuality;
    let output = canvas.toDataURL("image/jpeg", quality);
    const maxBytes = 60 * 1024;

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

    const data = exportCroppedDataUrl(img, 256, 0.8);

    setImageDataUrl(data);
    setImagePreview(data);
    setCropOpen(false);

    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  };

  const cleanupCrop = () => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }

    setCropSrc(null);
    setCropOpen(false);
  };

  return (
    <section className="fm-admin-users">
      <div className="fm-admin-users__header">
        <div>
          <span className="fm-admin-users__eyebrow">Customer Management</span>
          <h1>Manage Users</h1>
          <p>
            Create customer accounts, update profile details, manage addresses,
            and maintain customer contact records.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-users__btn fm-admin-users__btn--outline"
          onClick={fetchUsers}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-admin-users__summaryGrid">
        <article className="fm-admin-users__summaryCard">
          <span>
            <Users size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total users</p>
          </div>
        </article>

        <article className="fm-admin-users__summaryCard">
          <span>
            <ImagePlus size={17} />
          </span>
          <div>
            <strong>{stats.withPhotos}</strong>
            <p>Profile photos</p>
          </div>
        </article>

        <article className="fm-admin-users__summaryCard">
          <span>
            <MapPin size={17} />
          </span>
          <div>
            <strong>{stats.districts}</strong>
            <p>Districts covered</p>
          </div>
        </article>
      </div>

      {msg?.text ? (
        <div
          className={`fm-admin-users__notice fm-admin-users__notice--${msg.type}`}
          role="status"
          aria-live="polite">
          {msg.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <form
        className="fm-admin-users__card"
        onSubmit={handleSubmit}
        autoComplete="off">
        <div className="fm-admin-users__cardHeader">
          <div>
            <span>{editingUser ? "Edit customer" : "New customer"}</span>
            <h2>
              {editingUser ? "Update user details" : "Create user account"}
            </h2>
          </div>

          {editingUser ? (
            <button
              type="button"
              className="fm-admin-users__btn fm-admin-users__btn--outline"
              onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>

        <input
          type="text"
          name="username"
          autoComplete="username"
          className="fm-admin-users__hiddenInput"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="fm-admin-users__hiddenInput"
        />

        <div className="fm-admin-users__formLayout">
          <div className="fm-admin-users__fields">
            <div className="fm-admin-users__field">
              <label htmlFor="fm-user-full-name">Full name *</label>
              <input
                id="fm-user-full-name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
            </div>

            <div className="fm-admin-users__field">
              <label htmlFor="fm-user-email">Email *</label>
              <input
                id="fm-user-email"
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
            </div>

            <div className="fm-admin-users__fieldGrid">
              <div className="fm-admin-users__field">
                <label htmlFor="fm-user-password">
                  {editingUser ? "New password" : "Password *"}
                </label>
                <input
                  id="fm-user-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editingUser
                      ? "Leave blank to keep current password"
                      : "Set a password"
                  }
                  required={!editingUser}
                  autoComplete="new-password"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
              </div>

              <div className="fm-admin-users__field">
                <label htmlFor="fm-user-phone">Phone number *</label>
                <input
                  id="fm-user-phone"
                  name="phone_number"
                  type="text"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+94XXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div className="fm-admin-users__fieldGrid">
              <div className="fm-admin-users__field">
                <label htmlFor="fm-user-address">Address *</label>
                <input
                  id="fm-user-address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, city"
                  required
                />
              </div>

              <div className="fm-admin-users__field">
                <label htmlFor="fm-user-district">District *</label>
                <select
                  id="fm-user-district"
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  required>
                  <option value="">Select district</option>
                  {[...new Set(DISTRICTS)].map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="fm-admin-users__actions">
              <button
                type="submit"
                className="fm-admin-users__btn fm-admin-users__btn--primary">
                <UserPlus size={16} />
                {editingUser ? "Update User" : "Create User"}
              </button>
            </div>
          </div>

          <aside className="fm-admin-users__photoPanel">
            <div className="fm-admin-users__photoPreview">
              {imagePreview ? (
                <img src={imagePreview} alt="Selected user profile" />
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

            <div className="fm-admin-users__photoActions">
              <button
                type="button"
                className="fm-admin-users__btn fm-admin-users__btn--secondary"
                onClick={pickFile}>
                <Upload size={16} />
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </button>

              {imagePreview ? (
                <button
                  type="button"
                  className="fm-admin-users__btn fm-admin-users__btn--dangerLight"
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

      <section className="fm-admin-users__card">
        <div className="fm-admin-users__listHeader">
          <div>
            <span>Customer records</span>
            <h2>All Users</h2>
          </div>

          <label className="fm-admin-users__search">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search users"
            />
          </label>
        </div>

        <div className="fm-admin-users__tableWrap">
          <table className="fm-admin-users__table">
            <thead>
              <tr>
                <th>User</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>District</th>
                <th>Address</th>
                <th className="fm-admin-users__actionsCol">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="fm-admin-users__identity">
                      {user.profile_image_url ? (
                        <img
                          src={user.profile_image_url}
                          alt={user.full_name}
                        />
                      ) : (
                        <span>{getInitial(user.full_name, user.email)}</span>
                      )}

                      <div>
                        <strong>{user.full_name || "Unnamed user"}</strong>
                        <small>{user._id}</small>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="fm-admin-users__cellIcon">
                      <Mail size={14} />
                      <span>{user.email || "—"}</span>
                    </div>
                  </td>

                  <td>
                    <div className="fm-admin-users__cellIcon">
                      <Phone size={14} />
                      <span>{user.phone_number || "—"}</span>
                    </div>
                  </td>

                  <td>{user.district || "—"}</td>
                  <td className="fm-admin-users__clip">
                    {user.address || "—"}
                  </td>

                  <td>
                    <div className="fm-admin-users__rowActions">
                      <button
                        type="button"
                        className="fm-admin-users__iconAction"
                        onClick={() => startEdit(user)}
                        aria-label={`Edit ${user.full_name || "user"}`}>
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="fm-admin-users__iconAction fm-admin-users__iconAction--danger"
                        onClick={() => handleDelete(user._id)}
                        aria-label={`Delete ${user.full_name || "user"}`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredUsers.length && !loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="fm-admin-users__empty">
                      <Users size={24} />
                      <strong>No users found</strong>
                      <span>
                        {query
                          ? "Try a different search keyword."
                          : "Create a user to show customer records here."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {loading ? (
                <tr>
                  <td colSpan="6">
                    <div className="fm-admin-users__empty">
                      <RefreshCw size={24} />
                      <strong>Loading users</strong>
                      <span>
                        Please wait while customer records are loaded.
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
          className="fm-admin-users-crop"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true"
          aria-label="Crop profile photo">
          <div
            className="fm-admin-users-crop__modal"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-admin-users-crop__header">
              <div>
                <span>Profile image</span>
                <h2>Adjust Photo</h2>
              </div>

              <button
                type="button"
                className="fm-admin-users__iconAction"
                onClick={cleanupCrop}
                aria-label="Close crop modal">
                <X size={16} />
              </button>
            </div>

            <div
              className="fm-admin-users-crop__viewport"
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
                  className="fm-admin-users-crop__image"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${
                      base * zoom
                    })`,
                  }}
                />
              ) : null}

              <div className="fm-admin-users-crop__circle" />
            </div>

            <div className="fm-admin-users-crop__controls">
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

              <div className="fm-admin-users-crop__actions">
                <button
                  type="button"
                  className="fm-admin-users__btn fm-admin-users__btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="fm-admin-users__btn fm-admin-users__btn--primary"
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
