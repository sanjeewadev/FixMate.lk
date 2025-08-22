// src/Pages/AdminDashboard/AdminDashboard.jsx
import React from "react";
import { Routes, Route, NavLink, Navigate } from "react-router-dom";
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
import Reports from "./components/Reports.jsx"; // 👈 NEW

export default function AdminDashboard() {
  const { role, loading } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";
  const isStaff = role === "staff";
  const canSeeRequests = isAdmin || isStaff; // admin + staff

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

          <div className="side-section">Account</div>
          <NavLink to="/AdminDashboard/profile" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>👤 My Profile</NavLink>

          {isAdmin && (
            <>
              <div className="side-section">Administration</div>
              <NavLink to="/AdminDashboard/admins" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>🛡️ Manage Admins</NavLink>
              <NavLink to="/AdminDashboard/reports" className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}>📈 Reports</NavLink> {/* 👈 NEW */}
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
          <Route path="complaints" element={<ManageComplaints role={isStaff ? "staff" : "admin"} />} />

          {canSeeRequests && <Route path="requests" element={<ServiceRequests />} />}

          <Route path="profile" element={<AdminProfile />} />

          {isAdmin && (
            <>
              <Route path="admins" element={<ManageAdmins />} />
              <Route path="reports" element={<Reports />} /> {/* 👈 NEW */}
            </>
          )}

          <Route path="*" element={<Navigate to="services" replace />} />
        </Routes>
      </main>
    </div>
  );
}
