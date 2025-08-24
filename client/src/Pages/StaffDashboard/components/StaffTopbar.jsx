// src/Pages/StaffDashboard/components/StaffTopbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function StaffTopbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="staff-topbar">
      <div className="left">

        <strong style={{ marginLeft: 8, marginRight:20, fontSize: "20px" }}>Coordinator Dashboard</strong>

        <button type="button" className="btn outline" onClick={() => navigate("/")}>
          🏠 Home
        </button>

        {/* ✅ Link to PUBLIC pages */}
        <button type="button" className="btn outline" onClick={() => navigate("/aboutus")}>
          ℹ️ About Us
        </button>
        <button type="button" className="btn outline" onClick={() => navigate("/services")}>
          🧩 Services
        </button>

        </div>

      <div className="right">
        <div className="user-badge">
          {user?.profile_image_url ? (
            <img src={user.profile_image_url} alt={user?.full_name || "Coordinator"} />
          ) : (
            <div className="avatar-fallback">{user?.full_name?.[0]?.toUpperCase() || "C"}</div>
          )}
          <div style={{ lineHeight: 1 }}>
            <div className="name">{user?.full_name || "Coordinator"}</div>
            <div className="role">{role || "coordinator"}</div>
          </div>
        </div>
        <button type="button" className="btn logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
