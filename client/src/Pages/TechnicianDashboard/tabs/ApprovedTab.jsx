// src/Pages/Technician/tabs/ApprovedTab.jsx
import React, { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import api from "../../../lib/api";

export default function ApprovedTab() {
  const [approved, setApproved] = useState([]);

  // Modals + detailed booking
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Approved booking helpers
  const [expForm, setExpForm] = useState({ label: "", amount: "" });
  const [expenseFiles, setExpenseFiles] = useState([]);
  const [serviceCharge, setServiceCharge] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");

  // Proof photos
  const [proofFiles, setProofFiles] = useState([]);
  const [proofPreview, setProofPreview] = useState([]);

  // Chat
  const [chatBooking, setChatBooking] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatConversationId, setChatConversationId] = useState(null);
  const pollingRef = useRef(null);

  // Live status (local progressive disable)
  const [statusState, setStatusState] = useState({
    onTheWay: false,
    arrived: false,
    started: false,
  });

  const fmt = (d) => (d ? format(new Date(d), "PPpp") : "-");

  const loadApproved = async () => {
    try {
      const res = await api.get("/api/technician/bookings/mine?status=coordinator_approved");
      setApproved(res.data || []);
    } catch { setApproved([]); }
  };

  useEffect(() => { loadApproved(); }, []);

  const viewBooking = async (id) => {
    try {
      const res = await api.get(`/api/technician/bookings/${id}`);
      setSelectedBooking(res.data);

      // reset helpers
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

      if (which === "on_the_way") setStatusState({ onTheWay: true, arrived: false, started: false });
      if (which === "arrived")   setStatusState({ onTheWay: true, arrived: true,  started: false });
      if (which === "started")   setStatusState({ onTheWay: true, arrived: true,  started: true  });

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

  const completeJob = async (id) => {
    try {
      const body = { serviceCharge: Number(serviceCharge || 0), paymentMethod };
      await api.post(`/api/technician/bookings/${id}/complete`, body);
      alert("Job marked completed & payment confirmed");
      setSelectedBooking(null);
      loadApproved(); // refresh list
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to complete job");
    }
  };

  // ---- Chat ----
  const loadChat = async (conversationId) => {
    try {
      const { data } = await api.get("/api/chat/messages", { params: { conversationId } });
      const normalized = (data || []).map(m => ({ ...m, text: m.text ?? m.message ?? "" }));
      setChatMessages(normalized);
    } catch {
      setChatMessages([]);
    }
  };

  const sendChat = async () => {
    if (!chatInput.trim() || !chatConversationId) return;
    try {
      await api.post("/api/chat/messages", {
        conversationId: chatConversationId,
        text: chatInput,
      });
      setChatInput("");
      await loadChat(chatConversationId);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to send");
    }
  };

  const openChat = async (booking) => {
    try {
      setChatBooking(booking);

      let customerId =
        booking?.customer?._id ||
        booking?.customer ||
        booking?.customerId ||
        booking?.customerSnapshot?._id ||
        booking?.customerSnapshot?.id;

      if (!customerId) {
        const det = await api.get(`/api/technician/bookings/${booking._id}`);
        const db = det.data || {};
        customerId =
          db?.customer?._id ||
          db?.customer ||
          db?.customerId ||
          db?.customerSnapshot?._id ||
          db?.customerSnapshot?.id;
      }

      if (!customerId) {
        alert("Cannot open chat: missing customer ID on booking.");
        return;
      }

      const { data: convo } = await api.post("/api/chat/conversations", {
        bookingId: booking._id,
        withRole: "customer",
        withUserId: customerId,
      });

      setChatConversationId(convo._id);
      await loadChat(convo._id);

      // start polling
      clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => loadChat(convo._id), 4000);
    } catch (e) {
      alert(e?.response?.data?.message || "Failed to open chat");
    }
  };

  const closeChat = () => {
    setChatBooking(null);
    setChatConversationId(null);
    clearInterval(pollingRef.current);
  };

  useEffect(() => {
    return () => clearInterval(pollingRef.current);
  }, []);

  // Table
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
              <button className="btn view" onClick={() => viewBooking(b._id)}>Open</button>
              <button className="btn chat" onClick={() => openChat(b)}>Chat</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <h2>Approved Requests</h2>
      {renderTable(approved)}

      {/* Approved Booking Modal */}
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
                onClick={() => updateLiveStatus(selectedBooking._id, "on_the_way")}
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
              <button className="btn add" onClick={() => addExpense(selectedBooking._id)}>Add</button>
            </div>

            <hr />

            {/* Job Notes */}
            <h4>Job Notes</h4>
            <textarea
              placeholder="Notes for this job..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button className="btn save" onClick={() => saveNotes(selectedBooking._id)}>Save Notes</button>

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
              <button className="btn upload" onClick={() => uploadProof(selectedBooking._id)}>Upload</button>
            </div>
            {proofPreview.length > 0 && (
              <div className="proof-grid">
                {proofPreview.map((src, i) => (<img key={i} src={src} alt="preview" />))}
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
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
              <button className="btn accept" onClick={() => completeJob(selectedBooking._id)}>
                Complete & Confirm
              </button>
            </div>

            <div className="action-row center">
              <button className="btn close" onClick={() => setSelectedBooking(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Modal */}
      {chatBooking && (
        <div className="tech-modal">
          <div className="tech-modal-content chat-modal">
            <h3>Chat with Customer</h3>
            <div className="chat-box">
              {chatMessages.length === 0 ? (
                <p>No messages yet</p>
              ) : (
                chatMessages.map((m, i) => (
                  <div key={i} className="chat-msg">
                    <strong>{m.senderRole}:</strong> {m.text ?? m.message ?? ""}
                    <br />
                    <small>{fmt(m.createdAt)}</small>
                  </div>
                ))
              )}
            </div>

            <div className="action-row">
              <input
                type="text"
                placeholder="Type a message..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{ flex: 1, marginRight: "10px" }}
              />
              <button className="btn send" onClick={sendChat}>Send</button>
            </div>
            <div className="action-row center">
              <button className="btn close" onClick={closeChat}>Close</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
