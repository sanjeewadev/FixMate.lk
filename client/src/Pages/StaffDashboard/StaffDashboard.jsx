// src/Pages/StaffDashboard/StaffDashboard.jsx
import React from "react";
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// Keep staff CSS file, but it now mirrors admin design tokens/styles
import "./staff-dashboard.css";

import StaffTopbar from "./components/StaffTopbar.jsx";
import StaffSidebar from "./components/StaffSidebar.jsx";

import StaffProfile from "./components/StaffProfile.jsx";
import ServiceRequests from "./components/ServiceRequests.jsx";
import JobsProgress from "./components/JobsProgress.jsx";
import ManageComplaints from "./components/ManageComplaints.jsx";
import AdminChat from "./components/AdminChat.jsx";
import TechniciansList from "./components/TechniciansList.jsx";
import CustomersList from "./components/CustomersList.jsx";

export default function StaffDashboard() {
  const { role, loading } = useAuth();
  const isCoordinator = role === "coordinator";

  if (loading) {
    return (
      <div className="staff-shell">
        <aside className="staff-sidebar"><div className="brand">FixMate.lk</div></aside>
        <header className="staff-topbar"><div>Loading…</div></header>
        <main className="staff-content">Please wait</main>
      </div>
    );
  }

  if (!isCoordinator) {
    return (
      <div className="staff-guard">
        <div className="guard-card">
          <h3>Access restricted</h3>
          <p>This area is for Coordinators only.</p>
          <NavLink to="/" className="btn btn--primary">Go Home</NavLink>
        </div>
      </div>
    );
  }

  return (
    <div className="staff-shell">
      {/* Sidebar styled exactly like admin */}
      <StaffSidebar />

      {/* Topbar styled exactly like admin */}
      {/* Make sure StaffTopbar's root element has className="staff-topbar" (it probably already does).
          Our CSS gives .staff-topbar the same rules as .admin-topbar. */}
      <StaffTopbar />

      {/* Content area styled exactly like admin */}
      <main className="staff-content">
        <Routes>
          <Route index element={<Navigate to="requests" replace />} />
          <Route path="requests" element={<ServiceRequests />} />
          <Route path="jobs" element={<JobsProgress />} />
          <Route path="complaints" element={<ManageComplaints role="coordinator" />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="profile" element={<StaffProfile />} />
          <Route path="techlist" element={<TechniciansList />} />
          <Route path="customerlist" element={<CustomersList />} />
          <Route path="*" element={<Navigate to="requests" replace />} />
        </Routes>
      </main>
    </div>
  );
}
