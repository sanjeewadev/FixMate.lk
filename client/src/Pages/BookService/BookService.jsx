import React, { useEffect, useMemo, useRef, useState } from "react";
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
  const [prefetchedService, setPrefetchedService] = useState(null); // when loaded by slug
  const [loading, setLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(true);

  const [msg, setMsg] = useState(null);
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

  // uploads
  const [files, setFiles] = useState([]);     // File[]
  const [previews, setPreviews] = useState([]); // blob URLs
  const fileInputRef = useRef(null);

  const districtOptions = useMemo(() => {
    if (form.district && !DISTRICTS.includes(form.district)) {
      return [form.district, ...DISTRICTS];
    }
    return DISTRICTS;
  }, [form.district]);

  // ---------- Fetch services & optional slug selection ----------
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        // If a slug is given, prefetch that specific service, BUT DO NOT RETURN.
        if (qsSlug) {
          const r = await fetch(`/api/services/${qsSlug}`);
          if (!abort && r.ok) {
            const s = await r.json();
            setPrefetchedService(s);
            setForm((f) => ({ ...f, serviceId: s._id || s.id || f.serviceId }));
          }
        }

        // Always load list so the user can change the service
        const r2 = await fetch(`/api/services?limit=100`);
        if (abort) return;
        if (!r2.ok) throw new Error("Failed to load services");
        const data = await r2.json();
        const list = data?.data || [];
        setServices(list);

        // If serviceId came in query, preselect it
        if (qsServiceId) {
          const found = list.find((x) => String(x._id) === String(qsServiceId));
          if (found) {
            setForm((f) => ({ ...f, serviceId: found._id }));
          }
        }
      } catch (e) {
        if (!abort) setMsg({ type: "error", text: e.message || "Failed to load services" });
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [qsServiceId, qsSlug]);

  // ---------- Fetch customer profile ----------
  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setMsg({ type: "info", text: "Please login to book a service." });
          setProfileLoading(false);
          return;
        }
        const r = await fetch("/api/customer/me", { headers: { Authorization: `Bearer ${token}` } });
        if (!abort && r.ok) {
          const me = await r.json();
          setForm((f) => ({
            ...f,
            address: me.address || f.address,
            district: me.district || f.district,
            phone_number: me.phone_number || f.phone_number,
          }));
        }
      } catch { /* non-blocking */ }
      finally { if (!abort) setProfileLoading(false); }
    })();
    return () => { abort = true; };
  }, []);

  // ---------- previews ----------
  useEffect(() => {
    // revoke previous
    previews.forEach((u) => URL.revokeObjectURL(u));
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => { urls.forEach((u) => URL.revokeObjectURL(u)); };
  }, [files]); // <— depend on files (not files.length)

  const update = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const onFiles = (e) => {
    const list = Array.from(e.target.files || []);
    // append and cap to 6
    setFiles((prev) => [...prev, ...list].slice(0, 6));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const clearAllFiles = () => {
    setFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ---------- validate & submit ----------
  const validate = () => {
    if (!form.serviceId) return "Please choose a service.";
    if (!form.problemTitle.trim()) return "Please enter a short problem title.";
    if (!form.preferredAt) return "Please pick a preferred date.";
    if (!form.address.trim() || !form.district.trim() || !form.phone_number.trim()) {
      return "Address, district and phone number are required.";
    }
    return null;
  };

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
      fd.append("preferredAt", form.preferredAt);
      if (form.timeSlot) fd.append("timeSlot", form.timeSlot);
      if (form.brandModel) fd.append("brandModel", form.brandModel);
      if (form.equipmentAge) fd.append("equipmentAge", form.equipmentAge);
      fd.append("problemTitle", form.problemTitle);
      if (form.problemDescription) fd.append("problemDescription", form.problemDescription);
      if (form.specialInstructions) fd.append("specialInstructions", form.specialInstructions);
      fd.append("address", form.address);
      fd.append("district", form.district);
      fd.append("phone_number", form.phone_number);
      files.forEach((f) => fd.append("media", f));

      const r = await fetch("/api/bookings", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg({ type: "error", text: data?.message || "Could not create booking." });
        return;
      }
      setMsg({ type: "success", text: "Booking created! We’ll follow up soon." });
      // navigate("/UserDashboard/history");
    } catch {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  }, []);

  const timeSlots = [
    "Morning (08:00–10:00)",
    "Late Morning (10:00–12:00)",
    "Afternoon (12:00–14:00)",
    "Late Afternoon (14:00–16:00)",
    "Evening (16:00–18:00)",
  ];

  // Selected service object (from list or slug prefetch)
  const selectedService =
    services.find((s) => String(s._id) === String(form.serviceId)) ||
    prefetchedService ||
    null;

  return (
    <div className="booking-page">
      <div className="booking-card">
        <h1 className="title">Book a Service</h1>

        <div className="msg-slot" aria-live="polite" aria-atomic="true">
          {msg?.text && <div className={`msg ${msg.type} show`}>{msg.text}</div>}
          {!msg && (profileLoading || loading) && (
            <div className="msg info">Preparing your booking form…</div>
          )}
        </div>

        <form onSubmit={onSubmit} className="booking-form">
          {/* LEFT */}
          <section className="col">
            {/* Always show the selector so the user can CHANGE it */}
            <div className="field">
              <label>Service *</label>
              {loading ? (
                <div className="skeleton">Loading services…</div>
              ) : (
                <select
                  value={form.serviceId}
                  onChange={(e) => update("serviceId", e.target.value)}
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

            {/* Optional summary card of the selection */}
            {selectedService && (
              <div className="service-picked">
                <div className="service-thumb">
                  <img
                    src={selectedService?.serviceImages?.[0]?.url || "/assets/default.jpg"}
                    alt={selectedService?.name || "Service"}
                  />
                </div>
                <div className="service-about">
                  <div className="service-name">{selectedService?.name}</div>
                  {selectedService?.category && (
                    <div className="service-cat">{selectedService.category}</div>
                  )}
                </div>
              </div>
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
                <select
                  className="select-field-book-service"
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

          {/* RIGHT */}
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

            <div className="field">
              <label>District *</label>
              <select
                value={DISTRICTS.includes(form.district) ? form.district : (form.district || "")}
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onFiles}
              />
              {previews.length > 0 && (
                <>
                  <div className="preview-grid">
                    {previews.map((src, i) => (
                      <div key={i} className="thumb">
                        <img src={src} alt={`upload-${i}`} />
                        <button
                          type="button"
                          className="remove"
                          onClick={() => removeFile(i)}
                          aria-label="Remove image"
                        >×</button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="link-btn"
                    onClick={clearAllFiles}
                    style={{ marginTop: 6 }}
                  >
                    Remove all
                  </button>
                </>
              )}
            </div>

            <button type="submit" className="primary" disabled={submitting}>
              {submitting ? "Booking..." : "Confirm Booking"}
            </button>

            <p className="hint">By booking you agree to our service terms and scheduling policies.</p>
          </section>
        </form>
      </div>
    </div>
  );
}

export default BookService;