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
        <button type="button" className="btn outline" onClick={() => navigate("/")}>
          🏠 Home
        </button>
        <strong style={{ marginLeft: 8 }}>Coordinator Dashboard</strong>
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
