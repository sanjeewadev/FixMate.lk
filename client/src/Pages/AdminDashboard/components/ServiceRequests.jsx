// src/Pages/AdminDashboard/components/ServiceRequests.jsx
import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import "./ServiceRequests.css";

export default function ServiceRequests() {
  const [unclaimed, setUnclaimed] = useState([]);
  const [awaiting, setAwaiting] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [techId, setTechId] = useState("");

  // ✅ Fetch dashboard buckets
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/coordinator/bookings/dashboard");
      setUnclaimed(res.data.unclaimed || []);
      setAwaiting(res.data.awaitingCoordinator || []);
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ Assign (manual or approve)
  const assignTech = async (bookingId, technicianId) => {
    try {
      await api.post(`/api/coordinator/bookings/${bookingId}/assign`, { technicianId });
      alert("Technician assigned ✅");
      setSelectedBooking(null);
      setTechId("");
      fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.message || "Error assigning technician");
    }
  };

  // ✅ Reassign
  const reassignTech = async (bookingId, technicianId) => {
    try {
      await api.post(`/api/coordinator/bookings/${bookingId}/reassign`, { technicianId });
      alert("Technician reassigned 🔄");
      setSelectedBooking(null);
      setTechId("");
      fetchRequests();
    } catch (err) {
      alert(err?.response?.data?.message || "Error reassigning technician");
    }
  };

  return (
    <div className="service-requests">
      <h2>Service Requests</h2>
      {error && <p className="error">{error}</p>}
      {loading && <p>Loading...</p>}

      {/* UNCLAIMED */}
      <section>
        <h3>🟡 Unclaimed (New)</h3>
        {unclaimed.length === 0 ? (
          <p>No unclaimed requests</p>
        ) : (
          <table>
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
                  <td>{b.service?.name}</td>
                  <td>{b.customerSnapshot?.district}</td>
                  <td>{b.acceptedCount}</td>
                  <td>{new Date(b.createdAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => setSelectedBooking(b)} className="btn small">Assign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* AWAITING APPROVAL */}
      <section>
        <h3>🟢 Awaiting Coordinator Approval</h3>
        {awaiting.length === 0 ? (
          <p>No awaiting requests</p>
        ) : (
          <table>
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
                  <td>{b.service?.name}</td>
                  <td>{b.acceptedCount}</td>
                  <td>{new Date(b.createdAt).toLocaleString()}</td>
                  <td>
                    <button onClick={() => setSelectedBooking(b)} className="btn small">Approve</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ASSIGN / REASSIGN MODAL */}
      {selectedBooking && (
        <div className="modal">
          <div className="modal-content">
            <h3>
              Assign Technician for: <em>{selectedBooking.problemTitle}</em>
            </h3>
            <input
              type="text"
              placeholder="Technician ID"
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
            />
            <div className="actions">
              <button onClick={() => assignTech(selectedBooking._id, techId)} disabled={!techId}>
                Assign
              </button>
              <button onClick={() => reassignTech(selectedBooking._id, techId)} disabled={!techId}>
                Reassign
              </button>
              <button className="cancel" onClick={() => setSelectedBooking(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
