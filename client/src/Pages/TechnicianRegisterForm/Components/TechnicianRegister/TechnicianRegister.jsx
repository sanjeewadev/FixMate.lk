import { useEffect, useState } from "react";

import {
  createApplication,
  DISTRICTS,
  initialTechnicianForm,
  SPECIALIZATIONS,
  technicianRegisterContent,
  validateProfileImage,
  validateTechnicianForm,
} from "./TechnicianRegister.js";

import "./TechnicianRegister.css";

export default function TechnicianRegister() {
  const [form, setForm] = useState(initialTechnicianForm);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [msg, setMsg] = useState({
    type: "info",
    text: technicianRegisterContent.defaultNotice,
  });

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const updateField = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (msg?.type === "error") {
      setMsg({
        type: "info",
        text: technicianRegisterContent.defaultNotice,
      });
    }
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  const onPick = (e) => {
    const selectedFile = e.target.files?.[0];

    if (!selectedFile) return;

    const fileError = validateProfileImage(selectedFile);

    if (fileError) {
      setFile(null);
      setMsg({
        type: "error",
        text: fileError,
      });
      return;
    }

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));

    setMsg({
      type: "info",
      text: technicianRegisterContent.imageSelectedNotice,
    });
  };

  const clearImage = () => {
    setFile(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);

    setMsg({
      type: "info",
      text: technicianRegisterContent.defaultNotice,
    });
  };

  const resetForm = () => {
    setForm(initialTechnicianForm);
    setFile(null);

    if (preview) {
      URL.revokeObjectURL(preview);
    }

    setPreview(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const validationMessage = validateTechnicianForm(form);

    if (validationMessage) {
      setMsg({
        type: "error",
        text: validationMessage,
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...form,
        experience_years: Number(form.experience_years || 0),
        profile_image: file || undefined,
      };

      const res = await createApplication(payload);

      setMsg({
        type: "success",
        text: res?.message || "Application submitted successfully.",
      });

      resetForm();
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to submit application. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="fm-tech-apply" onSubmit={onSubmit} noValidate>
      <div className="fm-tech-apply__header">
        <span className="fm-tech-apply__eyebrow">
          {technicianRegisterContent.eyebrow}
        </span>

        <h2>{technicianRegisterContent.title}</h2>

        <p>{technicianRegisterContent.subtitle}</p>
      </div>

      {msg?.text ? (
        <div
          className={`fm-tech-apply__notice fm-tech-apply__notice--${msg.type}`}
          aria-live="polite">
          {msg.text}
        </div>
      ) : null}

      <div className="fm-tech-apply__grid">
        <div className="fm-tech-apply__field">
          <label htmlFor="fm-tech-full-name">Full name *</label>

          <input
            id="fm-tech-full-name"
            name="full_name"
            value={form.full_name}
            onChange={onChange}
            placeholder="e.g., Sunil Perera"
            autoComplete="name"
            disabled={submitting}
            required
          />
        </div>

        <div className="fm-tech-apply__field">
          <label htmlFor="fm-tech-email">Email *</label>

          <input
            id="fm-tech-email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="you@example.com"
            autoComplete="email"
            disabled={submitting}
            required
          />
        </div>

        <div className="fm-tech-apply__field">
          <label htmlFor="fm-tech-phone">Phone (+94XXXXXXXXX) *</label>

          <input
            id="fm-tech-phone"
            name="phone_number"
            value={form.phone_number}
            onChange={onChange}
            placeholder="+9471XXXXXXX"
            inputMode="tel"
            autoComplete="tel"
            disabled={submitting}
            required
          />
        </div>

        <div className="fm-tech-apply__field">
          <label htmlFor="fm-tech-district">District *</label>

          <select
            id="fm-tech-district"
            name="district"
            value={form.district}
            onChange={onChange}
            disabled={submitting}
            required>
            <option value="" disabled>
              Choose district
            </option>

            {DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </div>

        <div className="fm-tech-apply__field">
          <label htmlFor="fm-tech-address">Address *</label>

          <input
            id="fm-tech-address"
            name="address"
            value={form.address}
            onChange={onChange}
            placeholder="Street, city"
            autoComplete="street-address"
            disabled={submitting}
            required
          />
        </div>

        <div className="fm-tech-apply__field">
          <label htmlFor="fm-tech-specialization">Specialization *</label>

          <select
            id="fm-tech-specialization"
            name="specialization"
            value={form.specialization}
            onChange={onChange}
            disabled={submitting}
            required>
            <option value="" disabled>
              Choose specialization
            </option>

            {SPECIALIZATIONS.map((specialization) => (
              <option key={specialization} value={specialization}>
                {specialization}
              </option>
            ))}
          </select>
        </div>

        <div className="fm-tech-apply__field">
          <label htmlFor="fm-tech-experience">Experience years</label>

          <input
            id="fm-tech-experience"
            type="number"
            min="0"
            name="experience_years"
            value={form.experience_years}
            onChange={onChange}
            placeholder="0"
            inputMode="numeric"
            disabled={submitting}
          />
        </div>

        <div className="fm-tech-apply__field">
          <label htmlFor="fm-tech-photo">Profile photo</label>

          <label className="fm-tech-apply__fileLabel" htmlFor="fm-tech-photo">
            <input
              id="fm-tech-photo"
              className="fm-tech-apply__fileInput"
              type="file"
              accept="image/*"
              onChange={onPick}
              disabled={submitting}
            />

            <span>{file?.name || "Choose an image"}</span>
          </label>
        </div>

        {preview ? (
          <div className="fm-tech-apply__previewRow">
            <img
              className="fm-tech-apply__preview"
              src={preview}
              alt="Selected technician profile preview"
            />

            <div>
              <strong>Selected profile image</strong>
              <p>{file?.name}</p>

              <button type="button" onClick={clearImage} disabled={submitting}>
                Remove image
              </button>
            </div>
          </div>
        ) : null}

        <div className="fm-tech-apply__field fm-tech-apply__field--full">
          <label htmlFor="fm-tech-note">Note to admin</label>

          <textarea
            id="fm-tech-note"
            name="note"
            rows="4"
            value={form.note}
            onChange={onChange}
            placeholder="Tell us about your experience, tools, availability or service areas."
            disabled={submitting}
          />
        </div>
      </div>

      <div className="fm-tech-apply__footer">
        <button
          className="fm-tech-apply__submit"
          type="submit"
          disabled={submitting}>
          {submitting
            ? technicianRegisterContent.submittingLabel
            : technicianRegisterContent.submitLabel}
        </button>

        <p className="fm-tech-apply__hint">{technicianRegisterContent.hint}</p>
      </div>
    </form>
  );
}
