import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./dashboard-sidebar.css";

export default function Sidebar({ role = "user" }) {
  const [open, setOpen] = useState(true);

  const items = [
    { to: "/UserDashboard/overview", label: "Overview", icon: "📊" },
    { to: "/UserDashboard/book",     label: "Book Service", icon: "🛠️" },
    { to: "/UserDashboard/history",  label: "Service History", icon: "📜" },
    { to: "/UserDashboard/profile",  label: "Profile", icon: "👤" },
  ];

  return (
    <aside className={`db-sidebar ${open ? "open" : "closed"}`}>
      <button className="db-sidebar__toggle" onClick={() => setOpen(!open)}>
        {open ? "«" : "»"}
      </button>
      <ul className="db-sidebar__list">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink to={it.to} className="db-side-link">
              <span className="icon">{it.icon}</span>
              <span className="label">{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </aside>
  );
}
