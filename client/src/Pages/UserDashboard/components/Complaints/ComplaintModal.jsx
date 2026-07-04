import React, { useEffect, useState } from "react";
import { AlertCircle, X } from "lucide-react";

import { createComplaint } from "../../../../services/complaints.js";
import "./ComplaintModal.css";

export default function ComplaintModal({
  bookingId = null,
  onClose,
  onCreated,
}) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function submit(event) {
    event.preventDefault();
    setMsg(null);

    if (!title.trim()) {
      setMsg({
        type: "error",
        text: "Title is required.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const complaint = await createComplaint({
        bookingId,
        title: title.trim(),
        details: details.trim(),
      });

      onCreated?.(complaint);
      onClose?.();
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message ||
          "Failed to create complaint. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fm-complaint-modal"
      role="dialog"
      aria-modal="true"
      aria-label="New complaint"
      onClick={onClose}>
      <div
        className="fm-complaint-modal__card"
        onClick={(event) => event.stopPropagation()}>
        <header className="fm-complaint-modal__header">
          <div>
            <span>Customer Complaint</span>
            <h2>New Complaint</h2>
          </div>

          <button
            type="button"
            className="fm-complaint-modal__close"
            onClick={onClose}
            aria-label="Close">
            <X size={16} />
          </button>
        </header>

        {msg?.text ? (
          <div
            className={`fm-complaint-modal__msg fm-complaint-modal__msg--${msg.type}`}>
            <AlertCircle size={16} />
            <span>{msg.text}</span>
          </div>
        ) : null}

        <form className="fm-complaint-modal__form" onSubmit={submit}>
          <label htmlFor="complaint-title">Title *</label>

          <input
            id="complaint-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short summary"
            required
          />

          <label htmlFor="complaint-details">Details</label>

          <textarea
            id="complaint-details"
            rows="4"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
            placeholder="Describe the issue"
          />

          <div className="fm-complaint-modal__actions">
            <button
              type="button"
              className="fm-complaint-modal__btn fm-complaint-modal__btn--outline"
              onClick={onClose}>
              Cancel
            </button>

            <button
              type="submit"
              className="fm-complaint-modal__btn fm-complaint-modal__btn--primary"
              disabled={submitting}>
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
