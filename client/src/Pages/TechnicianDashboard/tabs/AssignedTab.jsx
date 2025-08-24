// src/Pages/Technician/tabs/AssignedTab.jsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../../../lib/api";

export default function AssignedTab() {
  const [assigned, setAssigned] = useState([]);
  const [selectedAssignedBooking, setSelectedAssignedBooking] = useState(null);

  const fmt = (d) => (d ? format(new Date(d), "PPpp") : "-");

  const loadAssigned = async () => {
    try {
      const res = await api.get("/api/technician/bookings/available");
      setAssigned(res.data || []);
    } catch { setAssigned([]); }
  };

  useEffect(() => { loadAssigned(); }, []);

  const handleAccept = async (id) => {
    try {
      await api.post(`/api/technician/bookings/${id}/accept`);
      setAssigned((prev) => prev.filter((b) => b._id !== id));
      alert("Booking accepted");
    } catch (e) {
      alert(e?.response?.data?.message || "Accept failed");
    }
  };

  const handleDecline = async (id) => {
    try {
      await api.post(`/api/technician/bookings/${id}/decline`);
      setAssigned((prev) => prev.filter((b) => b._id !== id));
      alert("Booking declined");
    } catch (e) {
      alert(e?.response?.data?.message || "Decline failed");
    }
  };

  const renderTable = (items) => (
    <table className="tech-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Problem</th>
          <th>Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr><td colSpan={4}>No data available</td></tr>
        ) : items.map((b) => (
          <tr key={b._id}>
            <td>{b.service?.name}</td>
            <td>{b.problemTitle}</td>
            <td>{fmt(b.preferredAt)}</td>
            <td>
              <button className="btn view" onClick={() => setSelectedAssignedBooking(b)}>View</button>
              <button className="btn accept" onClick={() => handleAccept(b._id)}>Accept</button>
              <button className="btn decline" onClick={() => handleDecline(b._id)}>Decline</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <h2>Assigned Tasks</h2>
      {renderTable(assigned)}

      {/* Assigned Booking Modal */}
      {selectedAssignedBooking && (
        <div className="tech-modal">
          <div className="tech-modal-content assigned-popup">
            <h3 className="popup-title">Booking Request</h3>

            <div className="popup-grid">
              <div className="popup-item">
                <span className="label">Service:</span>
                <span>{selectedAssignedBooking.service?.name}</span>
              </div>
              <div className="popup-item">
                <span className="label">Category:</span>
                <span>{selectedAssignedBooking.service?.category}</span>
              </div>
              <div className="popup-item">
                <span className="label">Problem:</span>
                <span>{selectedAssignedBooking.problemTitle}</span>
              </div>
              <div className="popup-item wide">
                <span className="label">Description:</span>
                <span>{selectedAssignedBooking.problemDescription}</span>
              </div>
              <div className="popup-item">
                <span className="label">Preferred Date/Time:</span>
                <span>
                  {fmt(selectedAssignedBooking.preferredAt)} ({selectedAssignedBooking.timeSlot})
                </span>
              </div>
              <div className="popup-item">
                <span className="label">Brand / Model:</span>
                <span>{selectedAssignedBooking.brandModel || "N/A"}</span>
              </div>
              <div className="popup-item">
                <span className="label">Equipment Age:</span>
                <span>{selectedAssignedBooking.equipmentAge || "N/A"}</span>
              </div>
              <div className="popup-item wide">
                <span className="label">Special Instructions:</span>
                <span>{selectedAssignedBooking.specialInstructions || "None"}</span>
              </div>
              <div className="popup-item wide">
                <span className="label">Address:</span>
                <span>{selectedAssignedBooking.serviceAddress}</span>
              </div>
              <div className="popup-item">
                <span className="label">District:</span>
                <span>{selectedAssignedBooking.customerSnapshot?.district}</span>
              </div>
            </div>

            <div className="action-row center">
              <button className="btn close" onClick={() => setSelectedAssignedBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
