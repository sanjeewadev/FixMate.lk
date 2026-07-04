import React from "react";
import {
  BriefcaseBusiness,
  ClipboardList,
  MessageSquare,
  UserRound,
  Users,
  Wrench,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const menuGroups = [
  {
    title: "Coordinator",
    items: [
      {
        to: "/StaffDashboard/requests",
        label: "Service Requests",
        icon: ClipboardList,
      },
      {
        to: "/StaffDashboard/jobs",
        label: "Jobs & Progress",
        icon: Wrench,
      },
      {
        to: "/StaffDashboard/chat",
        label: "Chat",
        icon: MessageSquare,
      },
      {
        to: "/StaffDashboard/complaints",
        label: "Complaints",
        icon: BriefcaseBusiness,
      },
      {
        to: "/StaffDashboard/customerlist",
        label: "Customers",
        icon: Users,
      },
      {
        to: "/StaffDashboard/techlist",
        label: "Technicians",
        icon: Wrench,
      },
    ],
  },
  {
    title: "Account",
    items: [
      {
        to: "/StaffDashboard/profile",
        label: "My Profile",
        icon: UserRound,
      },
    ],
  },
];

export default function StaffSidebar() {
  return (
    <aside className="staff-sidebar">
      <div className="brand">
        <span className="brand-mark">FM</span>
        <span>FixMate.lk</span>
      </div>

      <nav className="side-nav" aria-label="Coordinator dashboard navigation">
        {menuGroups.map((group) => (
          <React.Fragment key={group.title}>
            <div className="side-section">{group.title}</div>

            {group.items.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `side-link ${isActive ? "active" : ""}`
                  }>
                  <Icon size={17} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </React.Fragment>
        ))}
      </nav>
    </aside>
  );
}
