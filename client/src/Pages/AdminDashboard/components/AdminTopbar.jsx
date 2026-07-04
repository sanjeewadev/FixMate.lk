import React from "react";
import { Bell, ChevronDown, LogOut, Search } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";

const pageTitles = {
  overview: {
    title: "Dashboard",
    subtitle: "Overview of FixMate platform operations.",
  },
  users: {
    title: "Manage Users",
    subtitle: "Create, update and manage customer accounts.",
  },
  technicians: {
    title: "Manage Technicians",
    subtitle: "Review and maintain technician profiles.",
  },
  staff: {
    title: "Manage Staff",
    subtitle: "Manage coordinators and staff access.",
  },
  services: {
    title: "Manage Services",
    subtitle: "Maintain public service categories and service details.",
  },
  complaints: {
    title: "Complaints",
    subtitle: "Review customer complaints and service issues.",
  },
  requests: {
    title: "Service Requests",
    subtitle: "Track booking requests and service operations.",
  },
  chat: {
    title: "Live Chat",
    subtitle: "Handle service-related conversations.",
  },
  ratings: {
    title: "Ratings",
    subtitle: "Review customer feedback and technician ratings.",
  },
  jobs: {
    title: "Jobs & Progress",
    subtitle: "Monitor job status and operational progress.",
  },
  profile: {
    title: "My Profile",
    subtitle: "View and update your admin account.",
  },
  admins: {
    title: "Manage Admins",
    subtitle: "Control administrator accounts and permissions.",
  },
  reports: {
    title: "Reports",
    subtitle: "Review platform performance and reporting data.",
  },
  "ai-ingest": {
    title: "AI Ingest",
    subtitle: "Manage AI knowledge ingestion and processing.",
  },
};

const formatRole = (role) => {
  if (!role) return "Admin";

  return String(role)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getInitial = (user, role) => {
  const source = user?.full_name || user?.name || user?.email || role || "A";
  return String(source).charAt(0).toUpperCase();
};

export default function AdminTopbar() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey =
    location.pathname.split("/").filter(Boolean).at(-1) || "overview";

  const page = pageTitles[activeKey] || {
    title: "Admin Dashboard",
    subtitle: "Manage FixMate platform operations.",
  };

  const displayName = user?.full_name || user?.name || user?.email || "Admin";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="fm-admin-topbar">
      <div className="fm-admin-topbarLeft">
        <h1>{page.title}</h1>
        <p>{page.subtitle}</p>
      </div>

      <div className="fm-admin-topbarCenter">
        <label className="fm-admin-search">
          <Search size={16} />
          <input type="search" placeholder="Search dashboard" />
        </label>
      </div>

      <div className="fm-admin-topbarRight">
        <button
          type="button"
          className="fm-admin-iconButton"
          aria-label="Notifications"
          title="Notifications">
          <Bell size={17} />
          <span className="fm-admin-dot" />
        </button>

        <div className="fm-admin-userBadge">
          {user?.profile_image_url ? (
            <img
              className="fm-admin-userAvatar"
              src={user.profile_image_url}
              alt={displayName}
            />
          ) : (
            <div className="fm-admin-avatarFallback">
              {getInitial(user, role)}
            </div>
          )}

          <div className="fm-admin-userText">
            <span className="name">{displayName}</span>
            <span className="role">{formatRole(role)}</span>
          </div>

          <ChevronDown className="fm-admin-userChevron" size={15} />
        </div>

        <button
          type="button"
          className="fm-admin-logout"
          onClick={handleLogout}>
          <LogOut size={15} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
}
