import React, { useState } from "react";
import { rateBooking } from "../../../../services/ratings.js";
import "./RateBookingModal.css";

export default function RateBookingModal({ booking, onClose, onSaved }) {
  const [stars, setStars] = useState(Number(booking?.rating?.stars || 0));
  const [comment, setComment] = useState(booking?.rating?.comment || "");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!stars) { setMsg({ type: "error", text: "Please pick 1–5 stars." }); return; }
    try {
      setSubmitting(true);
      const res = await rateBooking(booking._id, { stars, comment });
      onSaved?.(res.rating);
      onClose?.();
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Rating failed" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rateBack" role="dialog" aria-modal="true">
      <div className="rateCard">
        <header className="rateHead">
          <div className="rateTitle">Rate this service</div>
          <button className="rateX" onClick={onClose} aria-label="Close">×</button>
        </header>

        {msg?.text && <div className={`rateMsg ${msg.type}`}>{msg.text}</div>}

        <form className="rateForm" onSubmit={submit}>
          <label>Stars</label>
          <div className="stars" role="radiogroup" aria-label="Rating">
            {[1,2,3,4,5].map(n => (
              <button
                key={n}
                type="button"
                className={`star ${n <= stars ? "on" : ""}`}
                aria-checked={n === stars}
                role="radio"
                onClick={() => setStars(n)}
              >★</button>
            ))}
          </div>

          <label>Comment (optional)</label>
          <textarea rows="4" value={comment} onChange={(e)=>setComment(e.target.value)} />

          <div className="rateActions">
            <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn primary" disabled={submitting || !stars}>
              {submitting ? "Saving…" : "Submit rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
