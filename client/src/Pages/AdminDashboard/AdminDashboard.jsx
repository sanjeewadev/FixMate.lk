// src/Pages/AdminDashboard/AdminDashboard.jsx
import React from "react";
import { Routes, Route, NavLink, Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import AdminTopbar from "./components/AdminTopbar.jsx";
import "./admin-dashboard.css";

import ManageUsers from "./components/ManageUsers.jsx";
import ManageTechnicians from "./components/ManageTechnicians.jsx";
import ManageStaff from "./components/ManageStaff.jsx";
import ManageServices from "./components/ManageServices.jsx";
import ManageAdmins from "./components/ManageAdmins.jsx";
import ManageComplaints from "./components/ManageComplaints.jsx";
import ServiceRequests from "./components/ServiceRequests.jsx";
import AdminProfile from "./components/AdminProfile.jsx";
import Reports from "./components/Reports.jsx";
import AIIngest from "./components/AIIngest.jsx";
import JobsProgress from "./components/JobsProgress.jsx";
import Ratings from "./components/Ratings.jsx";

// 👇 NEW: chat UI
import Chat from "./components/AdminChat.jsx";

/** Small adapter so we can pass query params to Chat */
function ChatRouteAdapter() {
  const { role } = useAuth();
  const [sp] = useSearchParams();

  // Accept either conversationId OR withRole+withUserId (+ optional bookingId)
  const props = {
    conversationId: sp.get("conversationId") || "",
    withRole: sp.get("withRole") || undefined,
    withUserId: sp.get("withUserId") || undefined,
    bookingId: sp.get("bookingId") || undefined,
    myRole: role,
    title: sp.get("title") || "Chat",
    subtitle: sp.get("subtitle") || "",
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <h2 style={{ margin: 0 }}>💬 Live Chat</h2>
      <Chat {...props} />
    </div>
  );
}

export default function AdminDashboard() {
  const { role, loading } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";
  const isStaff = role === "coordinator";
  const canSeeRequests = isAdmin || isStaff;
  const canSeeChat = isAdmin || isStaff; // 👈 show Chat to admin + coordinator

  if (loading) {
    return (
      <div className="admin-shell">
        <aside className="admin-sidebar"><div className="brand">FixMate.lk</div></aside>
        <header className="admin-topbar"><div>Loading…</div></header>
        <main className="admin-content">Please wait</main>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="brand">FixMate.lk</div>
        <nav className="side-nav">
          <div className="side-section">Users</div>
          <NavLink to="/AdminDashboard/users" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>👥 Manage Users</NavLink>
          <NavLink to="/AdminDashboard/technicians" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>🧰 Manage Technicians</NavLink>
          <NavLink to="/AdminDashboard/staff" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>🧑‍💼 Manage Staff</NavLink>

          <div className="side-section">Platform</div>
          <NavLink to="/AdminDashboard/services" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>🧩 Manage Services</NavLink>
          <NavLink to="/AdminDashboard/complaints" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>📨 Complaints</NavLink>

          {canSeeRequests && (
            <NavLink to="/AdminDashboard/requests" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>
              📋 Service Requests
            </NavLink>
          )}

          {canSeeChat && (
            <NavLink
              to="/AdminDashboard/chat"
              className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
            >
              💬 Chat
            </NavLink>
          )}

          <NavLink to="/AdminDashboard/ratings" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>⭐ Ratings</NavLink>
          <NavLink to="/AdminDashboard/jobs" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>🛠️ Jobs & Progress</NavLink>

          <div className="side-section">Account</div>
          <NavLink to="/AdminDashboard/profile" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>👤 My Profile</NavLink>

          {isAdmin && (
            <>
              <div className="side-section">Administration</div>
              <NavLink to="/AdminDashboard/admins" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>🛡️ Manage Admins</NavLink>
              <NavLink to="/AdminDashboard/reports" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>📈 Reports</NavLink>
              <NavLink to="/AdminDashboard/ai-ingest" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>🤖 AI Ingest</NavLink>
            </>
          )}
        </nav>
      </aside>

      {/* Topbar */}
      <AdminTopbar />

      {/* Content */}
      <main className="admin-content">
        <Routes>
          <Route index element={<Navigate to="services" replace />} />

          <Route path="users" element={<ManageUsers />} />
          <Route path="technicians" element={<ManageTechnicians />} />
          <Route path="staff" element={<ManageStaff />} />
          <Route path="services" element={<ManageServices />} />
          <Route path="complaints" element={<ManageComplaints role={isStaff ? "coordinator" : "admin"} />} />

          {canSeeRequests && <Route path="requests" element={<ServiceRequests />} />}

          {/* NEW: Chat route */}
          {canSeeChat && <Route path="chat" element={<ChatRouteAdapter />} />}

          <Route path="profile" element={<AdminProfile />} />

          {isAdmin && (
            <>
              <Route path="admins" element={<ManageAdmins />} />
              <Route path="reports" element={<Reports />} />
              <Route path="jobs" element={<JobsProgress />} />
              <Route path="ai-ingest" element={<AIIngest />} />
            </>
          )}

          {/* Ratings available for admin in your previous setup; keep for all roles if desired */}
          <Route path="ratings" element={<Ratings />} />

          <Route path="*" element={<Navigate to="services" replace />} />
        </Routes>
      </main>
    </div>
  );
}
