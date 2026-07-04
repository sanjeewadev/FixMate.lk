import React from "react";
import { LogOut, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import "./technician-dashboard.css";

const pageTitles = {
  overview: {
    title: "Overview",
    subtitle:
      "Review your assigned work, pending approvals, and recent progress.",
  },
  assigned: {
    title: "Assigned Tasks",
    subtitle: "View confirmed jobs that are ready for technician action.",
  },
  pending: {
    title: "Pending Approval",
    subtitle: "Track requests waiting for coordinator approval.",
  },
  approved: {
    title: "Approved Requests",
    subtitle: "Review requests approved for technician handling.",
  },
  completed: {
    title: "Completed Jobs",
    subtitle: "View completed work, proof, expenses, and payment records.",
  },
  chat: {
    title: "Technician Chat",
    subtitle: "Communicate with customers and coordinators.",
  },
  profile: {
    title: "Technician Profile",
    subtitle: "Manage your technician account, photo, and profile details.",
  },
};

const formatRole = (value) => {
  if (!value) return "Technician";

  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getInitial = (user) => {
  const source = user?.full_name || user?.email || "T";
  return String(source).charAt(0).toUpperCase();
};

export default function TechnicianTopbar({ activeTab = "overview" }) {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();

  const page = pageTitles[activeTab] || pageTitles.overview;

  const handleLogout = () => {
    if (typeof logout === "function") {
      logout();
    } else {
      localStorage.clear();
    }

    navigate("/", {
      replace: true,
    });
  };

  return (
    <header className="tech-topbar">
      <div className="tech-topbar__left">
        <div>
          <h2 className="title">{page.title}</h2>
          <p>{page.subtitle}</p>
        </div>
      </div>

      <div className="topbar-actions">
        <div className="tech-user-badge">
          {user?.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt={user?.full_name || "Technician"}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="tech-avatar-fallback">{getInitial(user)}</span>
          )}

          <div>
            <strong>{user?.full_name || "Technician"}</strong>
            <span>{formatRole(role || "technician")}</span>
          </div>
        </div>

        <button
          type="button"
          className="tech-topbar__logout"
          onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}
