import { useState } from "react";
import { createApplication } from "../../services/becomeTech";
import "./TechnicianRegister.css";

const DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota",
  "Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee",
  "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"
];

export default function TechnicianRegister() {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone_number: "",
    address: "",
    district: "",
    specialization: "",
    experience_years: "",
    note: ""
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // ✅ Show a pre-submit info message in the same message area
  const [msg, setMsg] = useState({
    type: "info",
    text: "After you submit this form, we will review it and contact you via phone or email."
  });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const onPick = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setMsg({ type: "error", text: "Please select an image file." });
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setMsg({ type: "error", text: "Image must be < 5MB." });
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    // clear any info/error; we’ll set a new one below
    setMsg(null);

    // basic validations
    if (!form.full_name || !form.email || !form.phone_number || !form.address || !form.district || !form.specialization) {
      setMsg({ type: "error", text: "Please fill all required fields." });
      return;
    }
    const phoneOK = /^\+94\d{9}$/.test(form.phone_number);
    if (!phoneOK) {
      setMsg({ type: "error", text: "Phone must be in +94XXXXXXXXX format." });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        experience_years: Number(form.experience_years || 0),
        profile_image: file || undefined
      };
      const res = await createApplication(payload);
      setMsg({ type: "success", text: res?.message || "Application submitted successfully." });

      // reset form
      setForm({
        full_name: "",
        email: "",
        phone_number: "",
        address: "",
        district: "",
        specialization: "",
        experience_years: "",
        note: ""
      });
      setFile(null);
      setPreview(null);
    } catch (e) {
      const t = e?.response?.data?.message || "Failed to submit application.";
      setMsg({ type: "error", text: t });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="tech-apply-form" onSubmit={onSubmit}>
      <h2>Apply to Become a Technician</h2>

      {/* Message area (now shows info by default) */}
      {msg?.text && (
        <div className={`msg ${msg.type}`} aria-live="polite">
          {msg.text}
        </div>
      )}

      <div className="grid">
        <div>
          <label>Full name *</label>
          <input name="full_name" value={form.full_name} onChange={onChange} placeholder="e.g., Sunil Perera" required />
        </div>
        <div>
          <label>Email *</label>
          <input type="email" name="email" value={form.email} onChange={onChange} placeholder="you@example.com" required />
        </div>
        <div>
          <label>Phone (+94XXXXXXXXX) *</label>
          <input name="phone_number" value={form.phone_number} onChange={onChange} placeholder="+9471XXXXXXX" required />
        </div>
        <div>
          <label>District *</label>
          <select name="district" value={form.district} onChange={onChange} required>
            <option value="" disabled>Choose district</option>
            {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label>Address *</label>
          <input name="address" value={form.address} onChange={onChange} placeholder="Street, city" required />
        </div>
        <div>
          <label>Specialization *</label>
          <input name="specialization" value={form.specialization} onChange={onChange} placeholder="Plumbing, Electrical..." required />
        </div>
        <div>
          <label>Experience (years)</label>
          <input type="number" min="0" name="experience_years" value={form.experience_years} onChange={onChange} placeholder="0" />
        </div>
        <div className="file-col">
          <label>Profile photo</label>
          <label className="file-input-label">
            <input className="file-input" type="file" accept="image/*" onChange={onPick} />
            {file?.name || "Choose an image…"}
          </label>
          {preview && <img className="preview" src={preview} alt="preview" />}
        </div>
        <div className="full">
          <label>Note to admin (optional)</label>
          <textarea name="note" rows="3" value={form.note} onChange={onChange} placeholder="Any extra details…" />
        </div>
      </div>

      <button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit Application"}
      </button>

      {/* Removed the bottom hint per your request */}
    </form>
  );
}
