import React from "react";
import {
  CalendarPlus,
  ClipboardList,
  Headphones,
  History,
  LayoutDashboard,
  MessageSquare,
  Star,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import "./dashboard-sidebar.css";

const items = [
  {
    to: "/UserDashboard/overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    to: "/UserDashboard/book",
    label: "Book Service",
    icon: CalendarPlus,
  },
  {
    to: "/UserDashboard/history",
    label: "Service History",
    icon: History,
  },
  {
    to: "/UserDashboard/complaints",
    label: "My Complaints",
    icon: TriangleAlert,
  },
  {
    to: "/UserDashboard/ratings",
    label: "Ratings",
    icon: Star,
  },
  {
    to: "/UserDashboard/chat",
    label: "Chat with Technician",
    icon: MessageSquare,
  },
  {
    to: "/UserDashboard/support",
    label: "Support",
    icon: Headphones,
  },
  {
    to: "/UserDashboard/profile",
    label: "Profile",
    icon: UserRound,
  },
];

export default function Sidebar() {
  return (
    <aside className="db-sidebar">
      <div className="db-sidebar__brand">
        <span className="db-sidebar__mark">FM</span>
        <span>FixMate.lk</span>
      </div>

      <nav className="db-sidebar__nav" aria-label="Customer dashboard">
        <div className="db-sidebar__section">Customer</div>

        <ul className="db-sidebar__list">
          {items.map((item) => {
            const Icon = item.icon;

            return (
              <li key={item.to}>
                <NavLink to={item.to} className="db-side-link">
                  <Icon size={17} />
                  <span className="label">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="db-sidebar__footer">
        <ClipboardList size={16} />
        <span>Customer Portal</span>
      </div>
    </aside>
  );
}
