import React from "react";
import { Home, LogOut, UserRound } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext.jsx";
import "./dashboard-topbar.css";

const pageTitles = {
  overview: {
    title: "Overview",
    subtitle:
      "Review your bookings, complaints, ratings, and support activity.",
  },
  book: {
    title: "Book Service",
    subtitle:
      "Create a new service request for your repair or maintenance need.",
  },
  history: {
    title: "Service History",
    subtitle: "Track your submitted bookings and completed service records.",
  },
  complaints: {
    title: "My Complaints",
    subtitle: "Create and review complaint records for your bookings.",
  },
  ratings: {
    title: "Ratings",
    subtitle: "Rate completed jobs and review technician service quality.",
  },
  chat: {
    title: "Chat with Technician",
    subtitle: "Continue conversations related to your service requests.",
  },
  support: {
    title: "Support",
    subtitle: "Get help with your account, bookings, or service issues.",
  },
  profile: {
    title: "Profile",
    subtitle: "Manage your customer account details.",
  },
};

const topLinks = [
  { to: "/UserDashboard/overview", label: "Overview" },
  { to: "/UserDashboard/book", label: "Book" },
  { to: "/UserDashboard/history", label: "History" },
  { to: "/UserDashboard/support", label: "Support" },
];

const getInitial = (user) => {
  const source = user?.full_name || user?.email || "U";
  return String(source).charAt(0).toUpperCase();
};

export default function DashboardTopbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const activeKey =
    location.pathname.split("/").filter(Boolean).at(-1) || "overview";

  const page = pageTitles[activeKey] || pageTitles.overview;

  const goHome = () => {
    navigate("/");
  };

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
    <header className="db-topbar">
      <div
        className="db-topbar__left"
        onClick={() => navigate("/UserDashboard/overview")}
        role="button"
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            navigate("/UserDashboard/overview");
          }
        }}>
        <span className="db-brand-mark">FM</span>

        <div className="db-title-group">
          <h2>{page.title}</h2>
          <p>{page.subtitle}</p>
        </div>
      </div>

      <nav className="db-topbar__nav" aria-label="Customer dashboard shortcuts">
        {topLinks.map((item) => (
          <NavLink key={item.to} to={item.to} className="db-link">
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="db-topbar__right">
        <div className="db-user-badge">
          {user?.profile_image_url ? (
            <img
              src={user.profile_image_url}
              alt={user?.full_name || "Customer"}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <span className="db-avatar-fallback">{getInitial(user)}</span>
          )}

          <div>
            <strong>{user?.full_name || "Customer"}</strong>
            <span>{user?.email || "Customer account"}</span>
          </div>
        </div>

        <button type="button" className="db-btn outline" onClick={goHome}>
          <Home size={15} />
          Home
        </button>

        <button type="button" className="db-btn danger" onClick={handleLogout}>
          <LogOut size={15} />
          Logout
        </button>
      </div>
    </header>
  );
}
