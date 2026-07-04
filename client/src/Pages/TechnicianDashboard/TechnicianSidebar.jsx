import React from "react";
import {
  CheckCircle2,
  Clock3,
  ClipboardList,
  LayoutDashboard,
  MessageSquare,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import "./technician-dashboard.css";

const links = [
  {
    key: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    key: "assigned",
    label: "Assigned Tasks",
    icon: ClipboardList,
  },
  {
    key: "pending",
    label: "Pending Approval",
    icon: Clock3,
  },
  {
    key: "approved",
    label: "Approved Requests",
    icon: ShieldCheck,
  },
  {
    key: "completed",
    label: "Completed",
    icon: CheckCircle2,
  },
  {
    key: "chat",
    label: "Chat",
    icon: MessageSquare,
  },
  {
    key: "profile",
    label: "Profile",
    icon: UserRound,
  },
];

export default function TechnicianSidebar({ setActiveTab, activeTab }) {
  return (
    <aside className="tech-sidebar">
      <div className="tech-sidebar__brand">
        <span className="tech-sidebar__mark">FM</span>
        <span>FixMate.lk</span>
      </div>

      <nav className="tech-sidebar__nav" aria-label="Technician dashboard">
        <div className="tech-sidebar__section">Technician</div>

        <ul>
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.key;

            return (
              <li key={link.key}>
                <button
                  type="button"
                  className={`tech-nav-link ${isActive ? "active" : ""}`}
                  onClick={() => setActiveTab(link.key)}
                  aria-current={isActive ? "page" : undefined}>
                  <Icon size={17} />
                  <span>{link.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
