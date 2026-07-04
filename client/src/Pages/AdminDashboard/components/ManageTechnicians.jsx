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
  FileText,
  Mail,
  MapPin,
  Pause,
  Pencil,
  Phone,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./ManageTechnicians.css";

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
  specialization: "",
  experience_years: 0,
};

const getInitial = (name, email) => {
  const source = name || email || "T";
  return String(source).charAt(0).toUpperCase();
};

export default function ManageTechnicians() {
  const [technicians, setTechnicians] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showConverted, setShowConverted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [appsLoading, setAppsLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const [techQuery, setTechQuery] = useState("");
  const [appQuery, setAppQuery] = useState("");

  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);

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

  const loadTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/api/admin/technicians");
      setTechnicians(Array.isArray(data) ? data : []);
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to load technicians.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadApplications = useCallback(async (includeConverted = false) => {
    try {
      setAppsLoading(true);
      const { data } = await api.get(
        `/api/admin/technicians/applications${
          includeConverted ? "?includeConverted=1" : ""
        }`,
      );

      setApplications(Array.isArray(data) ? data : []);
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to load applications.",
      });
    } finally {
      setAppsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTechnicians();
    loadApplications(false);
  }, [loadApplications, loadTechnicians]);

  useEffect(() => {
    loadApplications(showConverted);
  }, [loadApplications, showConverted]);

  useEffect(() => {
    return () => {
      if (cropSrc) {
        URL.revokeObjectURL(cropSrc);
      }
    };
  }, [cropSrc]);

  const stats = useMemo(() => {
    const suspended = technicians.filter(
      (technician) => technician.is_suspended,
    ).length;

    const districts = new Set(
      technicians.map((technician) => technician.district).filter(Boolean),
    );

    const pendingApplications = applications.filter(
      (application) => application.status !== "converted",
    ).length;

    return {
      total: technicians.length,
      suspended,
      districts: districts.size,
      applications: pendingApplications,
    };
  }, [applications, technicians]);

  const filteredTechnicians = useMemo(() => {
    const searchText = techQuery.trim().toLowerCase();

    if (!searchText) return technicians;

    return technicians.filter((technician) => {
      return [
        technician.full_name,
        technician.email,
        technician.phone_number,
        technician.district,
        technician.specialization,
        technician.address,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText));
    });
  }, [techQuery, technicians]);

  const filteredApplications = useMemo(() => {
    const searchText = appQuery.trim().toLowerCase();

    if (!searchText) return applications;

    return applications.filter((application) => {
      return [
        application.full_name,
        application.email,
        application.phone_number,
        application.district,
        application.specialization,
        application.address,
        application.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText));
    });
  }, [appQuery, applications]);

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: name === "experience_years" ? Number(value || 0) : value,
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
    setEditId(null);
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
      "specialization",
      ...(editId ? [] : ["password"]),
    ];

    const missing = required.filter((key) => !String(form[key] ?? "").trim());

    if (missing.length) {
      return "Please complete all required fields.";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (Number(form.experience_years) < 0) {
      return "Experience years cannot be negative.";
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
      if (editId) {
        const payload = {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone_number: form.phone_number.trim(),
          address: form.address.trim(),
          district: form.district,
          specialization: form.specialization.trim(),
          experience_years: Number(form.experience_years) || 0,
          ...(form.password.trim() ? { password: form.password } : {}),
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
        };

        await api.put(`/api/admin/technicians/${editId}`, payload);

        setMsg({
          type: "success",
          text: "Technician updated successfully.",
        });
      } else {
        const payload = {
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone_number: form.phone_number.trim(),
          address: form.address.trim(),
          district: form.district,
          specialization: form.specialization.trim(),
          experience_years: Number(form.experience_years) || 0,
          password: form.password,
          ...(imageDataUrl ? { profile_image_url: imageDataUrl } : {}),
        };

        await api.post("/api/admin/technicians", payload);

        setMsg({
          type: "success",
          text: "Technician created successfully.",
        });
      }

      resetForm();
      loadTechnicians();
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error saving technician.",
      });
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this technician?")) return;

    try {
      await api.delete(`/api/admin/technicians/${id}`);
      loadTechnicians();

      setMsg({
        type: "success",
        text: "Technician deleted successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Delete failed.",
      });
    }
  }

  function handleEdit(technician) {
    setEditId(technician._id);

    setForm({
      full_name: technician.full_name || "",
      email: technician.email || "",
      password: "",
      phone_number: technician.phone_number || "",
      address: technician.address || "",
      district: technician.district || "",
      specialization: technician.specialization || "",
      experience_years: technician.experience_years || 0,
    });

    const image =
      technician.profile_image_url || technician.profile_image?.url || "";

    setImagePreview(image || "");
    setImageDataUrl("");
    setMsg(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleSuspend(technician) {
    try {
      if (technician.is_suspended) {
        await api.post(`/api/admin/technicians/${technician._id}/unsuspend`);
      } else {
        await api.post(`/api/admin/technicians/${technician._id}/suspend`);
      }

      loadTechnicians();

      setMsg({
        type: "success",
        text: technician.is_suspended
          ? "Technician unsuspended successfully."
          : "Technician suspended successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to update suspension.",
      });
    }
  }

  async function convertApplication(id) {
    const password = prompt("Enter initial password for technician:");

    if (!password) return;

    try {
      await api.post(`/api/admin/technicians/convert/${id}`, { password });

      loadApplications(showConverted);
      loadTechnicians();

      setMsg({
        type: "success",
        text: "Application converted successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error converting application.",
      });
    }
  }

  async function deleteApplication(id) {
    if (!window.confirm("Delete this application?")) return;

    try {
      await api.delete(`/api/admin/technicians/applications/${id}`);
      loadApplications(showConverted);

      setMsg({
        type: "success",
        text: "Application deleted successfully.",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to delete application.",
      });
    }
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

    const data = exportCroppedDataUrl(img, 256, 0.8);

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
    <section className="fm-admin-technicians">
      <div className="fm-admin-technicians__header">
        <div>
          <span className="fm-admin-technicians__eyebrow">
            Technician Management
          </span>

          <h1>Manage Technicians</h1>

          <p>
            Create technician accounts, update details, suspend access, and
            convert submitted technician applications.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-technicians__btn fm-admin-technicians__btn--outline"
          onClick={loadTechnicians}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-admin-technicians__summaryGrid">
        <article className="fm-admin-technicians__summaryCard">
          <span>
            <Users size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total technicians</p>
          </div>
        </article>

        <article className="fm-admin-technicians__summaryCard">
          <span>
            <Pause size={17} />
          </span>
          <div>
            <strong>{stats.suspended}</strong>
            <p>Suspended</p>
          </div>
        </article>

        <article className="fm-admin-technicians__summaryCard">
          <span>
            <MapPin size={17} />
          </span>
          <div>
            <strong>{stats.districts}</strong>
            <p>Districts covered</p>
          </div>
        </article>

        <article className="fm-admin-technicians__summaryCard">
          <span>
            <FileText size={17} />
          </span>
          <div>
            <strong>{stats.applications}</strong>
            <p>Pending applications</p>
          </div>
        </article>
      </div>

      {msg?.text ? (
        <div
          className={`fm-admin-technicians__notice fm-admin-technicians__notice--${msg.type}`}
          role="status"
          aria-live="polite">
          {msg.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <form
        className="fm-admin-technicians__card"
        onSubmit={handleSubmit}
        autoComplete="off">
        <div className="fm-admin-technicians__cardHeader">
          <div>
            <span>{editId ? "Edit technician" : "New technician"}</span>
            <h2>
              {editId ? "Update technician details" : "Create technician"}
            </h2>
          </div>

          {editId ? (
            <button
              type="button"
              className="fm-admin-technicians__btn fm-admin-technicians__btn--outline"
              onClick={resetForm}>
              Cancel edit
            </button>
          ) : null}
        </div>

        <input
          type="text"
          name="username"
          autoComplete="username"
          className="fm-admin-technicians__hiddenInput"
        />
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          className="fm-admin-technicians__hiddenInput"
        />

        <div className="fm-admin-technicians__formLayout">
          <div className="fm-admin-technicians__fields">
            <div className="fm-admin-technicians__field">
              <label htmlFor="fm-tech-name">Full name *</label>
              <input
                id="fm-tech-name"
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Full name"
                required
              />
            </div>

            <div className="fm-admin-technicians__field">
              <label htmlFor="fm-tech-email">Email *</label>
              <input
                id="fm-tech-email"
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

              {editId ? (
                <div className="fm-admin-technicians__hint">
                  Changing email updates the technician login.
                </div>
              ) : null}
            </div>

            <div className="fm-admin-technicians__fieldGrid">
              <div className="fm-admin-technicians__field">
                <label htmlFor="fm-tech-password">
                  {editId ? "New password" : "Password *"}
                </label>

                <input
                  id="fm-tech-password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder={
                    editId
                      ? "Leave blank to keep current password"
                      : "Set a password"
                  }
                  required={!editId}
                  autoComplete="new-password"
                  spellCheck={false}
                  data-1p-ignore="true"
                  data-lpignore="true"
                />
              </div>

              <div className="fm-admin-technicians__field">
                <label htmlFor="fm-tech-phone">Phone number *</label>
                <input
                  id="fm-tech-phone"
                  name="phone_number"
                  type="text"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="+94XXXXXXXXX"
                  required
                />
              </div>
            </div>

            <div className="fm-admin-technicians__fieldGrid">
              <div className="fm-admin-technicians__field">
                <label htmlFor="fm-tech-address">Address *</label>
                <input
                  id="fm-tech-address"
                  name="address"
                  type="text"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Street, city"
                  required
                />
              </div>

              <div className="fm-admin-technicians__field">
                <label htmlFor="fm-tech-district">District *</label>
                <select
                  id="fm-tech-district"
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

            <div className="fm-admin-technicians__fieldGrid">
              <div className="fm-admin-technicians__field">
                <label htmlFor="fm-tech-specialization">Specialization *</label>
                <input
                  id="fm-tech-specialization"
                  name="specialization"
                  type="text"
                  value={form.specialization}
                  onChange={handleChange}
                  placeholder="e.g., Electrician"
                  required
                />
              </div>

              <div className="fm-admin-technicians__field">
                <label htmlFor="fm-tech-experience">Experience years</label>
                <input
                  id="fm-tech-experience"
                  name="experience_years"
                  type="number"
                  min="0"
                  value={form.experience_years}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="fm-admin-technicians__actions">
              <button
                type="submit"
                className="fm-admin-technicians__btn fm-admin-technicians__btn--primary">
                <UserPlus size={16} />
                {editId ? "Update Technician" : "Add Technician"}
              </button>
            </div>
          </div>

          <aside className="fm-admin-technicians__photoPanel">
            <div className="fm-admin-technicians__photoPreview">
              {imagePreview ? (
                <img src={imagePreview} alt="Selected technician profile" />
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

            <div className="fm-admin-technicians__photoActions">
              <button
                type="button"
                className="fm-admin-technicians__btn fm-admin-technicians__btn--secondary"
                onClick={pickFile}>
                <Upload size={16} />
                {imagePreview ? "Change Photo" : "Upload Photo"}
              </button>

              {imagePreview ? (
                <button
                  type="button"
                  className="fm-admin-technicians__btn fm-admin-technicians__btn--dangerLight"
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

      <section className="fm-admin-technicians__card">
        <div className="fm-admin-technicians__listHeader">
          <div>
            <span>Technician records</span>
            <h2>Technicians</h2>
          </div>

          <label className="fm-admin-technicians__search">
            <Search size={16} />
            <input
              type="search"
              value={techQuery}
              onChange={(event) => setTechQuery(event.target.value)}
              placeholder="Search technicians"
            />
          </label>
        </div>

        <div className="fm-admin-technicians__tableWrap">
          <table className="fm-admin-technicians__table">
            <thead>
              <tr>
                <th>Technician</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>District</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th className="fm-admin-technicians__actionsCol">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredTechnicians.map((technician) => (
                <tr key={technician._id}>
                  <td>
                    <div className="fm-admin-technicians__identity">
                      {technician.profile_image_url ||
                      technician.profile_image?.url ? (
                        <img
                          src={
                            technician.profile_image_url ||
                            technician.profile_image?.url
                          }
                          alt={technician.full_name}
                        />
                      ) : (
                        <span>
                          {getInitial(technician.full_name, technician.email)}
                        </span>
                      )}

                      <div>
                        <strong>
                          {technician.full_name || "Unnamed technician"}
                        </strong>

                        {technician.is_suspended ? (
                          <small className="fm-admin-technicians__badge fm-admin-technicians__badge--red">
                            Suspended
                          </small>
                        ) : (
                          <small className="fm-admin-technicians__badge fm-admin-technicians__badge--green">
                            Active
                          </small>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="fm-admin-technicians__cellIcon">
                      <Mail size={14} />
                      <span>{technician.email || "—"}</span>
                    </div>
                  </td>

                  <td>
                    <div className="fm-admin-technicians__cellIcon">
                      <Phone size={14} />
                      <span>{technician.phone_number || "—"}</span>
                    </div>
                  </td>

                  <td>{technician.district || "—"}</td>
                  <td>{technician.specialization || "—"}</td>
                  <td>{technician.experience_years ?? 0} yrs</td>

                  <td>
                    <div className="fm-admin-technicians__rowActions">
                      <button
                        type="button"
                        className="fm-admin-technicians__iconAction"
                        onClick={() => handleEdit(technician)}
                        aria-label={`Edit ${
                          technician.full_name || "technician"
                        }`}>
                        <Pencil size={15} />
                      </button>

                      <button
                        type="button"
                        className="fm-admin-technicians__iconAction"
                        onClick={() => toggleSuspend(technician)}
                        aria-label={
                          technician.is_suspended
                            ? `Unsuspend ${
                                technician.full_name || "technician"
                              }`
                            : `Suspend ${technician.full_name || "technician"}`
                        }>
                        {technician.is_suspended ? (
                          <Play size={15} />
                        ) : (
                          <Pause size={15} />
                        )}
                      </button>

                      <button
                        type="button"
                        className="fm-admin-technicians__iconAction fm-admin-technicians__iconAction--danger"
                        onClick={() => handleDelete(technician._id)}
                        aria-label={`Delete ${
                          technician.full_name || "technician"
                        }`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredTechnicians.length && !loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="fm-admin-technicians__empty">
                      <Wrench size={24} />
                      <strong>No technicians found</strong>
                      <span>
                        {techQuery
                          ? "Try a different search keyword."
                          : "Create a technician to show records here."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {loading ? (
                <tr>
                  <td colSpan="7">
                    <div className="fm-admin-technicians__empty">
                      <RefreshCw size={24} />
                      <strong>Loading technicians</strong>
                      <span>Please wait while records are loaded.</span>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fm-admin-technicians__card">
        <div className="fm-admin-technicians__listHeader">
          <div>
            <span>Application records</span>
            <h2>Technician Applications</h2>
          </div>

          <div className="fm-admin-technicians__tools">
            <label className="fm-admin-technicians__checkbox">
              <input
                type="checkbox"
                checked={showConverted}
                onChange={(event) => setShowConverted(event.target.checked)}
              />
              <span>Show converted</span>
            </label>

            <label className="fm-admin-technicians__search">
              <Search size={16} />
              <input
                type="search"
                value={appQuery}
                onChange={(event) => setAppQuery(event.target.value)}
                placeholder="Search applications"
              />
            </label>
          </div>
        </div>

        <div className="fm-admin-technicians__tableWrap">
          <table className="fm-admin-technicians__table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Contact</th>
                <th>Phone</th>
                <th>District</th>
                <th>Specialization</th>
                <th>Experience</th>
                <th className="fm-admin-technicians__actionsCol">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredApplications.map((application) => (
                <tr key={application._id}>
                  <td>
                    <div className="fm-admin-technicians__identity">
                      {application.profile_image_url ? (
                        <img
                          src={application.profile_image_url}
                          alt={application.full_name}
                        />
                      ) : (
                        <span>
                          {getInitial(application.full_name, application.email)}
                        </span>
                      )}

                      <div>
                        <strong>
                          {application.full_name || "Unnamed applicant"}
                        </strong>

                        {application.status === "converted" ? (
                          <small className="fm-admin-technicians__badge fm-admin-technicians__badge--green">
                            Converted
                          </small>
                        ) : (
                          <small className="fm-admin-technicians__badge">
                            Pending
                          </small>
                        )}
                      </div>
                    </div>
                  </td>

                  <td>
                    <div className="fm-admin-technicians__cellIcon">
                      <Mail size={14} />
                      <span>{application.email || "—"}</span>
                    </div>
                  </td>

                  <td>
                    <div className="fm-admin-technicians__cellIcon">
                      <Phone size={14} />
                      <span>{application.phone_number || "—"}</span>
                    </div>
                  </td>

                  <td>{application.district || "—"}</td>
                  <td>{application.specialization || "—"}</td>
                  <td>{application.experience_years ?? 0} yrs</td>

                  <td>
                    <div className="fm-admin-technicians__rowActions">
                      {application.status !== "converted" ? (
                        <button
                          type="button"
                          className="fm-admin-technicians__iconAction"
                          onClick={() => convertApplication(application._id)}
                          aria-label={`Convert ${
                            application.full_name || "application"
                          }`}>
                          <ShieldCheck size={15} />
                        </button>
                      ) : null}

                      <button
                        type="button"
                        className="fm-admin-technicians__iconAction fm-admin-technicians__iconAction--danger"
                        onClick={() => deleteApplication(application._id)}
                        aria-label={`Delete ${
                          application.full_name || "application"
                        }`}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!filteredApplications.length && !appsLoading ? (
                <tr>
                  <td colSpan="7">
                    <div className="fm-admin-technicians__empty">
                      <FileText size={24} />
                      <strong>No applications found</strong>
                      <span>
                        {appQuery
                          ? "Try a different search keyword."
                          : "Applications will appear here after technicians apply."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}

              {appsLoading ? (
                <tr>
                  <td colSpan="7">
                    <div className="fm-admin-technicians__empty">
                      <RefreshCw size={24} />
                      <strong>Loading applications</strong>
                      <span>Please wait while records are loaded.</span>
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
          className="fm-admin-technicians-crop"
          onClick={cleanupCrop}
          role="dialog"
          aria-modal="true"
          aria-label="Crop technician photo">
          <div
            className="fm-admin-technicians-crop__modal"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-admin-technicians-crop__header">
              <div>
                <span>Profile image</span>
                <h2>Adjust Photo</h2>
              </div>

              <button
                type="button"
                className="fm-admin-technicians__iconAction"
                onClick={cleanupCrop}
                aria-label="Close crop modal">
                <X size={16} />
              </button>
            </div>

            <div
              className="fm-admin-technicians-crop__viewport"
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
                  className="fm-admin-technicians-crop__image"
                  onLoad={onPreviewLoad}
                  style={{
                    transform: `translate(calc(-50% + ${offX}px), calc(-50% + ${offY}px)) scale(${
                      base * zoom
                    })`,
                  }}
                />
              ) : null}
            </div>

            <div className="fm-admin-technicians-crop__controls">
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

              <div className="fm-admin-technicians-crop__actions">
                <button
                  type="button"
                  className="fm-admin-technicians__btn fm-admin-technicians__btn--outline"
                  onClick={cleanupCrop}>
                  Cancel
                </button>

                <button
                  type="button"
                  className="fm-admin-technicians__btn fm-admin-technicians__btn--primary"
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
