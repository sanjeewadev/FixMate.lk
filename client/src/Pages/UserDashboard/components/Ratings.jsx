import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Star,
  StarHalf,
} from "lucide-react";

import api from "../../../lib/api.js";
import RateBookingModal from "./Rating/RateBookingModal.jsx";
import "./Ratings.css";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleDateString();
  } catch {
    return "—";
  }
}

function getServiceName(booking) {
  return booking?.service?.name || booking?.serviceName || "—";
}

export default function Ratings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/api/bookings/mine");

      setBookings(data?.bookings || data || []);
    } catch (err) {
      setBookings([]);
      setError(
        err?.response?.data?.message ||
          "Failed to load your completed bookings.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let dead = false;

    async function run() {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get("/api/bookings/mine");

        if (!dead) {
          setBookings(data?.bookings || data || []);
        }
      } catch (err) {
        if (!dead) {
          setBookings([]);
          setError(
            err?.response?.data?.message ||
              "Failed to load your completed bookings.",
          );
        }
      } finally {
        if (!dead) {
          setLoading(false);
        }
      }
    }

    run();

    return () => {
      dead = true;
    };
  }, []);

  const completed = useMemo(() => {
    return (bookings || []).filter((booking) =>
      /complete/i.test(String(booking.status || "")),
    );
  }, [bookings]);

  const toRate = useMemo(() => {
    return completed.filter((booking) => !booking.rating?.stars);
  }, [completed]);

  const rated = useMemo(() => {
    return completed.filter((booking) => Boolean(booking.rating?.stars));
  }, [completed]);

  const handleSaved = (rating) => {
    setBookings((current) =>
      current.map((booking) =>
        booking._id === editing?._id
          ? {
              ...booking,
              rating,
            }
          : booking,
      ),
    );
  };

  return (
    <section className="fm-user-ratings">
      <div className="fm-user-ratings__header">
        <div>
          <span className="fm-user-ratings__eyebrow">Service Feedback</span>

          <h1>Ratings</h1>

          <p>
            Rate your completed services and review feedback you already
            submitted for previous FixMate.lk bookings.
          </p>
        </div>

        <button
          type="button"
          className="fm-user-ratings__btn fm-user-ratings__btn--outline"
          onClick={loadBookings}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="fm-user-ratings__notice fm-user-ratings__notice--error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="fm-user-ratings__summaryGrid">
        <article className="fm-user-ratings__summaryCard">
          <span>
            <CheckCircle2 size={17} />
          </span>

          <div>
            <strong>{completed.length}</strong>
            <p>Completed services</p>
          </div>
        </article>

        <article className="fm-user-ratings__summaryCard">
          <span>
            <Star size={17} />
          </span>

          <div>
            <strong>{toRate.length}</strong>
            <p>Waiting for rating</p>
          </div>
        </article>

        <article className="fm-user-ratings__summaryCard">
          <span>
            <StarHalf size={17} />
          </span>

          <div>
            <strong>{rated.length}</strong>
            <p>Already rated</p>
          </div>
        </article>
      </div>

      {loading ? (
        <section className="fm-user-ratings__card">
          <div className="fm-user-ratings__empty">
            <RefreshCw size={24} />
            <strong>Loading ratings</strong>
            <span>Please wait while your completed bookings are loaded.</span>
          </div>
        </section>
      ) : (
        <>
          <section className="fm-user-ratings__card">
            <div className="fm-user-ratings__cardHeader">
              <div>
                <span>Action required</span>
                <h2>To Rate</h2>
              </div>
            </div>

            <div className="fm-user-ratings__tableWrap">
              <table className="fm-user-ratings__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Service</th>
                    <th className="fm-user-ratings__actionsCol">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {toRate.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <div className="fm-user-ratings__empty isCompact">
                          <span>
                            No completed services waiting for a rating.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    toRate.map((booking) => (
                      <tr key={booking._id}>
                        <td>{formatDate(booking.preferredAt)}</td>

                        <td>
                          <div className="fm-user-ratings__titleCell">
                            <strong>{getServiceName(booking)}</strong>
                            <small>{booking.problemTitle || booking._id}</small>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="fm-user-ratings__linkBtn"
                            onClick={() => setEditing(booking)}>
                            Rate
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="fm-user-ratings__card">
            <div className="fm-user-ratings__cardHeader">
              <div>
                <span>Submitted feedback</span>
                <h2>My Ratings</h2>
              </div>
            </div>

            <div className="fm-user-ratings__tableWrap">
              <table className="fm-user-ratings__table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Rating</th>
                    <th>Comment</th>
                    <th className="fm-user-ratings__actionsCol">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {rated.length === 0 ? (
                    <tr>
                      <td colSpan={5}>
                        <div className="fm-user-ratings__empty isCompact">
                          <span>No ratings yet.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    rated.map((booking) => (
                      <tr key={booking._id}>
                        <td>{formatDate(booking.preferredAt)}</td>

                        <td>
                          <div className="fm-user-ratings__titleCell">
                            <strong>{getServiceName(booking)}</strong>
                            <small>{booking.problemTitle || booking._id}</small>
                          </div>
                        </td>

                        <td>
                          <span className="fm-user-ratings__stars">
                            <Star size={14} />
                            {booking.rating.stars}
                          </span>
                        </td>

                        <td>{booking.rating.comment || "—"}</td>

                        <td>
                          <button
                            type="button"
                            className="fm-user-ratings__linkBtn"
                            onClick={() => setEditing(booking)}>
                            Update
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {editing ? (
        <RateBookingModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </section>
  );
}
