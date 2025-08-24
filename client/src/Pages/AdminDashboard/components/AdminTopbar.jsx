// src/Pages/AdminDashboard/components/AdminTopbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";

export default function AdminTopbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="admin-topbar">
      <div className="left">
        <strong style={{ marginLeft: 8, marginRight:20, fontSize: "20px" }}>Admin Dashboard</strong>

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
            <img src={user.profile_image_url} alt={user?.full_name || "Admin"} />
          ) : (
            <div className="avatar-fallback">{user?.full_name?.[0]?.toUpperCase() || "A"}</div>
          )}
          <div style={{ lineHeight: 1 }}>
            <div className="name">{user?.full_name || "Admin"}</div>
            <div className="role">{role}</div>
          </div>
        </div>
        <button type="button" className="btn logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}
