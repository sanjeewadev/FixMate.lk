import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { downloadReceiptPdf } from "../../services/receipts";
import "./MyBookings.css";

export default function MyBookings() {
  const [raw, setRaw] = useState([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await api.get("/api/bookings/mine");
        if (!dead) setRaw(data?.bookings || data || []);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  const list = useMemo(() => {
    if (status === "all") return raw;
    return raw.filter((b) => (b.status || "").toLowerCase().includes(status));
  }, [raw, status]);

  return (
    <div className="mbWrap">
      <h2 className="mbTitle" style={{ marginBottom: 16 }}>Service History</h2>

      <div className="mbFilters">
        {["all", "pending", "approve", "schedul", "complete"].map((s) => (
          <button
            key={s}
            className={`mbChip ${status === s ? "is-active" : ""}`}
            onClick={() => setStatus(s)}
          >
            {s === "schedul" ? "scheduled" : s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="mbCard">Loading…</div>
      ) : list.length === 0 ? (
        <div className="mbCard">No bookings for this filter.</div>
      ) : (
        <div className="mbCard">
          <table className="mbTable">
            <thead>
              <tr>
                <th>Date</th>
                <th>Service</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => {
                const isCompleted =
                  String(b.status || "").toLowerCase() === "completed";
                return (
                  <tr key={b._id}>
                    <td>
                      {b.preferredAt
                        ? new Date(b.preferredAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td>{b.service?.name || b.serviceName || "—"}</td>
                    <td>{b.status || "—"}</td>
                    <td>
                      {isCompleted ? (
                        <>
                          <button
                            className="mbLink"
                            onClick={async () => {
                              try {
                                await downloadReceiptPdf(b._id);
                              } catch (e) {
                                alert(
                                  e.message ||
                                    "Receipt not available yet for this booking."
                                );
                              }
                            }}
                          >
                          Download PDF
                        </button>
                        {" | "}
                        <button
                          className="mbLink"
                          onClick={() =>
                            navigate(`/UserDashboard/booking/${b._id}`)
                          }
                        >
                          View
                        </button>
                        </>
                      ) : (
                        <button
                          className="mbLink"
                          onClick={() =>
                            navigate(`/UserDashboard/booking/${b._id}`)
                          }
                        >
                          View
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
