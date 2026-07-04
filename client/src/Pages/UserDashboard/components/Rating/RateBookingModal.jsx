import React, { useEffect, useState } from "react";
import { AlertCircle, Star, X } from "lucide-react";

import { rateBooking } from "../../../../services/ratings.js";
import "./RateBookingModal.css";

export default function RateBookingModal({ booking, onClose, onSaved }) {
  const [stars, setStars] = useState(Number(booking?.rating?.stars || 0));
  const [comment, setComment] = useState(booking?.rating?.comment || "");
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

    if (!stars) {
      setMsg({
        type: "error",
        text: "Please pick 1 to 5 stars.",
      });
      return;
    }

    try {
      setSubmitting(true);

      const result = await rateBooking(booking._id, {
        stars,
        comment,
      });

      onSaved?.(result.rating);
      onClose?.();
    } catch (err) {
      setMsg({
        type: "error",
        text: err?.response?.data?.message || "Rating failed.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fm-rate-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Rate this service"
      onClick={onClose}>
      <div
        className="fm-rate-modal__card"
        onClick={(event) => event.stopPropagation()}>
        <header className="fm-rate-modal__header">
          <div>
            <span>Service Rating</span>
            <h2>Rate this service</h2>
          </div>

          <button
            type="button"
            className="fm-rate-modal__close"
            onClick={onClose}
            aria-label="Close">
            <X size={16} />
          </button>
        </header>

        {msg?.text ? (
          <div className={`fm-rate-modal__msg fm-rate-modal__msg--${msg.type}`}>
            <AlertCircle size={16} />
            <span>{msg.text}</span>
          </div>
        ) : null}

        <form className="fm-rate-modal__form" onSubmit={submit}>
          <div className="fm-rate-modal__booking">
            <span>Service</span>
            <strong>
              {booking?.service?.name || booking?.serviceName || "Service"}
            </strong>
            <small>{booking?.problemTitle || booking?._id}</small>
          </div>

          <label>Stars</label>

          <div
            className="fm-rate-modal__stars"
            role="radiogroup"
            aria-label="Rating">
            {[1, 2, 3, 4, 5].map((number) => (
              <button
                key={number}
                type="button"
                className={`fm-rate-modal__star ${
                  number <= stars ? "isOn" : ""
                }`}
                aria-checked={number === stars}
                role="radio"
                onClick={() => setStars(number)}>
                <Star size={28} />
              </button>
            ))}
          </div>

          <label htmlFor="rating-comment">Comment optional</label>

          <textarea
            id="rating-comment"
            rows="4"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="Write a short comment about the service"
          />

          <div className="fm-rate-modal__actions">
            <button
              type="button"
              className="fm-rate-modal__btn fm-rate-modal__btn--outline"
              onClick={onClose}>
              Cancel
            </button>

            <button
              type="submit"
              className="fm-rate-modal__btn fm-rate-modal__btn--primary"
              disabled={submitting || !stars}>
              {submitting ? "Saving..." : "Submit rating"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
