import React from "react";
import "./technician-dashboard.css";

export default function TechnicianSidebar({ setActiveTab, activeTab }) {
  const links = [
    { key: "overview", label: "Overview" },
    { key: "assigned", label: "Assigned Tasks" },
    { key: "pending", label: "Pending Approval" },
    { key: "approved", label: "Approved Requests" },
    { key: "completed", label: "Completed" },
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
            {link.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
