import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./BookService.css";

const DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota",
  "Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee",
  "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"
];

function BookService() {
  const location = useLocation();
  const navigate = useNavigate();

  const qs = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const qsServiceId = qs.get("serviceId");
  const qsSlug = qs.get("slug");

  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);     // currently selected service object
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const [msg, setMsg] = useState(null);             // {type, text}
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    serviceId: "",
    preferredAt: "",
    timeSlot: "",
    brandModel: "",
    equipmentAge: "",
    problemTitle: "",
    problemDescription: "",
    specialInstructions: "",
    address: "",
    district: "",
    phone_number: "",
  });

  const [files, setFiles] = useState([]);    // File[]
  const [previews, setPreviews] = useState([]); // blob URLs

  // Dropdown options; if profile has a district not in the list, include it so React doesn't warn.
  const districtOptions = useMemo(() => {
    if (form.district && !DISTRICTS.includes(form.district)) {
      return [form.district, ...DISTRICTS];
    }
    return DISTRICTS;
  }, [form.district]);

  // -------- Fetch services list or preselected service --------
  useEffect(() => {
    let abort = false;

    async function fetchServices() {
      try {
        // If we have a slug, fetch that one service first
        if (qsSlug) {
          const r = await fetch(`/api/services/${qsSlug}`);
          if (abort) return;
          if (r.ok) {
            const s = await r.json();
            setService(s);
            setForm((f) => ({ ...f, serviceId: s._id || s.id || f.serviceId }));
            setLoading(false);
            return;
          }
        }

        // Otherwise fetch a page of services for dropdown
        const r2 = await fetch(`/api/services?limit=100`);
        if (abort) return;
        if (!r2.ok) throw new Error("Failed to load services");

        const data = await r2.json();
        const list = data?.data || [];
        setServices(list);

        // If serviceId came via query, preselect it
        if (qsServiceId) {
          const found = list.find((x) => String(x._id) === String(qsServiceId));
          if (found) {
            setService(found);
            setForm((f) => ({ ...f, serviceId: found._id }));
          }
        }

      } catch (e) {
        setMsg({ type: "error", text: e.message || "Failed to load services" });
      } finally {
        setLoading(false);
      }
    }

    fetchServices();
    return () => { abort = true; };
  }, [qsServiceId, qsSlug]);

  // -------- Fetch customer profile to autofill snapshot fields --------
  useEffect(() => {
    let abort = false;
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMsg({ type: "info", text: "Please login to book a service." });
          setProfileLoading(false);
          return;
        }
        // Adjust the path if your route is different (e.g., /api/customer/profile)
        const r = await fetch("/api/customer/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (abort) return;
        if (r.ok) {
          const me = await r.json();
          setForm((f) => ({
            ...f,
            address: me.address || f.address,
            district: me.district || f.district,
            phone_number: me.phone_number || f.phone_number,
          }));
        } else if (r.status === 401) {
          setMsg({ type: "info", text: "Please login to book a service." });
        } else {
          // try alternate path if your API uses /profile
          const r2 = await fetch("/api/customer/profile", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!abort && r2.ok) {
            const me2 = await r2.json();
            setForm((f) => ({
              ...f,
              address: me2.address || f.address,
              district: me2.district || f.district,
              phone_number: me2.phone_number || f.phone_number,
            }));
          }
        }
      } catch {
        /* ignore, non-blocking */
      } finally {
        if (!abort) setProfileLoading(false);
      }
    }

    fetchProfile();
    return () => { abort = true; };
  }, []);

  // -------- file previews --------
  useEffect(() => {
    previews.forEach((u) => URL.revokeObjectURL(u));
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    // revoke on unmount/next change
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length]);

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const onFiles = (e) => {
    const list = Array.from(e.target.files || []);
    // Optional: cap to 6 images
    setFiles(list.slice(0, 6));
  };

  // -------- Validation --------
  const validate = () => {
    if (!form.serviceId) return "Please choose a service.";
    if (!form.problemTitle.trim()) return "Please enter a short problem title.";
    if (!form.preferredAt) return "Please pick a preferred date.";
    if (!form.address.trim() || !form.district.trim() || !form.phone_number.trim()) {
      return "Address, district and phone number are required.";
    }
    return null;
  };

  // -------- Submit --------
  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const v = validate();
    if (v) { setMsg({ type: "error", text: v }); return; }

    const token = localStorage.getItem("token");
    if (!token) { setMsg({ type: "error", text: "Please login first." }); return; }

    try {
      setSubmitting(true);
      const fd = new FormData();
      fd.append("serviceId", form.serviceId);
      fd.append("preferredAt", form.preferredAt);      // yyyy-mm-dd, backend new Date() is fine
      if (form.timeSlot) fd.append("timeSlot", form.timeSlot);
      if (form.brandModel) fd.append("brandModel", form.brandModel);
      if (form.equipmentAge) fd.append("equipmentAge", form.equipmentAge);
      fd.append("problemTitle", form.problemTitle);
      if (form.problemDescription) fd.append("problemDescription", form.problemDescription);
      if (form.specialInstructions) fd.append("specialInstructions", form.specialInstructions);
      fd.append("address", form.address);
      fd.append("district", form.district);
      fd.append("phone_number", form.phone_number);
      // files (field name 'media' expected by your uploader)
      files.forEach((f) => fd.append("media", f));

      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // DO NOT set Content-Type here
        body: fd,
      });

      let data = {};
      try { data = await r.json(); } catch {}

      if (!r.ok) {
        const text = data?.message || "Could not create booking.";
        setMsg({ type: "error", text });
        return;
      }

      setMsg({ type: "success", text: "Booking created! We’ll follow up soon." });
      // Optional: route to "My bookings" if you have it
      // setTimeout(() => navigate("/my-bookings"), 900);

    } catch (err) {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  // -------- Today min for date --------
  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }, []);

  const timeSlots = [
    "Morning (08:00–10:00)",
    "Late Morning (10:00–12:00)",
    "Afternoon (12:00–14:00)",
    "Late Afternoon (14:00–16:00)",
    "Evening (16:00–18:00)",
  ];

  const serviceSelector = (
    <div className="field">
      <label>Service *</label>
      {loading ? (
        <div className="skeleton">Loading services…</div>
      ) : (
        <select
          value={form.serviceId}
          onChange={(e) => {
            const id = e.target.value;
            update("serviceId", id);
            const found = services.find((s) => String(s._id) === String(id));
            setService(found || null);
          }}
          required
        >
          <option value="">Select a service</option>
          {services.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} {s.category ? `— ${s.category}` : ""}
            </option>
          ))}
        </select>
      )}
    </div>
  );

  return (
    <div className="booking-page">
      <div className="booking-card">
        <h1 className="title">Book a Service</h1>

        {/* Message bar */}
        <div className="msg-slot" aria-live="polite" aria-atomic="true">
          {msg?.text && <div className={`msg ${msg.type} show`}>{msg.text}</div>}
          {!msg && (profileLoading || loading) && (
            <div className="msg info">Preparing your booking form…</div>
          )}
        </div>

        <form onSubmit={onSubmit} className="booking-form">
          {/* LEFT COLUMN */}
          <section className="col">
            {/* Service picker or preselected */}
            {service && form.serviceId ? (
              <div className="service-picked">
                <div className="service-thumb">
                  <img
                    src={service?.serviceImages?.[0]?.url || "/assets/default.jpg"}
                    alt={service?.name || "Service"}
                  />
                </div>
                <div className="service-about">
                  <div className="service-name">{service?.name}</div>
                  {service?.category && <div className="service-cat">{service.category}</div>}
                </div>
              </div>
            ) : (
              serviceSelector
            )}

            <div className="grid2">
              <div className="field">
                <label>Preferred Date *</label>
                <input
                  type="date"
                  min={today}
                  value={form.preferredAt}
                  onChange={(e) => update("preferredAt", e.target.value)}
                  required
                />
              </div>

              <div className="field">
                <label>Preferred Time</label>
                <select className="select-field-book-service"
                  value={form.timeSlot}
                  onChange={(e) => update("timeSlot", e.target.value)}
                >
                  <option value="">Any time</option>
                  {timeSlots.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid2">
              <div className="field">
                <label>Brand / Model</label>
                <input
                  type="text"
                  value={form.brandModel}
                  onChange={(e) => update("brandModel", e.target.value)}
                  placeholder="e.g., LG DualCool S3"
                />
              </div>
              <div className="field">
                <label>Equipment age</label>
                <input
                  type="text"
                  value={form.equipmentAge}
                  onChange={(e) => update("equipmentAge", e.target.value)}
                  placeholder="e.g., ~4 years"
                />
              </div>
            </div>

            <div className="field">
              <label>Problem Title *</label>
              <input
                type="text"
                value={form.problemTitle}
                onChange={(e) => update("problemTitle", e.target.value)}
                placeholder="Short summary of the issue"
                required
              />
            </div>

            <div className="field">
              <label>Problem Description</label>
              <textarea
                rows="4"
                value={form.problemDescription}
                onChange={(e) => update("problemDescription", e.target.value)}
                placeholder="Tell us more about the problem"
              />
            </div>

            <div className="field">
              <label>Special Instructions</label>
              <textarea
                rows="3"
                value={form.specialInstructions}
                onChange={(e) => update("specialInstructions", e.target.value)}
                placeholder="Any access notes, parking, pets, etc."
              />
            </div>
          </section>

          {/* RIGHT COLUMN */}
          <section className="col">
            <div className="group-head">Service Address & Contact</div>

            <div className="field">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={form.phone_number}
                onChange={(e) => update("phone_number", e.target.value)}
                placeholder="+94..."
                required
              />
            </div>

            <div className="field">
              <label>Address *</label>
              <textarea
                rows="3"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="House No, Street, City"
                required
              />
            </div>

            {/* ▼ District dropdown (same field name & value) */}
            <div className="field">
              <label>District *</label>
              <select
                value={DISTRICTS.includes(form.district) ? form.district : (form.district ? form.district : "")}
                onChange={(e) => update("district", e.target.value)}
                required
              >
                <option value="" disabled>Select district</option>
                {districtOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label>Upload Photos (optional, up to 6)</label>
              <input type="file" accept="image/*" multiple onChange={onFiles} />
              {previews.length > 0 && (
                <div className="preview-grid">
                  {previews.map((src, i) => (
                    <img key={i} src={src} alt={`upload-${i}`} />
                  ))}
                </div>
              )}
            </div>

            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>

            <p className="hint">
              By booking you agree to our service terms and scheduling policies.
            </p>
          </section>
        </form>
      </div>
    </div>
  );
}

export default BookService;
