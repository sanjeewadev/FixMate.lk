import React from "react";
import "./technician-dashboard.css";

export default function TechnicianTopbar() {
  return (
    <div className="tech-topbar">
      <h2 className="title">Technician Dashboard</h2>
      <div className="topbar-actions">
        <button
          className="btn logout"
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
