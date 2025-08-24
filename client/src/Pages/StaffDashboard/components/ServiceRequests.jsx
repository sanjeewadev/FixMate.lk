import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api.js";
import "./ServiceRequests.css";
import DistrictTechSelect from "./DistrictTechSelect.jsx";

function formatDate(s) {
  try { return new Date(s).toLocaleString(); } catch { return s || ""; }
}

export default function ServiceRequests() {
  const [unclaimed, setUnclaimed] = useState([]);
  const [awaiting, setAwaiting]   = useState([]);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState({ type: "", text: "" });

  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTech, setSelectedTech]       = useState("");

  const hasData = useMemo(
    () => (unclaimed.length + awaiting.length) > 0,
    [unclaimed, awaiting]
  );

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/coordinator/bookings/dashboard");
      setUnclaimed(res.data?.unclaimed || []);
      setAwaiting(res.data?.awaitingCoordinator || []);
      setMsg({ type: "", text: "" });
    } catch (err) {
      setMsg({ type: "error", text: err?.response?.data?.message || "Failed to load requests" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchRequests(); // initial
  const id = setInterval(fetchRequests, 15000); // refresh every 15s
  return () => clearInterval(id);
}, []);


  // close modal with ESC
  useEffect(() => {
    if (!selectedBooking) return;
    const onKey = (e) => { if (e.key === "Escape") setSelectedBooking(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedBooking]);

  const openPicker = (b) => {
  setSelectedBooking(b);

  // Preselect FIFO #1 if available
  const first = Array.isArray(b?.acceptedTechs) && b.acceptedTechs.length > 0
    ? b.acceptedTechs[0].id
    : "";

  setSelectedTech(first || "");
};

  const assignTech = async (bookingId, technicianId) => {
    if (!technicianId) return alert("Please select a technician");
    try {
      await api.post(`/api/coordinator/bookings/${bookingId}/assign`, { technicianId });
      setMsg({ type: "info", text: "Technician assigned ✅" });
      setSelectedBooking(null);
      setSelectedTech("");
      fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.message || "Error assigning technician");
    }
  };

  const reassignTech = async (bookingId, technicianId) => {
    if (!technicianId) return alert("Please select a technician");
    try {
      await api.post(`/api/coordinator/bookings/${bookingId}/reassign`, { technicianId });
      setMsg({ type: "info", text: "Technician changed 🔄" });
      setSelectedBooking(null);
      setSelectedTech("");
      fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.message || "Error changing technician");
    }
  };

  return (
    <div className="sr">
      <div className="sr-header">
        <div className="sr-title">
          <h2>Service Requests</h2>
          <div className="sr-sub">Assign new requests or approve accepted ones.</div>
        </div>
      </div>

      {msg.text && (
        <div className={`sr-alert ${msg.type === "error" ? "sr-alert--error" : "sr-alert--info"}`}>
          {msg.text}
        </div>
      )}
      
      {!loading && !hasData && (
        <div className="sr-card sr-empty">
          <div className="sr-empty-emoji">🗂️</div>
          <div className="sr-empty-text">No pending requests right now.</div>
          <button className="sr-btn sr-btn--outline" onClick={fetchRequests}>Refresh</button>
        </div>
      )}

      {unclaimed.length > 0 && (
        <section className="sr-card">
          <div className="sr-list-head">
            <h3>🟡 Unclaimed (New)</h3>
            <button className="sr-btn sr-btn--outline" onClick={fetchRequests} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Service</th>
                  <th>District</th>
                  <th>Accepted Techs</th>
                  <th>Created</th>
                  <th style={{ width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {unclaimed.map((b) => (
                  <tr key={b._id}>
                    <td className="sr-clip">{b.problemTitle}</td>
                    <td className="sr-clip">{b.service?.name || "—"}</td>
                    <td>{b.customerSnapshot?.district || "—"}</td>
                    <td>{b.acceptedCount ?? 0}</td>
                    <td>{formatDate(b.createdAt)}</td>
                    <td className="sr-row-actions">
                      <button onClick={() => openPicker(b)} className="sr-btn sr-btn--small sr-btn--primary">Assign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {awaiting.length > 0 && (
        <section className="sr-card">
          <div className="sr-list-head">
            <h3>🟢 Awaiting Coordinator Approval</h3>
            <button className="sr-btn sr-btn--outline" onClick={fetchRequests} disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="sr-table-wrap">
            <table className="sr-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Service</th>
                  <th>Accepted Techs</th>
                  <th>Created</th>
                  <th style={{ width: 180 }}></th>
                </tr>
              </thead>
              <tbody>
                {awaiting.map((b) => (
                  <tr key={b._id}>
                    <td className="sr-clip">{b.problemTitle}</td>
                    <td className="sr-clip">{b.service?.name || "—"}</td>
                    <td>{b.acceptedCount ?? 0}</td>
                    <td>{formatDate(b.createdAt)}</td>
                    <td className="sr-row-actions">
                      <button onClick={() => openPicker(b)} className="sr-btn sr-btn--small sr-btn--primary">
                        Approve & Assign
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedBooking && (
        <div className="sr-modal-overlay" onClick={() => setSelectedBooking(null)} role="dialog" aria-modal="true">
          <div className="sr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sr-modal-head">
              <h3>Choose Technician</h3>
              <button className="sr-btn sr-btn--danger sr-btn--small" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>

            <div className="sr-modal-context tiny muted">
              {selectedBooking.service?.name || "Service"} • {selectedBooking.customerSnapshot?.district || "—"}
            </div>

            {/* Show FIFO list if this booking is in 'awaiting_coordinator' and has accepted techs */}
{selectedBooking?.status === 'awaiting_coordinator' && Array.isArray(selectedBooking?.acceptedTechs) && selectedBooking.acceptedTechs.length > 0 && (
  <div className="sr-fifo">
    <div className="sr-fifo-head">
      <strong>Accepted (First‑Come‑First‑Serve)</strong>
      <span className="tiny muted">Earliest responders first</span>
    </div>
    <ol className="sr-fifo-list">
      {selectedBooking.acceptedTechs.map((t, i) => (
        <li key={t.id} className={`sr-fifo-item ${selectedTech === t.id ? 'is-selected' : ''}`}>
          <div className="sr-fifo-main">
            <span className="sr-fifo-rank">#{i + 1}</span>
            <span className="sr-fifo-name">{t.full_name}</span>
            {t.district && <span className="sr-fifo-dot">·</span>}
            {t.district && <span className="sr-fifo-district">{t.district}</span>}
            {t.respondedAt && (
              <>
                <span className="sr-fifo-dot">·</span>
                <span className="sr-fifo-time tiny">{new Date(t.respondedAt).toLocaleString()}</span>
              </>
            )}
          </div>
          <div className="sr-fifo-actions">
            <button
              type="button"
              className="sr-btn sr-btn--sm"
              onClick={() => setSelectedTech(t.id)}
            >
              Select
            </button>
            <button
              type="button"
              className="sr-btn sr-btn--sm sr-btn--primary"
              onClick={() => assignTech(selectedBooking._id, t.id)}
            >
              Assign #{i + 1}
            </button>
          </div>
        </li>
      ))}
    </ol>
  </div>
)}

            <DistrictTechSelect
              booking={selectedBooking}
              value={selectedTech}
              onChange={setSelectedTech}
            />

            <div className="sr-modal-actions">
              {!selectedBooking.assignedTechnician ? (
                <button
                  className="sr-btn sr-btn--primary"
                  onClick={() => assignTech(selectedBooking._id, selectedTech)}
                >
                  Assign
                </button>
              ) : (
                <button
                  className="sr-btn sr-btn--primary"
                  onClick={() => reassignTech(selectedBooking._id, selectedTech)}
                >
                  Change Technician
                </button>
              )}
              <button className="sr-btn sr-btn--outline" onClick={() => setSelectedBooking(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
