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

  // Booking modal
  const [selectedBooking, setSelectedBooking] = useState(null);

  // UI helpers for job actions
  const [expForm, setExpForm] = useState({ label: "", amount: "" });
  const [expenseFiles, setExpenseFiles] = useState([]);
  const [serviceCharge, setServiceCharge] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  const fmt = (d) => (d ? format(new Date(d), "PPpp") : "-");

  // ---- API Calls ----
  const loadAssigned = async () => {
    try {
      const res = await api.get("/api/technician/bookings/available");
      setAssigned(res.data || []);
    } catch (e) {
      console.error("Error loading assigned:", e);
      setAssigned([]);
    }
  };

  // These 3 loaders match the earlier “overview” cards.
  // If your backend doesn’t have these endpoints yet, they’ll just no-op.
  const loadPending = async () => {
  try {
    const res = await api.get("/api/technician/bookings/mine?status=awaiting_coordinator");
    setPending(res.data || []);
  } catch (e) {
    console.error("Error loading pending:", e);
    setPending([]);
  }
};

  const loadApproved = async () => {
    try {
      const res = await api.get("/api/technician/bookings/mine?status=coordinator_approved");
      setApproved(res.data || []);
    } catch (_e) {
      setApproved([]);
    }
  };

  const loadCompleted = async () => {
    try {
      const res = await api.get("/api/technician/bookings/mine?status=completed");
      setCompleted(res.data || []);
    } catch (_e) {
      setCompleted([]);
    }
  };

 const handleAccept = async (id) => {
    try {
      // correctly interpolate the booking id
      await api.post(`/api/technician/bookings/${id}/accept`);
      // reload lists so the UI updates
      await Promise.all([loadAssigned(), loadPending()]);
      alert("Booking accepted");
    } catch (e) {
      console.error("Accept failed:", e);
      alert(e?.response?.data?.message || "Accept failed");
    }
  };

 const handleDecline = async (id) => {
    try {
      await api.post(`/api/technician/bookings/${id}/decline`);
      // refresh only assigned list (since declined ones won’t go pending)
      await loadAssigned();
      alert("Booking declined");
    } catch (e) {
      console.error("Decline failed:", e);
      alert(e?.response?.data?.message || "Decline failed");
    }
  };

  const viewBooking = async (id) => {
    try {
      const res = await api.get(`/api/technician/bookings/${id}`);
      setSelectedBooking(res.data);
      // reset action forms each time you open a new booking
      setExpForm({ label: "", amount: "" });
      setExpenseFiles([]);
      setServiceCharge("");
      setPaymentMethod("cash");
      setNotes("");
    } catch (e) {
      console.error("View failed:", e);
      alert(e?.response?.data?.message || "Failed to load booking");
    }
  };

  // MATCHES technicianJobController.updateLiveStatus (PATCH, booleans)
  const updateLiveStatus = async (id, which) => {
    try {
      const body = {
        onTheWay: which === "on_the_way",
        arrived: which === "arrived",
        started: which === "started",
      };
      await api.patch(`/api/technician/bookings/${id}/status`, body);
      alert(`Status updated: ${which}`);
    } catch (e) {
      console.error("Status failed:", e);
      alert(e?.response?.data?.message || "Failed to update status");
    }
  };

  // MATCHES technicianJobController.addExpenses (POST form-data)
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
      console.error("Add expense failed:", e);
      alert(e?.response?.data?.message || "Failed to add expense");
    }
  };

  // OPTIONAL: technicianJobController.updateNotes (PATCH)
  const saveNotes = async (id) => {
    try {
      await api.patch(`/api/technician/bookings/${id}/notes`, { notes });
      alert("Notes saved");
    } catch (e) {
      console.error("Save notes failed:", e);
      alert(e?.response?.data?.message || "Failed to save notes");
    }
  };

  // MATCHES technicianJobController.completeAndConfirmPayment (POST)
  const completeJob = async (id) => {
    try {
      const body = {
        serviceCharge: Number(serviceCharge || 0),
        paymentMethod,
      };
      await api.post(`/api/technician/bookings/${id}/complete`, body);
      alert("Job marked completed & payment confirmed");
      setSelectedBooking(null);
      // refresh lists
      await Promise.all([loadAssigned(), loadApproved(), loadCompleted()]);
    } catch (e) {
      console.error("Complete failed:", e);
      alert(e?.response?.data?.message || "Failed to complete job");
    }
  };

  useEffect(() => {
    // restore all four loaders for the overview UI
    loadAssigned();
    loadPending();
    loadApproved();
    loadCompleted();
  }, []);

  const totalCount = assigned.length + pending.length + approved.length + completed.length;

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
                <button className="btn view" onClick={() => viewBooking(b._id)}>View</button>
                <button className="btn accept" onClick={() => handleAccept(b._id)}>Accept</button>
                <button className="btn decline" onClick={() => handleDecline(b._id)}>Decline</button>
              </td>
            )}

            {type === "approved" && (
              <td>
                <button className="btn status" onClick={() => updateLiveStatus(b._id, "on_the_way")}>On the way</button>
                <button className="btn status" onClick={() => updateLiveStatus(b._id, "arrived")}>Arrived</button>
                <button className="btn status" onClick={() => updateLiveStatus(b._id, "started")}>Started</button>
                <button className="btn view" onClick={() => viewBooking(b._id)}>Open</button>
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
          {/* --- Overview (RESTORED) --- */}
          {activeTab === "overview" && (
            <>
              <h2>Overview</h2>
              <div className="overview-cards">
                <div className="card">TOTAL <span>{totalCount}</span></div>
                <div className="card">PENDING <span>{pending.length}</span></div>
                <div className="card">APPROVED <span>{approved.length}</span></div>
                <div className="card">COMPLETED <span>{completed.length}</span></div>
              </div>

              <h3>Recent Bookings</h3>
              {renderTable(
                [...assigned, ...pending, ...approved, ...completed].slice(0, 5),
                false
              )}
            </>
          )}

          {/* --- Assigned Tasks (available in my district) --- */}
          {activeTab === "assigned" && (
            <>
              <h2>Assigned Tasks</h2>
              {renderTable(assigned, true, "assigned")}
            </>
          )}

          {/* --- Pending Approval --- */}
          {activeTab === "pending" && (
            <>
              <h2>Pending Coordinator Approval</h2>
              {renderTable(pending, false)}
            </>
          )}

          {/* --- Approved Requests --- */}
          {activeTab === "approved" && (
            <>
              <h2>Approved Requests</h2>
              {renderTable(approved, true, "approved")}
            </>
          )}

          {/* --- Completed Requests --- */}
          {activeTab === "completed" && (
            <>
              <h2>Completed Requests</h2>
              {renderTable(completed, false)}
            </>
          )}
        </div>
      </div>

      {/* Drawer/Modal for details + actions */}
      {selectedBooking && (
        <div className="tech-modal">
          <div className="tech-modal-content">
            <h3>Booking Details</h3>
            <p><b>Service:</b> {selectedBooking.service?.name}</p>
            <p><b>Problem:</b> {selectedBooking.problemTitle}</p>
            <p><b>Description:</b> {selectedBooking.problemDescription}</p>
            <p><b>Address:</b> {selectedBooking.serviceAddress}</p>
            <p><b>District:</b> {selectedBooking.customerSnapshot?.district}</p>
            {selectedBooking.customerSnapshot?.phone_number && (
              <p><b>Phone:</b> {selectedBooking.customerSnapshot.phone_number}</p>
            )}

            <hr />

            <h4>Live Status</h4>
            <div className="action-row">
              <button className="btn status" onClick={() => updateLiveStatus(selectedBooking._id, "on_the_way")}>On the way</button>
              <button className="btn status" onClick={() => updateLiveStatus(selectedBooking._id, "arrived")}>Arrived</button>
              <button className="btn status" onClick={() => updateLiveStatus(selectedBooking._id, "started")}>Started</button>
            </div>

            <h4>Add Expense</h4>
            <div className="action-row">
              <input
                type="text"
                placeholder="Label (e.g., Transport)"
                value={expForm.label}
                onChange={(e) => setExpForm({ ...expForm, label: e.target.value })}
              />
              <input
                type="number"
                placeholder="Amount"
                value={expForm.amount}
                onChange={(e) => setExpForm({ ...expForm, amount: e.target.value })}
              />
              <input
                type="file"
                multiple
                onChange={(e) => setExpenseFiles(Array.from(e.target.files))}
              />
              <button className="btn" onClick={() => addExpense(selectedBooking._id)}>Add</button>
            </div>

            <h4>Job Notes</h4>
            <div className="action-row">
              <textarea
                rows={3}
                placeholder="Notes for this job..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <button className="btn" onClick={() => saveNotes(selectedBooking._id)}>Save Notes</button>
            </div>

            <h4>Complete & Confirm Payment</h4>
            <div className="action-row">
              <input
                type="number"
                placeholder="Service charge (LKR)"
                value={serviceCharge}
                onChange={(e) => setServiceCharge(e.target.value)}
              />
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
              <button className="btn accept" onClick={() => completeJob(selectedBooking._id)}>
                Complete & Confirm
              </button>
            </div>

            <div className="action-row">
              <button className="btn close" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
