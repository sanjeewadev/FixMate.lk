import React, { useState } from "react";
import { createComplaint } from "../../../../services/complaints.js";
import "./ComplaintModal.css";

export default function ComplaintModal({ bookingId = null, onClose, onCreated }) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!title.trim()) { setMsg({ type:"error", text:"Title is required" }); return; }
    try {
      setSubmitting(true);
      const doc = await createComplaint({ bookingId, title, details });
      onCreated?.(doc);
      onClose?.();
    } catch (e2) {
      setMsg({ type:"error", text: e2?.response?.data?.message || "Failed to create complaint" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="cmpBack" role="dialog" aria-modal="true">
      <div className="cmpCard">
        <div className="cmpHead">
          <div className="cmpTitle">New Complaint</div>
          <button className="cmpX" onClick={onClose} aria-label="Close">×</button>
        </div>
        {msg?.text && <div className={`cmpMsg ${msg.type}`}>{msg.text}</div>}
        <form className="cmpForm" onSubmit={submit}>
          <label>Title *</label>
          <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Short summary…" required />
          <label>Details</label>
          <textarea rows="4" value={details} onChange={(e)=>setDetails(e.target.value)} placeholder="Describe the issue…" />
          <div className="cmpActions">
            <button type="button" className="cmpBtn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="cmpBtn primary" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}