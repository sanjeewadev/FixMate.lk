// src/Pages/StaffDashboard/components/StaffSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";

export default function StaffSidebar() {
  return (
    <aside className="staff-sidebar">
      <div className="brand">FixMate.lk</div>

      <nav className="side-nav">
        <div className="side-section">Coordinator</div>

        <NavLink
          to="/StaffDashboard/requests"
          className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
        >
          📋 Service Requests
        </NavLink>

        <NavLink
          to="/StaffDashboard/jobs"
          className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
        >
          🛠️ Jobs and Progress
        </NavLink>

        <NavLink
          to="/StaffDashboard/chat"
          className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
        >
          💬 Chat
        </NavLink>

        <NavLink
          to="/StaffDashboard/complaints"
          className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
        >
          📨 Complaints
        </NavLink>

        <NavLink
          to="/StaffDashboard/customerlist"
          className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
        >
          👤 Customers
        </NavLink>

        <NavLink
          to="/StaffDashboard/techlist"
          className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
        >
          🧑‍🔧 Technicians
        </NavLink>

        <div className="side-section">Account</div>
        <NavLink
          to="/StaffDashboard/profile"
          className={({ isActive }) => `side-link ${isActive ? "active" : ""}`}
        >
          👤 My Profile
        </NavLink>
      </nav>
    </aside>
  );
}
