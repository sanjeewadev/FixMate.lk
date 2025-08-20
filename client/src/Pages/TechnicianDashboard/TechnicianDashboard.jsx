// src/Pages/Technician/TechnicianDashboard.jsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../../lib/api";
import TechnicianSidebar from "./TechnicianSidebar.jsx";
import TechnicianTopbar from "./TechnicianTopbar.jsx";
import "./technician-dashboard.css";

export default function TechnicianDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // Lists
  const [assigned, setAssigned] = useState([]);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [completed, setCompleted] = useState([]);

  // Modals
  const [selectedAssignedBooking, setSelectedAssignedBooking] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [chatBooking, setChatBooking] = useState(null);

  // UI helpers for job actions (approved modal only)
  const [expForm, setExpForm] = useState({ label: "", amount: "" });
  const [expenseFiles, setExpenseFiles] = useState([]);
  const [serviceCharge, setServiceCharge] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  // Proof of Fix photos
  const [proofFiles, setProofFiles] = useState([]);
  const [proofPreview, setProofPreview] = useState([]);

  // Chat
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  // Live Status local state
  const [statusState, setStatusState] = useState({
    onTheWay: false,
    arrived: false,
    started: false,
  });

  const fmt = (d) => (d ? format(new Date(d), "PPpp") : "-");

  // ---- API Calls ----
  const loadAssigned = async () => {
    try {
      const res = await api.get("/api/technician/bookings/available");
      setAssigned(res.data || []);
    } catch {
      setAssigned([]);
    }
  };

  const loadPending = async () => {
    try {
      const res = await api.get(
        "/api/technician/bookings/mine?status=awaiting_coordinator"
      );
      setPending(res.data || []);
    } catch {
      setPending([]);
    }
  };

  const loadApproved = async () => {
    try {
      const res = await api.get(
        "/api/technician/bookings/mine?status=coordinator_approved"
      );
      setApproved(res.data || []);
    } catch {
      setApproved([]);
    }
  };

  const loadCompleted = async () => {
    try {
      const res = await api.get(
        "/api/technician/bookings/mine?status=completed"
      );
      setCompleted(res.data || []);
    } catch {
      setCompleted([]);
    }
  };

  const handleAccept = async (id) => {
    try {
      await api.post(`/api/technician/bookings/${id}/accept`);
      setAssigned((prev) => prev.filter((b) => b._id !== id));
      await loadPending();
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

  const viewBooking = async (id) => {
    try {
      const res = await api.get(`/api/technician/bookings/${id}`);
      setSelectedBooking(res.data);

      // reset UI helpers
      setExpForm({ label: "", amount: "" });
      setExpenseFiles([]);
      setServiceCharge("");
      setPaymentMethod("cash");
      setNotes("");
      setProofFiles([]);
      setProofPreview([]);
      setStatusState({ onTheWay: false, arrived: false, started: false });
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to load booking");
    }
  };

  const updateLiveStatus = async (id, which) => {
    try {
      const body = {
        onTheWay: which === "on_the_way",
        arrived: which === "arrived",
        started: which === "started",
      };
      await api.patch(`/api/technician/bookings/${id}/status`, body);

      // local state progressive disable
      if (which === "on_the_way") {
        setStatusState({ onTheWay: true, arrived: false, started: false });
      }
      if (which === "arrived") {
        setStatusState({ onTheWay: true, arrived: true, started: false });
      }
      if (which === "started") {
        setStatusState({ onTheWay: true, arrived: true, started: true });
      }

      alert(`Status updated: ${which}`);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to update status");
    }
  };

  const addExpense = async (id) => {
    if (!expForm.label || expForm.amount === "") {
      alert("Please enter label and amount");
      return;
    }
    try {
      const form = new FormData();
      form.append("label", expForm.label);
      form.append("amount", expForm.amount);
      for (const f of expenseFiles) form.append("attachments", f);
      await api.post(`/api/technician/bookings/${id}/expenses`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Expense added");
      setExpForm({ label: "", amount: "" });
      setExpenseFiles([]);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to add expense");
    }
  };

  const saveNotes = async (id) => {
    try {
      await api.patch(`/api/technician/bookings/${id}/notes`, { notes });
      alert("Notes saved");
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to save notes");
    }
  };

  const completeJob = async (id) => {
    try {
      const body = {
        serviceCharge: Number(serviceCharge || 0),
        paymentMethod,
      };
      await api.post(`/api/technician/bookings/${id}/complete`, body);
      alert("Job marked completed & payment confirmed");
      setSelectedBooking(null);
      await Promise.all([loadAssigned(), loadApproved(), loadCompleted()]);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to complete job");
    }
  };

  const uploadProof = async (id) => {
    if (proofFiles.length === 0) {
      alert("Please select at least one photo");
      return;
    }
    try {
      const form = new FormData();
      for (const f of proofFiles) form.append("proof", f);
      await api.post(`/api/technician/bookings/${id}/proof`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Proof photos uploaded");
      setProofFiles([]);
      setProofPreview([]);
    } catch {
      alert("Failed to upload proof");
    }
  };

  const loadChat = async (id) => {
    try {
      const res = await api.get(`/api/chat/${id}`);
      setChatMessages(res.data || []);
    } catch {
      setChatMessages([]);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim()) return;
    try {
      await api.post(`/api/chat/${chatBooking._id}`, { message: chatInput });
      setChatInput("");
      await loadChat(chatBooking._id);
    } catch {
      alert("Failed to send");
    }
  };

  useEffect(() => {
    loadAssigned();
    loadPending();
    loadApproved();
    loadCompleted();
  }, []);

  useEffect(() => {
    let interval;
    if (chatBooking) {
      loadChat(chatBooking._id);
      interval = setInterval(() => loadChat(chatBooking._id), 4000);
    }
    return () => clearInterval(interval);
  }, [chatBooking]);

  const totalCount =
    assigned.length + pending.length + approved.length + completed.length;

  const renderTable = (items, actions = true, type = "assigned") => (
    <table className="tech-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Problem</th>
          <th>Date</th>
          {actions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 && (
          <tr>
            <td colSpan={actions ? 4 : 3}>No data available</td>
          </tr>
        )}
        {items.map((b) => (
          <tr key={b._id}>
            <td>{b.service?.name}</td>
            <td>{b.problemTitle}</td>
            <td>{fmt(b.preferredAt)}</td>

            {actions && type === "assigned" && (
              <td>
                <button
                  className="btn view"
                  onClick={() => setSelectedAssignedBooking(b)}
                >
                  View
                </button>
                <button
                  className="btn accept"
                  onClick={() => handleAccept(b._id)}
                >
                  Accept
                </button>
                <button
                  className="btn decline"
                  onClick={() => handleDecline(b._id)}
                >
                  Decline
                </button>
              </td>
            )}

            {type === "approved" && (
              <td>
                <button
                  className="btn view"
                  onClick={() => viewBooking(b._id)}
                >
                  Open
                </button>
                <button
                  className="btn chat"
                  onClick={() => setChatBooking(b)}
                >
                  Chat
                </button>
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="tech-dashboard">
      <TechnicianSidebar setActiveTab={setActiveTab} activeTab={activeTab} />
      <div className="tech-main">
        <TechnicianTopbar />

        <div className="tech-content">
          {activeTab === "overview" && (
            <>
              <h2>Overview</h2>
              <div className="overview-cards">
                <div className="card">
                  TOTAL <span>{totalCount}</span>
                </div>
                <div className="card">
                  PENDING <span>{pending.length}</span>
                </div>
                <div className="card">
                  APPROVED <span>{approved.length}</span>
                </div>
                <div className="card">
                  COMPLETED <span>{completed.length}</span>
                </div>
              </div>

              <h3>Recent Bookings</h3>
              {renderTable(
                [...assigned, ...pending, ...approved, ...completed].slice(
                  0,
                  5
                ),
                false
              )}
            </>
          )}

          {activeTab === "assigned" && (
            <>
              <h2>Assigned Tasks</h2>
              {renderTable(assigned, true, "assigned")}
            </>
          )}

          {activeTab === "pending" && (
            <>
              <h2>Pending Coordinator Approval</h2>
              {renderTable(pending, false)}
            </>
          )}

          {activeTab === "approved" && (
            <>
              <h2>Approved Requests</h2>
              {renderTable(approved, true, "approved")}
            </>
          )}

          {activeTab === "completed" && (
            <>
              <h2>Completed Requests</h2>
              {renderTable(completed, false)}
            </>
          )}
        </div>
      </div>

      {/* Approved Modal */}
      {selectedBooking && (
        <div className="tech-modal">
          <div className="tech-modal-content wide-popup">
            <h3>Booking Details</h3>
            <div className="popup-grid">
              <div className="popup-item">
                <span className="label">Service:</span>
                <span>{selectedBooking.service?.name}</span>
              </div>
              <div className="popup-item">
                <span className="label">Problem:</span>
                <span>{selectedBooking.problemTitle}</span>
              </div>
              <div className="popup-item wide">
                <span className="label">Address:</span>
                <span>{selectedBooking.serviceAddress}</span>
              </div>
              {selectedBooking.customerSnapshot?.phone_number && (
                <div className="popup-item">
                  <span className="label">Phone:</span>
                  <span>{selectedBooking.customerSnapshot.phone_number}</span>
                </div>
              )}
            </div>

            <hr />

            {/* Live Status */}
            <h4>Live Status</h4>
            <div className="action-row">
              <button
                className="btn live"
                disabled={statusState.onTheWay}
                onClick={() =>
                  updateLiveStatus(selectedBooking._id, "on_the_way")
                }
              >
                On the way
              </button>
              <button
                className="btn live"
                disabled={statusState.arrived}
                onClick={() => updateLiveStatus(selectedBooking._id, "arrived")}
              >
                Arrived
              </button>
              <button
                className="btn live"
                disabled={statusState.started}
                onClick={() => updateLiveStatus(selectedBooking._id, "started")}
              >
                Started
              </button>
            </div>

            <hr />

            {/* Add Expense */}
            <h4>Add Expense</h4>
            <div className="expense-form">
              <input
                type="text"
                placeholder="Label (e.g., Transport)"
                value={expForm.label}
                onChange={(e) =>
                  setExpForm({ ...expForm, label: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Amount"
                value={expForm.amount}
                onChange={(e) =>
                  setExpForm({ ...expForm, amount: e.target.value })
                }
              />
              <input
                type="file"
                multiple
                onChange={(e) => setExpenseFiles(Array.from(e.target.files))}
              />
              <button
                className="btn add"
                onClick={() => addExpense(selectedBooking._id)}
              >
                Add
              </button>
            </div>

            <hr />

            {/* Job Notes */}
            <h4>Job Notes</h4>
            <textarea
              placeholder="Notes for this job..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button
              className="btn save"
              onClick={() => saveNotes(selectedBooking._id)}
            >
              Save Notes
            </button>

            <hr />

            {/* Proof of Fix Photos */}
            <h4>Proof of Fix Photos</h4>
            <div className="action-row">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.target.files);
                  setProofFiles(files);
                  setProofPreview(files.map((f) => URL.createObjectURL(f)));
                }}
              />
              <button
                className="btn upload"
                onClick={() => uploadProof(selectedBooking._id)}
              >
                Upload
              </button>
            </div>
            {proofPreview.length > 0 && (
              <div className="proof-grid">
                {proofPreview.map((src, i) => (
                  <img key={i} src={src} alt="preview" />
                ))}
              </div>
            )}

            <hr />

            {/* Complete Job */}
            <h4>Complete & Confirm Payment</h4>
            <div className="action-row">
              <input
                type="number"
                placeholder="Service charge (LKR)"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
              />
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
              <button
                className="btn accept"
                onClick={() => completeJob(selectedBooking._id)}
              >
                Complete & Confirm
              </button>
            </div>

            <div className="action-row center">
              <button
                className="btn close"
                onClick={() => setSelectedBooking(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatBooking && (
        <div className="tech-modal">
          ...
        </div>
      )}

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
          <span>{fmt(selectedAssignedBooking.preferredAt)} ({selectedAssignedBooking.timeSlot})</span>
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
        <button className="btn close" onClick={() => setSelectedAssignedBooking(null)}>Close</button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}