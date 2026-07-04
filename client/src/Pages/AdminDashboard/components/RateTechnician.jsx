import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  MessageSquareText,
  Send,
  Star,
} from "lucide-react";

import api from "../../../lib/api";
import "./RateTechnician.css";

function RatingStars({
  value = 0,
  hover = 0,
  readOnly = false,
  onChange,
  onHover,
}) {
  const activeValue = hover || value;

  return (
    <div
      className="fm-admin-rate__stars"
      aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`fm-admin-rate__star ${
            star <= activeValue ? "isFilled" : ""
          } ${readOnly ? "isReadonly" : ""}`}
          onClick={() => {
            if (!readOnly) onChange?.(star);
          }}
          onMouseEnter={() => {
            if (!readOnly) onHover?.(star);
          }}
          onMouseLeave={() => {
            if (!readOnly) onHover?.(0);
          }}
          disabled={readOnly}
          aria-label={`${star} star${star > 1 ? "s" : ""}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function RateTechnician({ booking, role }) {
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!booking) return;

    setStars(Number(booking?.rating?.stars || 0));
    setComment(booking?.rating?.comment || "");
    setSubmitted(Boolean(booking?.rating));
    setMessage(null);
  }, [booking?._id, booking?.rating?.stars, booking?.rating?.comment]);

  const canRate = useMemo(() => {
    return (
      role === "customer" &&
      booking?.status === "completed" &&
      !booking?.rating &&
      !submitted
    );
  }, [booking?.rating, booking?.status, role, submitted]);

  if (!booking) {
    return (
      <div className="fm-admin-rate fm-admin-rate--empty">
        <Clock3 size={18} />
        <span>Loading booking...</span>
      </div>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (stars < 1) {
      setMessage({
        type: "error",
        text: "Please select a star rating.",
      });
      return;
    }

    try {
      setSaving(true);
      setMessage(null);

      const { data } = await api.patch(`/api/bookings/${booking._id}/rate`, {
        stars,
        comment,
      });

      setMessage({
        type: "success",
        text: data?.message || "Rating submitted successfully.",
      });

      setSubmitted(true);
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Error submitting rating.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!canRate) {
    const rating = booking.rating || {
      stars,
      comment,
      createdAt: submitted ? new Date() : null,
    };

    return (
      <section className="fm-admin-rate">
        <div className="fm-admin-rate__header">
          <div className="fm-admin-rate__icon">
            <Star size={18} />
          </div>

          <div>
            <h4>Technician Rating</h4>
            <p>Customer feedback for this completed booking.</p>
          </div>
        </div>

        <RatingStars value={Number(rating?.stars || 0)} readOnly />

        <div className="fm-admin-rate__readonlyComment">
          <MessageSquareText size={16} />
          <p>{rating?.comment || "No comment provided."}</p>
        </div>

        {rating?.createdAt ? (
          <div className="fm-admin-rate__date">
            <Clock3 size={14} />
            <span>Rated on {new Date(rating.createdAt).toLocaleString()}</span>
          </div>
        ) : null}

        {message?.text ? (
          <div
            className={`fm-admin-rate__notice fm-admin-rate__notice--${message.type}`}
            role="status"
            aria-live="polite">
            {message.type === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <MessageSquareText size={16} />
            )}
            <span>{message.text}</span>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section className="fm-admin-rate">
      <div className="fm-admin-rate__header">
        <div className="fm-admin-rate__icon">
          <Star size={18} />
        </div>

        <div>
          <h4>Rate Your Technician</h4>
          <p>Select a rating and add an optional comment.</p>
        </div>
      </div>

      {message?.text ? (
        <div
          className={`fm-admin-rate__notice fm-admin-rate__notice--${message.type}`}
          role="status"
          aria-live="polite">
          {message.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <MessageSquareText size={16} />
          )}
          <span>{message.text}</span>
        </div>
      ) : null}

      <form className="fm-admin-rate__form" onSubmit={handleSubmit}>
        <RatingStars
          value={stars}
          hover={hover}
          onChange={setStars}
          onHover={setHover}
        />

        <label className="fm-admin-rate__field">
          <span>Comment</span>
          <textarea
            placeholder="Leave a comment. This is optional."
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>

        <button type="submit" className="fm-admin-rate__btn" disabled={saving}>
          <Send size={15} />
          {saving ? "Submitting..." : "Submit Rating"}
        </button>
      </form>
    </section>
  );
}
