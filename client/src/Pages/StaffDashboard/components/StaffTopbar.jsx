import React from "react";
import { LogOut, UserRound } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

const pageTitles = {
  requests: {
    title: "Service Requests",
    subtitle: "Assign and manage incoming service requests",
  },
  jobs: {
    title: "Jobs & Progress",
    subtitle: "Track assigned jobs and technician progress",
  },
  chat: {
    title: "Coordinator Chat",
    subtitle: "Handle customer and technician conversations",
  },
  complaints: {
    title: "Complaints",
    subtitle: "Review and respond to customer complaints",
  },
  customerlist: {
    title: "Customers",
    subtitle: "View customer records",
  },
  techlist: {
    title: "Technicians",
    subtitle: "View available technician records",
  },
  profile: {
    title: "My Profile",
    subtitle: "Manage coordinator account details",
  },
};

const formatRole = (value) => {
  if (!value) return "Coordinator";

  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getInitial = (user) => {
  const source = user?.full_name || user?.email || "C";
  return String(source).charAt(0).toUpperCase();
};

export default function StaffTopbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const parts = location.pathname.split("/").filter(Boolean);
  const activeKey = parts[parts.length - 1] || "requests";
  const currentPage = pageTitles[activeKey] || pageTitles.requests;

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="staff-topbar">
      <div className="left">
        <div>
          <strong>{currentPage.title}</strong>
          <p className="staff-topbar-subtitle">{currentPage.subtitle}</p>
        </div>
      </div>

      <div className="right">
        <div className="user-badge">
          {user?.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt={user?.full_name || "Coordinator"}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className="avatar-fallback">{getInitial(user)}</div>
          )}

          <div className="staff-user-meta">
            <div className="name">{user?.full_name || "Coordinator"}</div>
            <div className="role">{formatRole(role || "coordinator")}</div>
          </div>
        </div>

        <button type="button" className="btn logout" onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}
