// src/Pages/AdminDashboard/components/ServiceRequests.jsx
import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import "./ServiceRequests.css";
import DistrictTechSelect from "./DistrictTechSelect.jsx";

function formatDate(s) { try { return new Date(s).toLocaleString(); } catch { return s || ""; } }

export default function ServiceRequests() {
  const [unclaimed, setUnclaimed] = useState([]);
  const [awaiting, setAwaiting] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTech, setSelectedTech] = useState("");

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/coordinator/bookings/dashboard");
      setUnclaimed(res.data.unclaimed || []);
      setAwaiting(res.data.awaitingCoordinator || []);
      setError("");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { fetchRequests(); }, []);

  const assignTech = async (bookingId, technicianId) => {
    if (!technicianId) return alert("Please select a technician");
    try {
      await api.post(`/api/coordinator/bookings/${bookingId}/assign`, { technicianId });
      alert("Technician assigned ✅");
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
      alert("Technician changed 🔄");
      setSelectedBooking(null);
      setSelectedTech("");
      fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.message || "Error changing technician");
    }
  };

  const openPicker = (b) => {
    setSelectedBooking(b);
    setSelectedTech("");
  };

  return (
    <div className="service-requests">
      <h2>Service Requests</h2>
      {error && <div className="msg error">{error}</div>}
      {loading && <div className="msg info">Loading…</div>}

      {/* UNCLAIMED */}
      <section>
        <h3>🟡 Unclaimed (New)</h3>
        {unclaimed.length === 0 ? (
          <p>No unclaimed requests</p>
        ) : (
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Service</th>
                  <th>District</th>
                  <th>Accepted Techs</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {unclaimed.map((b) => (
                  <tr key={b._id}>
                    <td>{b.problemTitle}</td>
                    <td>{b.service?.name || "—"}</td>
                    <td>{b.customerSnapshot?.district || "—"}</td>
                    <td>{b.acceptedCount ?? 0}</td>
                    <td>{formatDate(b.createdAt)}</td>
                    <td>
                      <button onClick={() => openPicker(b)} className="btn small">Assign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* AWAITING APPROVAL */}
      <section>
        <h3>🟢 Awaiting Coordinator Approval</h3>
        {awaiting.length === 0 ? (
          <p>No awaiting requests</p>
        ) : (
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Service</th>
                  <th>Accepted Techs</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {awaiting.map((b) => (
                  <tr key={b._id}>
                    <td>{b.problemTitle}</td>
                    <td>{b.service?.name || "—"}</td>
                    <td>{b.acceptedCount ?? 0}</td>
                    <td>{formatDate(b.createdAt)}</td>
                    <td>
                      <button onClick={() => openPicker(b)} className="btn small">Approve & Assign</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Assign modal with district-filtered dropdown */}
      {selectedBooking && (
        <div className="assign-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="assign-modal" onClick={(e) => e.stopPropagation()}>
            <div className="am-head">
              <h3>Choose Technician</h3>
              <button className="btn ghost" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>

            <div className="am-context muted tiny">
              {selectedBooking.service?.name || "Service"} • {selectedBooking.customerSnapshot?.district || "—"}
            </div>

            <DistrictTechSelect
              booking={selectedBooking}
              value={selectedTech}
              onChange={setSelectedTech}
            />

            <div className="am-actions">
              {/* If the booking already had a technician in future (assigned list), show "Change" instead. */}
              {!selectedBooking.assignedTechnician ? (
                <button className="btn btn-primary" onClick={() => assignTech(selectedBooking._id, selectedTech)}>
                  Assign
                </button>
              ) : (
                <button className="btn btn-primary" onClick={() => reassignTech(selectedBooking._id, selectedTech)}>
                  Change Technician
                </button>
              )}
              <button className="btn" onClick={() => setSelectedBooking(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
