// src/Pages/AdminDashboard/components/ManageComplaints.jsx
import React, { useEffect, useState } from "react";
import api from "../../../lib/api";
import "./ManageComplaints.css";

export default function ManageComplaints({ role }) {
  const [complaints, setComplaints] = useState([]);
  const [form, setForm] = useState({ bookingId: "", title: "", details: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [responseForm, setResponseForm] = useState({ text: "", status: "" });
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // ✅ Fetch complaints depending on role
  const fetchComplaints = async () => {
    try {
      setLoading(true);
      let url = "/api/complaints";
      if (role === "customer") url = "/api/complaints/my";
      const res = await api.get(url);
      setComplaints(res.data || []);
    } catch (err) {
      setMessage(err?.response?.data?.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, [role]);

  // ✅ Form change
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ Create complaint (customers only)
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/complaints", form);
      setMessage("Complaint created ✅");
      setForm({ bookingId: "", title: "", details: "" });
      fetchComplaints();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error creating complaint");
    }
  };

  // ✅ Staff/Admin respond
  const handleRespond = async (e) => {
    e.preventDefault();
    try {
      await api.patch(`/api/complaints/${selectedComplaint._id}/respond`, responseForm);
      setMessage("Response sent ✅");
      setSelectedComplaint(null);
      setResponseForm({ text: "", status: "" });
      fetchComplaints();
    } catch (err) {
      setMessage(err?.response?.data?.message || "Error responding");
    }
  };

  return (
    <div className="manage-complaints">
      <h2>Manage Complaints</h2>
      {message && <p className="msg">{message}</p>}

      {/* Create Complaint (customers only) */}
      {role === "customer" && (
        <form onSubmit={handleCreate} className="complaint-form">
          <input type="text" name="bookingId" placeholder="Booking ID (optional)" value={form.bookingId} onChange={handleChange} />
          <input type="text" name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
          <textarea name="details" placeholder="Details" value={form.details} onChange={handleChange}></textarea>
          <button type="submit" className="btn">Submit Complaint</button>
        </form>
      )}

      {/* Complaint List */}
      <h3>{role === "customer" ? "My Complaints" : "All Complaints"}</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="complaint-cards">
          {complaints.map((c) => (
            <div key={c._id} className="complaint-card">
              <h4>{c.title}</h4>
              <p><strong>Status:</strong> {c.status}</p>
              {c.booking && <p><strong>Booking:</strong> {c.booking}</p>}
              <p>{c.details}</p>
              <p><em>Created: {new Date(c.createdAt).toLocaleString()}</em></p>

              {/* Show responses */}
              {c.responses?.length > 0 && (
                <div className="responses">
                  <h5>Responses:</h5>
                  <ul>
                    {c.responses.map((r, i) => (
                      <li key={i}>
                        <strong>{r.byRole}:</strong> {r.text}{" "}
                        <em>({new Date(r.at).toLocaleString()})</em>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Staff/Admin respond form */}
              {role !== "customer" && (
                <button className="btn small" onClick={() => setSelectedComplaint(c)}>
                  Respond
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Respond Modal */}
      {selectedComplaint && (
        <div className="respond-modal">
          <h3>Respond to: {selectedComplaint.title}</h3>
          <form onSubmit={handleRespond}>
            <textarea
              name="text"
              placeholder="Response text"
              value={responseForm.text}
              onChange={(e) => setResponseForm({ ...responseForm, text: e.target.value })}
              required
            ></textarea>
            <select
              name="status"
              value={responseForm.status}
              onChange={(e) => setResponseForm({ ...responseForm, status: e.target.value })}
            >
              <option value="">--Keep Status--</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button type="submit" className="btn">Submit Response</button>
            <button type="button" className="btn cancel" onClick={() => setSelectedComplaint(null)}>
              Cancel
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
