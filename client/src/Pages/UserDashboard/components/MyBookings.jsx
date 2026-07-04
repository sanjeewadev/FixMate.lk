import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  History,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../../lib/api";
import { downloadReceiptPdf } from "../../../services/receipts";
import "./MyBookings.css";

const filters = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approve", label: "Approved" },
  { key: "schedul", label: "Scheduled" },
  { key: "complete", label: "Completed" },
];

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

function getStatusClass(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("complete")) return "isCompleted";
  if (value.includes("approve")) return "isApproved";
  if (value.includes("schedul")) return "isScheduled";
  if (value.includes("pending")) return "isPending";

  return "";
}

export default function MyBookings() {
  const [raw, setRaw] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");

  const navigate = useNavigate();

  const loadBookings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data } = await api.get("/api/bookings/mine");

      setRaw(data?.bookings || data || []);
    } catch (err) {
      setRaw([]);
      setError(
        err?.response?.data?.message || "Failed to load your service history.",
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
          setRaw(data?.bookings || data || []);
        }
      } catch (err) {
        if (!dead) {
          setRaw([]);
          setError(
            err?.response?.data?.message ||
              "Failed to load your service history.",
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

  const list = useMemo(() => {
    if (status === "all") return raw;

    return raw.filter((booking) =>
      String(booking.status || "")
        .toLowerCase()
        .includes(status),
    );
  }, [raw, status]);

  const completedCount = useMemo(() => {
    return raw.filter((booking) =>
      String(booking.status || "")
        .toLowerCase()
        .includes("complete"),
    ).length;
  }, [raw]);

  const pendingCount = useMemo(() => {
    return raw.filter((booking) =>
      String(booking.status || "")
        .toLowerCase()
        .includes("pending"),
    ).length;
  }, [raw]);

  const handleDownload = async (bookingId) => {
    try {
      setDownloadingId(bookingId);
      await downloadReceiptPdf(bookingId);
    } catch (err) {
      alert(err.message || "Receipt not available yet for this booking.");
    } finally {
      setDownloadingId("");
    }
  };

  return (
    <section className="fm-user-bookings">
      <div className="fm-user-bookings__header">
        <div>
          <span className="fm-user-bookings__eyebrow">Booking Records</span>

          <h1>Service History</h1>

          <p>
            View your service requests, check booking status, open booking
            details, and download receipts for completed jobs.
          </p>
        </div>

        <button
          type="button"
          className="fm-user-bookings__btn fm-user-bookings__btn--outline"
          onClick={loadBookings}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div className="fm-user-bookings__notice fm-user-bookings__notice--error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="fm-user-bookings__summaryGrid">
        <article className="fm-user-bookings__summaryCard">
          <span>
            <History size={17} />
          </span>

          <div>
            <strong>{raw.length}</strong>
            <p>Total bookings</p>
          </div>
        </article>

        <article className="fm-user-bookings__summaryCard">
          <span>
            <Clock3 size={17} />
          </span>

          <div>
            <strong>{pendingCount}</strong>
            <p>Pending bookings</p>
          </div>
        </article>

        <article className="fm-user-bookings__summaryCard">
          <span>
            <CheckCircle2 size={17} />
          </span>

          <div>
            <strong>{completedCount}</strong>
            <p>Completed bookings</p>
          </div>
        </article>
      </div>

      <section className="fm-user-bookings__card">
        <div className="fm-user-bookings__cardHeader">
          <div>
            <span>History</span>
            <h2>My Bookings</h2>
          </div>

          <div
            className="fm-user-bookings__filters"
            aria-label="Booking filters">
            {filters.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`fm-user-bookings__chip ${
                  status === item.key ? "isActive" : ""
                }`}
                onClick={() => setStatus(item.key)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="fm-user-bookings__empty">
            <RefreshCw size={24} />
            <strong>Loading bookings</strong>
            <span>Please wait while your service history is loaded.</span>
          </div>
        ) : list.length === 0 ? (
          <div className="fm-user-bookings__empty">
            <History size={24} />
            <strong>No bookings found</strong>
            <span>No bookings match the selected filter.</span>
          </div>
        ) : (
          <div className="fm-user-bookings__tableWrap">
            <table className="fm-user-bookings__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Status</th>
                  <th className="fm-user-bookings__actionsCol">Actions</th>
                </tr>
              </thead>

              <tbody>
                {list.map((booking) => {
                  const isCompleted =
                    String(booking.status || "").toLowerCase() === "completed";

                  return (
                    <tr key={booking._id}>
                      <td>{formatDate(booking.preferredAt)}</td>

                      <td>
                        <div className="fm-user-bookings__titleCell">
                          <strong>{getServiceName(booking)}</strong>
                          <small>{booking.problemTitle || booking._id}</small>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`fm-user-bookings__status ${getStatusClass(
                            booking.status,
                          )}`}>
                          {booking.status || "—"}
                        </span>
                      </td>

                      <td>
                        <div className="fm-user-bookings__rowActions">
                          {isCompleted ? (
                            <button
                              type="button"
                              className="fm-user-bookings__linkBtn"
                              onClick={() => handleDownload(booking._id)}
                              disabled={downloadingId === booking._id}>
                              <Download size={14} />
                              {downloadingId === booking._id
                                ? "Downloading"
                                : "PDF"}
                            </button>
                          ) : null}

                          <button
                            type="button"
                            className="fm-user-bookings__linkBtn"
                            onClick={() =>
                              navigate(`/UserDashboard/booking/${booking._id}`)
                            }>
                            <Eye size={14} />
                            View
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
