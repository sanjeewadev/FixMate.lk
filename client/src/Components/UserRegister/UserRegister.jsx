import React, { useEffect, useMemo, useState } from "react";

import api from "../../lib/api";

import "./UserRegister.css";

const SRI_LANKA_DISTRICTS = [
  "Ampara",
  "Anuradhapura",
  "Badulla",
  "Batticaloa",
  "Colombo",
  "Galle",
  "Gampaha",
  "Hambantota",
  "Jaffna",
  "Kalutara",
  "Kandy",
  "Kegalle",
  "Kilinochchi",
  "Kurunegala",
  "Mannar",
  "Matale",
  "Matara",
  "Monaragala",
  "Mullaitivu",
  "Nuwara Eliya",
  "Polonnaruwa",
  "Puttalam",
  "Ratnapura",
  "Trincomalee",
  "Vavuniya",
];

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  confirmPassword: "",
  phone: "",
  address: "",
  district: "",
};

export default function UserRegister({ onSwitch }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(initialForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [msg, setMsg] = useState({
    type: "info",
    text: "Create a customer account to book services and manage requests.",
  });

  const [loading, setLoading] = useState(false);

  const stepLabel = useMemo(() => {
    return step === 1 ? "Account details" : "Contact details";
  }, [step]);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const update = (name, value) => {
    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (msg?.type === "error") {
      setMsg(null);
    }
  };

  const onImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMsg({
        type: "error",
        text: "Please select a valid image file.",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMsg({
        type: "error",
        text: "Profile image must be smaller than 5MB.",
      });
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));

    setMsg({
      type: "info",
      text: "Profile image selected.",
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setImageFile(null);
    setStep(1);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(null);
  };

  const validateStepOne = () => {
    if (!form.fullName.trim()) return "Please enter your full name.";
    if (!form.email.trim()) return "Please enter your email address.";

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Please enter a valid email address.";
    }

    if (!form.password) return "Please enter a password.";

    if (form.password.length < 6) {
      return "Password must be at least 6 characters.";
    }

    if (form.password !== form.confirmPassword) {
      return "Passwords do not match.";
    }

    return null;
  };

  const validateStepTwo = () => {
    if (!form.district) return "Please select your district.";
    if (!form.address.trim()) return "Please enter your address.";
    return null;
  };

  const goNext = () => {
    const validationMessage = validateStepOne();

    if (validationMessage) {
      setMsg({
        type: "error",
        text: validationMessage,
      });
      return;
    }

    setMsg({
      type: "info",
      text: "Now add your contact and location details.",
    });

    setStep(2);
  };

  const goBack = () => {
    setMsg({
      type: "info",
      text: "Review or update your account details.",
    });

    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg(null);

    const stepOneError = validateStepOne();
    const stepTwoError = validateStepTwo();

    if (stepOneError) {
      setStep(1);
      setMsg({ type: "error", text: stepOneError });
      return;
    }

    if (stepTwoError) {
      setStep(2);
      setMsg({ type: "error", text: stepTwoError });
      return;
    }

    try {
      setLoading(true);

      const fd = new FormData();
      fd.append("full_name", form.fullName.trim());
      fd.append("email", form.email.trim());
      fd.append("password", form.password);
      fd.append("address", form.address.trim());
      fd.append("district", form.district);

      if (form.phone.trim()) {
        fd.append("phone_number", form.phone.trim());
      }

      if (imageFile) {
        fd.append("profileImage", imageFile);
      }

      const { data } = await api.post("/api/customer/register", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg({
        type: "success",
        text:
          data?.message || "Account created successfully. You can log in now.",
      });

      resetForm();

      setTimeout(() => {
        onSwitch?.();
      }, 900);
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Registration failed. Please check your details and try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="fm-user-register" onSubmit={handleSubmit} noValidate>
      <div className="fm-user-register__header">
        <span className="fm-user-register__eyebrow">Customer account</span>

        <h2>{stepLabel}</h2>

        <p>
          {step === 1
            ? "Create your FixMate login account."
            : "Add your contact and location details."}
        </p>
      </div>

      <div
        className="fm-user-register__steps"
        aria-label="Registration progress">
        <span
          className={`fm-user-register__step ${
            step === 1 ? "fm-user-register__step--active" : ""
          }`}>
          1. Account
        </span>

        <span
          className={`fm-user-register__step ${
            step === 2 ? "fm-user-register__step--active" : ""
          }`}>
          2. Contact
        </span>
      </div>

      {msg?.text ? (
        <div
          className={`fm-user-register__notice fm-user-register__notice--${msg.type}`}
          role="status"
          aria-live="polite">
          {msg.text}
        </div>
      ) : null}

      {step === 1 ? (
        <div className="fm-user-register__grid">
          <div className="fm-user-register__field fm-user-register__field--full">
            <label htmlFor="fm-register-full-name">Full name *</label>

            <input
              id="fm-register-full-name"
              type="text"
              placeholder="e.g., Tharindu Perera"
              value={form.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="fm-user-register__field fm-user-register__field--full">
            <label htmlFor="fm-register-email">Email *</label>

            <input
              id="fm-register-email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="fm-user-register__field">
            <label htmlFor="fm-register-password">Password *</label>

            <input
              id="fm-register-password"
              type="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="fm-user-register__field">
            <label htmlFor="fm-register-confirm-password">
              Confirm password *
            </label>

            <input
              id="fm-register-confirm-password"
              type="password"
              placeholder="Re-enter password"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              disabled={loading}
              required
            />
          </div>
        </div>
      ) : (
        <div className="fm-user-register__grid">
          <div className="fm-user-register__field">
            <label htmlFor="fm-register-phone">Phone</label>

            <input
              id="fm-register-phone"
              type="tel"
              placeholder="e.g., +94 7X XXX XXXX"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="fm-user-register__field">
            <label htmlFor="fm-register-district">District *</label>

            <select
              id="fm-register-district"
              value={form.district}
              onChange={(e) => update("district", e.target.value)}
              disabled={loading}
              required>
              <option value="" disabled>
                Select district
              </option>

              {SRI_LANKA_DISTRICTS.map((district) => (
                <option key={district} value={district}>
                  {district}
                </option>
              ))}
            </select>
          </div>

          <div className="fm-user-register__field fm-user-register__field--full">
            <label htmlFor="fm-register-address">Address *</label>

            <input
              id="fm-register-address"
              type="text"
              placeholder="Street, city"
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="fm-user-register__field fm-user-register__field--full">
            <label htmlFor="fm-register-profile-image">Profile image</label>

            <div className="fm-user-register__uploadRow">
              <label
                className="fm-user-register__fileLabel"
                htmlFor="fm-register-profile-image">
                <input
                  id="fm-register-profile-image"
                  className="fm-user-register__fileInput"
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  disabled={loading}
                />

                <span>{imageFile?.name || "Choose profile image"}</span>
              </label>

              {imagePreview ? (
                <img
                  className="fm-user-register__preview"
                  src={imagePreview}
                  alt="Selected profile preview"
                />
              ) : null}
            </div>
          </div>
        </div>
      )}

      <div className="fm-user-register__actions">
        {step === 2 ? (
          <button
            className="fm-user-register__button fm-user-register__button--secondary"
            type="button"
            onClick={goBack}
            disabled={loading}>
            Back
          </button>
        ) : null}

        {step === 1 ? (
          <button
            className="fm-user-register__button fm-user-register__button--primary"
            type="button"
            onClick={goNext}
            disabled={loading}>
            Continue
          </button>
        ) : (
          <button
            className="fm-user-register__button fm-user-register__button--primary"
            type="submit"
            disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>
        )}
      </div>

      {onSwitch ? (
        <p className="fm-user-register__switchText">
          Already have an account?{" "}
          <button
            type="button"
            className="fm-user-register__switchButton"
            onClick={onSwitch}
            disabled={loading}>
            Login
          </button>
        </p>
      ) : null}
    </form>
  );
}
