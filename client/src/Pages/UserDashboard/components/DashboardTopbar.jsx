import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./dashboard-topbar.css";

export default function DashboardTopbar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const goHome = () => navigate("/");

  return (
    <header className="db-topbar">
      <div
        className="db-topbar__left"
        onClick={() => navigate("/UserDashboard/overview")}
        role="button"
      >
        <span className="db-brand">FixMate.lk</span>
      </div>

      <nav className="db-topbar__nav">
        <NavLink to="/UserDashboard/overview" className="db-link">Overview</NavLink>
        <NavLink to="/UserDashboard/book" className="db-link">Book</NavLink>
        <NavLink to="/UserDashboard/history" className="db-link">History</NavLink>
        <NavLink to="/UserDashboard/profile" className="db-link">Profile</NavLink>
      </nav>

      <div className="db-topbar__right">
        <button className="db-btn outline" onClick={goHome}>Home</button>
        <button className="db-btn danger" onClick={logout}>Logout</button>
      </div>
    </header>
  );
}
