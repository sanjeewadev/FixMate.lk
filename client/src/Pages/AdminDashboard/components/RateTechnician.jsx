// src/Pages/AdminDashboard/components/RateTechnician.jsx
import React, { useState } from "react";
import axios from "axios";
import "./RateTechnician.css";

export default function RateTechnician({ booking, role }) {
  // 🛑 If booking is not yet loaded
  if (!booking) {
    return <p className="no-rating">Loading booking...</p>;
  }

  const [stars, setStars] = useState(booking?.rating?.stars || 0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(booking?.rating?.comment || "");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(!!booking?.rating);

  // ✅ Customer can submit only if booking is completed and not yet rated
  const canRate =
    role === "customer" && booking.status === "completed" && !booking.rating;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (stars < 1) {
      setMessage("Please select a star rating");
      return;
    }
    try {
      const res = await axios.patch(
        `/api/bookings/${booking._id}/rate`,
        { stars, comment },
        { withCredentials: true }
      );
      setMessage(res.data.message || "Submitted!");
      setSubmitted(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error submitting rating");
    }
  };

  // ✅ Read-only mode (already rated OR not a customer)
  if (submitted || booking.rating || role !== "customer") {
    const r = booking.rating || { stars, comment, createdAt: new Date() };
    return (
      <div className="rate-technician">
        <h4>Technician Rating</h4>
        <div className="stars">
          {[1, 2, 3, 4, 5].map((s) => (
            <span key={s} className={s <= r.stars ? "star filled" : "star"}>
              ★
            </span>
          ))}
        </div>
        <p className="comment">{r.comment || "No comment provided."}</p>
        {r.createdAt && (
          <p className="date">Rated on {new Date(r.createdAt).toLocaleString()}</p>
        )}
        {message && <p className="msg">{message}</p>}
      </div>
    );
  }

  // ✅ Rating form (customer only, completed, no rating yet)
  return (
    <div className="rate-technician">
      <h4>Rate Your Technician</h4>
      {message && <p className="msg">{message}</p>}

      <form onSubmit={handleSubmit} className="rating-form">
        <div className="stars">
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={star <= (hover || stars) ? "star filled" : "star"}
              onClick={() => setStars(star)}
              onMouseEnter={() => setHover(star)}
              onMouseLeave={() => setHover(0)}
            >
              ★
            </span>
          ))}
        </div>

        <textarea
          placeholder="Leave a comment (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        ></textarea>

        <button type="submit" className="btn">Submit Rating</button>
      </form>
    </div>
  );
}
