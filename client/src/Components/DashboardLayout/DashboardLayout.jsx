import React from "react";
import "./DashboardLayout.css";
import { Outlet, NavLink } from "react-router-dom";

const Sidebar = ({ role }) => {
  // Real routes per role
  const menu = {
    admin: [
      { name: "Service Request", to: "/AdminDashboard/requests" },
      { name: "Manage Users", to: "/AdminDashboard/users" },
      { name: "Manage Services", to: "/AdminDashboard/services" },
      { name: "View Reports", to: "/AdminDashboard/reports" },
      { name: "Manage Staff", to: "/AdminDashboard/staff" },
      { name: "Manage Technician", to: "/AdminDashboard/technicians" },
    ],
    technician: [
      { name: "Assigned Tasks", to: "/TechnicianDashboard/tasks" },
      { name: "Profile", to: "/TechnicianDashboard/profile" },
    ],
    staff: [
      { name: "Verify Requests", to: "/StaffDashboard/verify" },
      { name: "Assign Technicians", to: "/StaffDashboard/assign" },
    ],
    user: [
      { name: "Overview", to: "/UserDashboard/overview" },
      { name: "Book Service", to: "/UserDashboard/book" }, // uses same BookService page
      { name: "Service History", to: "/UserDashboard/history" },
      { name: "Profile", to: "/UserDashboard/profile" },
      { name: "Chat", to: "/UserDashboard/chat" },
      { name: "Support", to: "/UserDashboard/support" },
    ],
  };

  const items = menu[role] || [];

  return (
    <div className="sidebar">
      <h2>Fixmate {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
      <ul>
        {items.map((item, i) => (
          <li key={i}>
            <NavLink
              to={item.to}
              className={({ isActive }) => (isActive ? "active" : "")}
            >
              {item.name}
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
};

const DashboardLayout = ({ role = "user" }) => {
  return (
    <div className="dashboard-wrapper">
      <Sidebar role={role} />
      <div className="dashboard-content">
        <Outlet />
      </div>
    </div>
  );
};

export default DashboardLayout;
