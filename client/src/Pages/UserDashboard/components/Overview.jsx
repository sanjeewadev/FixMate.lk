import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ClipboardList,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import api from "../../../lib/api";
import "./Overview.css";

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

function getStatusClass(value) {
  const status = String(value || "").toLowerCase();

  if (status.includes("complete")) return "isCompleted";
  if (status.includes("approve") || status.includes("schedul")) {
    return "isApproved";
  }
  if (status.includes("pend")) return "isPending";
  if (status.includes("cancel") || status.includes("decline")) {
    return "isDanger";
  }

  return "";
}

export default function Overview() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/api/bookings/mine");

      setList(data?.bookings || data || []);
    } catch (err) {
      setList([]);
      setError(
        err?.response?.data?.message || "Failed to load dashboard overview.",
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
          setList(data?.bookings || data || []);
        }
      } catch (err) {
        if (!dead) {
          setList([]);
          setError(
            err?.response?.data?.message ||
              "Failed to load dashboard overview.",
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

  const stats = useMemo(() => {
    const result = {
      total: list.length,
      pending: 0,
      approved: 0,
      completed: 0,
    };

    list.forEach((booking) => {
      const status = String(booking.status || "").toLowerCase();

      if (status.includes("pend")) {
        result.pending += 1;
      } else if (status.includes("approve") || status.includes("schedul")) {
        result.approved += 1;
      } else if (status.includes("complete")) {
        result.completed += 1;
      }
    });

    return result;
  }, [list]);

  const recent = useMemo(() => {
    return [...list].slice(0, 5);
  }, [list]);

  return (
    <section className="fm-user-overview">
      <div className="fm-user-overview__header">
        <div>
          <span className="fm-user-overview__eyebrow">Customer Dashboard</span>

          <h1>Overview</h1>

          <p>
            Review your booking summary, recent service requests, and current
            progress across pending, approved, and completed jobs.
          </p>
        </div>

        <button
          type="button"
          className="fm-user-overview__btn fm-user-overview__btn--outline"
          onClick={loadBookings}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="fm-user-overview__notice fm-user-overview__notice--error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="fm-user-overview__summaryGrid">
        <article className="fm-user-overview__summaryCard">
          <span>
            <ClipboardList size={17} />
          </span>

          <div>
            <strong>{stats.total}</strong>
            <p>Total bookings</p>
          </div>
        </article>

        <article className="fm-user-overview__summaryCard">
          <span>
            <Clock3 size={17} />
          </span>

          <div>
            <strong>{stats.pending}</strong>
            <p>Pending</p>
          </div>
        </article>

        <article className="fm-user-overview__summaryCard">
          <span>
            <ShieldCheck size={17} />
          </span>

          <div>
            <strong>{stats.approved}</strong>
            <p>Approved</p>
          </div>
        </article>

        <article className="fm-user-overview__summaryCard">
          <span>
            <CheckCircle2 size={17} />
          </span>

          <div>
            <strong>{stats.completed}</strong>
            <p>Completed</p>
          </div>
        </article>
      </div>

      <section className="fm-user-overview__card">
        <div className="fm-user-overview__cardHeader">
          <div>
            <span>Recent activity</span>
            <h2>Recent Bookings</h2>
          </div>
        </div>

        {loading ? (
          <div className="fm-user-overview__empty">
            <RefreshCw size={24} />
            <strong>Loading bookings</strong>
            <span>Please wait while your recent bookings are loaded.</span>
          </div>
        ) : recent.length === 0 ? (
          <div className="fm-user-overview__empty">
            <ClipboardList size={24} />
            <strong>No bookings yet</strong>
            <span>Your recent service bookings will appear here.</span>
          </div>
        ) : (
          <div className="fm-user-overview__tableWrap">
            <table className="fm-user-overview__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recent.map((booking) => (
                  <tr key={booking._id}>
                    <td>{formatDate(booking.preferredAt)}</td>

                    <td>
                      <div className="fm-user-overview__titleCell">
                        <strong>{getServiceName(booking)}</strong>
                        <small>{booking.problemTitle || booking._id}</small>
                      </div>
                    </td>

                    <td>
                      <span
                        className={`fm-user-overview__status ${getStatusClass(
                          booking.status,
                        )}`}>
                        {booking.status || "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
