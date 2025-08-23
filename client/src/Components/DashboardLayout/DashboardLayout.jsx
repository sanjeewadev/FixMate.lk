import React from "react";
import "./DashboardLayout.css";
import { Outlet, NavLink } from "react-router-dom";

const Sidebar = ({ role }) => {
  // Real routes per role
  const menu = {
    admin: [
       { name: "Service Request", to: "/AdminDashboard/requests" },
       { name: "Manage Users", to: "/AdminDashboard/manage-users" },
       { name: "Manage Services", to: "/AdminDashboard/services" },
       { name: "View Reports", to: "/AdminDashboard/reports" },
       { name: "Manage Staff", to: "/AdminDashboard/staff" },
       { name: "Manage Technician", to: "/AdminDashboard/technicians" },
       { name: "Manage Admin", to: "/AdminDashboard/admins" },
       { name: "Customer Complaints", to: "/AdminDashboard/complaints" },
       { name: "Technicians Rating", to: "/AdminDashboard/rating" },
    ],

    technician: [
      { name: "Profile", to: "/TechnicianDashboard/profile" },
    ],
    staff: [
      { name: "Service Request", to: "/StaffDashboard/requests" },
      { name: "Manage Technician", to: "/StaffDashboard/staff-technicians" },
      { name: "Manage Users", to: "/StaffDashboard/manage-users" },
      { name: "Customer Complaints", to: "/StaffDashboard/complaints" },

    ],
    user: [
      { name: "🏠 Overview", to: "/UserDashboard/overview" },
      { name: "📅 Book Service", to: "/UserDashboard/book" },
      { name: "📜 Service History", to: "/UserDashboard/history" },
      { name: "⚠️ My Complaints", to: "/UserDashboard/complaints" },
      { name: "⭐ Ratings", to: "/UserDashboard/ratings" },
      { name: "💬 Chat with Technician", to: "/UserDashboard/chat" },
      { name: "🛟 Support", to: "/UserDashboard/support" },
      { name: "👤 Profile", to: "/UserDashboard/profile" },
    ],
  };

  const items = menu[role] || [];

  return (
    <div className="sidebar">
      <h2 className="dashboard-lay-h2">Fixmate {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
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
