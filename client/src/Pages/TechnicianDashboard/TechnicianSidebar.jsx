// src/Pages/Technician/TechnicianSidebar.jsx
import React from "react";
import "./technician-dashboard.css";

export default function TechnicianSidebar({ setActiveTab, activeTab }) {
  const links = [
    { key: "overview",  label: "Overview",           icon: "📊" },
    { key: "assigned",  label: "Assigned Tasks",     icon: "🧾" },
    { key: "pending",   label: "Pending Approval",   icon: "⏳" },
    { key: "approved",  label: "Approved Requests",  icon: "✅" },
    { key: "completed", label: "Completed",          icon: "🏁" },
    { key: "profile",   label: "Profile",            icon: "👤" },
  ];

  return (
    <div className="tech-sidebar">
      <h3>Fixmate</h3>
      <ul>
        {links.map((link) => (
          <li
            key={link.key}
            className={activeTab === link.key ? "active" : ""}
            onClick={() => setActiveTab(link.key)}
          >
            <span className="tab-emoji" aria-hidden="true">{link.icon}</span>
            <span className="tab-label">{link.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
