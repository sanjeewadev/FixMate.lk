import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, RefreshCw } from "lucide-react";

import api from "../../../lib/api";
import "./ApprovedTab.css";

const fmt = (value) => {
  if (!value) return "—";

  try {
    return format(new Date(value), "PPpp");
  } catch {
    return "—";
  }
};

export default function CompletedTab() {
  const [completed, setCompleted] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const loadCompleted = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const { data } = await api.get(
        "/api/technician/bookings/mine?status=completed",
      );

      setCompleted(Array.isArray(data) ? data : []);
    } catch (error) {
      setCompleted([]);
      setErr(
        error?.response?.data?.message || "Failed to load completed requests.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCompleted();
  }, [loadCompleted]);

  return (
    <section className="fm-tech-tabs">
      <div className="fm-tech-tabs__header">
        <div>
          <span className="fm-tech-tabs__eyebrow">Completed Work</span>
          <h1>Completed Requests</h1>
          <p>
            View completed technician jobs and the service request details
            linked to your completed work.
          </p>
        </div>

        <button
          type="button"
          className="fm-tech-tabs__btn fm-tech-tabs__btn--outline"
          onClick={loadCompleted}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className="fm-tech-tabs__notice fm-tech-tabs__notice--error">
          {err}
        </div>
      ) : null}

      <section className="fm-tech-tabs__card">
        <div className="fm-tech-tabs__cardHeader">
          <div>
            <span>Completed records</span>
            <h2>Completed Jobs</h2>
          </div>
        </div>

        <div className="fm-tech-tabs__tableWrap">
          <table className="fm-tech-tabs__table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Problem</th>
                <th>Preferred Date</th>
              </tr>
            </thead>

            <tbody>
              {completed.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="fm-tech-tabs__empty">
                      <CheckCircle2 size={24} />
                      <strong>No completed requests</strong>
                      <span>Completed service requests will appear here.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                completed.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.service?.name || "—"}</td>

                    <td>
                      <div className="fm-tech-tabs__titleCell">
                        <strong>{booking.problemTitle || "—"}</strong>
                        <small>{booking._id}</small>
                      </div>
                    </td>

                    <td>{fmt(booking.preferredAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
