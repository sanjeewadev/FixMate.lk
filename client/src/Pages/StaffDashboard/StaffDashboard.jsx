// src/Pages/StaffDashboard/StaffDashboard.jsx
import React, { useState, useEffect } from "react";
import api from "../../lib/api";
import "./staff-dashboard.css";

export default function StaffDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // ---- Overview ----
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  // ---- Approvals ----
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [approvalsLoading, setApprovalsLoading] = useState(false);

  // ---- Chat ----
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // ---- Complaints ----
  const [complaints, setComplaints] = useState([]);
  const [complaintsLoading, setComplaintsLoading] = useState(false);
  const [responseText, setResponseText] = useState("");

  // ---- Technicians ----
  const [technicians, setTechnicians] = useState([]);
  const [techLoading, setTechLoading] = useState(false);

  // ---- Customers ----
  const [customers, setCustomers] = useState([]);
  const [custLoading, setCustLoading] = useState(false);

  // ---- Ratings ----
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);

  // ---- Profile ----
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ full_name: "", email: "", phone_number: "", district: "" });
  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "" });

  /* ----------------- API Calls ----------------- */
  useEffect(() => {
    if (activeTab === "overview") {
      setLoading(true);
      api.get("/api/coordinator/bookings")
        .then((res) => setBookings(res.data || []))
        .catch((err) => console.error("Error fetching bookings:", err))
        .finally(() => setLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "approvals") {
      setApprovalsLoading(true);
      api.get("/api/bookings/pendingApproval")
        .then((res) => setPendingApprovals(res.data || []))
        .catch((err) => console.error("Error fetching approvals:", err))
        .finally(() => setApprovalsLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "chat" && activeConversation) {
      setChatLoading(true);
      api.get("/api/chat/messages", { params: { conversationId: activeConversation._id } })
        .then((res) => setMessages(res.data || []))
        .catch((err) => console.error("Error fetching messages:", err))
        .finally(() => setChatLoading(false));
    }
  }, [activeTab, activeConversation]);

  useEffect(() => {
    if (activeTab === "chat") {
      setConversations([
        { _id: "1", topic: "Customer Complaint #123", participants: ["Customer A"] },
        { _id: "2", topic: "Booking #456", participants: ["Technician B"] },
      ]);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "complaints") {
      setComplaintsLoading(true);
      api.get("/api/complaints")
        .then((res) => setComplaints(res.data || []))
        .catch((err) => console.error("Error fetching complaints:", err))
        .finally(() => setComplaintsLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "technicians") {
      setTechLoading(true);
      api.get("/api/technician/technicians")
        .then((res) => setTechnicians(res.data || []))
        .catch((err) => console.error("Error fetching technicians:", err))
        .finally(() => setTechLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "customers") {
      setCustLoading(true);
      api.get("/api/technician/customers/public")
        .then((res) => setCustomers(res.data || []))
        .catch((err) => console.error("Error fetching customers:", err))
        .finally(() => setCustLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "ratings") {
      setRatingsLoading(true);
      api.get("/api/ratings")
        .then((res) => setRatings(res.data?.items || []))
        .catch((err) => console.error("Error fetching ratings:", err))
        .finally(() => setRatingsLoading(false));
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "profile") {
      setProfileLoading(true);
      api.get("/api/coordinator/me")
        .then((res) => {
          setProfile(res.data || null);
          setProfileForm({
            full_name: res.data.full_name || "",
            email: res.data.email || "",
            phone_number: res.data.phone_number || "",
            district: res.data.district || "",
          });
        })
        .catch((err) => console.error("Error fetching profile:", err))
        .finally(() => setProfileLoading(false));
    }
  }, [activeTab]);

  /* ----------------- Handlers ----------------- */
  const handleApprove = async (bookingId, technicianId) => {
    try {
      await api.post(`/api/bookings/${bookingId}/approve`, { technicianId });
      setPendingApprovals((prev) => prev.filter((b) => b._id !== bookingId));
      alert("Booking approved ✅");
    } catch (err) {
      console.error("Approve error:", err);
      alert("Error approving booking");
    }
  };
  const handleDecline = (bookingId, technicianId) => {
    setPendingApprovals((prev) => prev.filter((b) => b._id !== bookingId));
    alert("Booking declined ❌");
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeConversation) return;
    try {
      const res = await api.post("/api/chat/message", {
        conversationId: activeConversation._id,
        text: newMessage.trim(),
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage("");
    } catch (err) {
      console.error("Send message error:", err);
      alert("Failed to send message");
    }
  };

  const handleRespond = async (complaintId, status) => {
    try {
      await api.post(`/api/complaints/${complaintId}/respond`, {
        text: responseText,
        status,
      });
      setComplaints((prev) =>
        prev.map((c) =>
          c._id === complaintId
            ? { ...c, status, responses: [...c.responses, { text: responseText, byRole: "coordinator" }] }
            : c
        )
      );
      setResponseText("");
      alert("Response submitted ✅");
    } catch (err) {
      console.error("Respond error:", err);
      alert("Failed to respond");
    }
  };

  const handleProfileSave = async () => {
    try {
      await api.put("/api/coordinator/me", profileForm);
      setProfile({ ...profile, ...profileForm });
      setEditProfile(false);
      alert("Profile updated ✅");
    } catch (err) {
      console.error("Update profile error:", err);
      alert("Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    try {
      await api.patch("/api/coordinator/me/password", passwordForm);
      setPasswordForm({ oldPassword: "", newPassword: "" });
      alert("Password changed ✅");
    } catch (err) {
      console.error("Change password error:", err);
      alert("Failed to change password");
    }
  };

  /* ----------------- Render ----------------- */
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="tab-content">
            <h3>📋 All Bookings</h3>
            {loading ? <p>Loading bookings...</p> : (
              <div className="table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Problem</th>
                      <th>Customer</th>
                      <th>District</th>
                      <th>Status</th>
                      <th>Preferred Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length > 0 ? bookings.map((b) => (
                      <tr key={b._id}>
                        <td>{b.service?.name || "-"}</td>
                        <td>{b.problemTitle}</td>
                        <td>{b.customerSnapshot?.full_name || "N/A"}</td>
                        <td>{b.customerSnapshot?.district || "N/A"}</td>
                        <td><span className={`status ${b.status}`}>{b.status}</span></td>
                        <td>{b.preferredAt ? new Date(b.preferredAt).toLocaleDateString() : "-"}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" style={{ textAlign: "center" }}>No bookings found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "approvals":
        return (
          <div className="tab-content">
            <h3>✅ Pending Approvals</h3>
            {approvalsLoading ? <p>Loading...</p> : (
              <div className="table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Service</th>
                      <th>Problem</th>
                      <th>Customer</th>
                      <th>Accepted Technicians</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingApprovals.length > 0 ? pendingApprovals.map((b) => (
                      <tr key={b._id}>
                        <td>{b.service?.name || "-"}</td>
                        <td>{b.problemTitle}</td>
                        <td>{b.customerSnapshot?.full_name || "N/A"}</td>
                        <td>
                          {b.technicianResponses?.map((t) => (
                            <div key={t.technician._id}>
                              {t.technician.full_name} ({t.technician.district})
                            </div>
                          ))}
                        </td>
                        <td>
                          {b.technicianResponses?.map((t) => (
                            <div key={t.technician._id} className="action-row">
                              <button className="approve-btn" onClick={() => handleApprove(b._id, t.technician._id)}>Approve</button>
                              <button className="decline-btn" onClick={() => handleDecline(b._id, t.technician._id)}>Decline</button>
                            </div>
                          ))}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: "center" }}>No pending approvals.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "chat":
        return (
          <div className="tab-content chat-tab">
            <div className="chat-sidebar">
              <h4>Conversations</h4>
              <ul>
                {conversations.map((c) => (
                  <li
                    key={c._id}
                    className={activeConversation?._id === c._id ? "active" : ""}
                    onClick={() => setActiveConversation(c)}
                  >
                    <strong>{c.topic}</strong>
                    <div className="participants">{c.participants.join(", ")}</div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="chat-window">
              {activeConversation ? (
                <>
                  <div className="chat-messages">
                    {chatLoading ? <p>Loading messages...</p> :
                      messages.length > 0 ? messages.map((m, idx) => (
                        <div key={idx} className={`chat-message ${m.senderRole === "coordinator" ? "me" : "other"}`}>
                          <div className="text">{m.text}</div>
                        </div>
                      )) : <p>No messages yet</p>}
                  </div>
                  <div className="chat-input">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." />
                    <button onClick={sendMessage}>Send</button>
                  </div>
                </>
              ) : (
                <p>Select a conversation to start chatting</p>
              )}
            </div>
          </div>
        );

      case "complaints":
        return (
          <div className="tab-content">
            <h3>⚠️ Complaints</h3>
            {complaintsLoading ? <p>Loading complaints...</p> : (
              <div className="table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Details</th>
                      <th>Status</th>
                      <th>Responses</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length > 0 ? complaints.map((c) => (
                      <tr key={c._id}>
                        <td>{c.title}</td>
                        <td>{c.details}</td>
                        <td><span className={`status ${c.status}`}>{c.status}</span></td>
                        <td>
                          {c.responses?.length > 0 ? c.responses.map((r, idx) => (
                            <div key={idx} className="response-item">
                              <strong>{r.byRole}</strong>: {r.text}
                            </div>
                          )) : <em>No responses yet</em>}
                        </td>
                        <td>
                          <textarea rows="2" value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Type response..." />
                          <div className="action-row">
                            <button className="approve-btn" onClick={() => handleRespond(c._id, "in_progress")}>Reply</button>
                            <button className="decline-btn" onClick={() => handleRespond(c._id, "resolved")}>Resolve</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="5" style={{ textAlign: "center" }}>No complaints found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case "technicians":
        return (
          <div className="tab-content">
            <h3>👨‍🔧 Technicians</h3>
            {techLoading ? <p>Loading technicians...</p> : (
              <div className="grid-cards">
                {technicians.length > 0 ? technicians.map((t) => (
                  <div key={t._id} className="card">
                    <img src={t.profile_image_url || "https://via.placeholder.com/100"} alt={t.full_name} className="card-avatar" />
                    <h4>{t.full_name}</h4>
                    <p><strong>Email:</strong> {t.email}</p>
                    <p><strong>Phone:</strong> {t.phone_number}</p>
                    <p><strong>District:</strong> {t.district}</p>
                    <p><strong>Specialization:</strong> {t.specialization || "N/A"}</p>
                    <p><strong>Experience:</strong> {t.experience_years} yrs</p>
                    {t.rating && <p><strong>Rating:</strong> ⭐ {t.rating}</p>}
                  </div>
                )) : <p>No technicians found.</p>}
              </div>
            )}
          </div>
        );

      case "customers":
        return (
          <div className="tab-content">
            <h3>👤 Customers</h3>
            {custLoading ? <p>Loading customers...</p> : (
              <div className="grid-cards">
                {customers.length > 0 ? customers.map((c) => (
                  <div key={c._id} className="card">
                    <img src={c.profile_image_url || "https://via.placeholder.com/100"} alt={c.full_name} className="card-avatar" />
                    <h4>{c.full_name || c.name_initials}</h4>
                    <p><strong>District:</strong> {c.district}</p>
                  </div>
                )) : <p>No customers found.</p>}
              </div>
            )}
          </div>
        );

      case "ratings":
        return (
          <div className="tab-content">
            <h3>⭐ Technician Ratings</h3>
            {ratingsLoading ? (
              <p>Loading ratings...</p>
            ) : ratings.length > 0 ? (
              <div className="table-wrapper">
                <table className="staff-table">
                  <thead>
                    <tr>
                      <th>Technician</th>
                      <th>Service</th>
                      <th>Problem</th>
                      <th>Customer</th>
                      <th>Stars</th>
                      <th>Comment</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ratings.map((r) => (
                      <tr key={r.bookingId}>
                        <td>{r.technician?.name || "N/A"}</td>
                        <td>{r.service?.name || "N/A"}</td>
                        <td>{r.problemTitle}</td>
                        <td>{r.customer?.name}</td>
                        <td>⭐ {r.rating?.stars}</td>
                        <td>{r.rating?.comment || "-"}</td>
                        <td>{r.ratedAt ? new Date(r.ratedAt).toLocaleDateString() : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No ratings found.</p>
            )}
          </div>
        );

      case "profile":
        return (
          <div className="tab-content">
            <h3>🙍 Staff Profile</h3>
            {profileLoading ? (
              <p>Loading profile...</p>
            ) : profile ? (
              <div className="profile-card">
                <img
                  src={profile.profile_image_url || "https://via.placeholder.com/120"}
                  alt="profile"
                  className="profile-avatar"
                />
                {editProfile ? (
                  <div className="profile-form">
                    <label>Full Name</label>
                    <input type="text" value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })} />
                    <label>Email</label>
                    <input type="email" value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                    <label>Phone</label>
                    <input type="text" value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })} />
                    <label>District</label>
                    <input type="text" value={profileForm.district}
                      onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })} />
                    <div className="action-row">
                      <button className="approve-btn" onClick={handleProfileSave}>Save</button>
                      <button className="decline-btn" onClick={() => setEditProfile(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="profile-details">
                    <p><strong>Name:</strong> {profile.full_name}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Phone:</strong> {profile.phone_number}</p>
                    <p><strong>District:</strong> {profile.district}</p>
                    <button className="approve-btn" onClick={() => setEditProfile(true)}>Edit Profile</button>
                  </div>
                )}
                <div className="password-form">
                  <h4>Change Password</h4>
                  <input type="password" placeholder="Old Password"
                    value={passwordForm.oldPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })} />
                  <input type="password" placeholder="New Password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
                  <button className="approve-btn" onClick={handleChangePassword}>Change Password</button>
                </div>
              </div>
            ) : (
              <p>No profile found.</p>
            )}
          </div>
        );

      default:
        return <div className="tab-content">Select a tab</div>;
    }
  };

  return (
    <div className="staff-shell">
      <aside className="staff-sidebar">
        <div className="brand">FixMate.lk</div>
        <nav>
          <ul>
            <li className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>Overview</li>
            <li className={activeTab === "approvals" ? "active" : ""} onClick={() => setActiveTab("approvals")}>Approvals</li>
            <li className={activeTab === "chat" ? "active" : ""} onClick={() => setActiveTab("chat")}>Chat</li>
            <li className={activeTab === "complaints" ? "active" : ""} onClick={() => setActiveTab("complaints")}>Complaints</li>
            <li className={activeTab === "technicians" ? "active" : ""} onClick={() => setActiveTab("technicians")}>Technicians</li>
            <li className={activeTab === "customers" ? "active" : ""} onClick={() => setActiveTab("customers")}>Customers</li>
            <li className={activeTab === "ratings" ? "active" : ""} onClick={() => setActiveTab("ratings")}>Ratings</li>
            <li className={activeTab === "profile" ? "active" : ""} onClick={() => setActiveTab("profile")}>Profile</li>
          </ul>
        </nav>
      </aside>

      <main className="staff-main">
        <header className="staff-topbar">
          <h2>Staff Dashboard</h2>
          <div className="user-controls">
            <button className="logout-btn">Logout</button>
          </div>
        </header>
        <section className="staff-content">{renderContent()}</section>
      </main>
    </div>
  );
}
