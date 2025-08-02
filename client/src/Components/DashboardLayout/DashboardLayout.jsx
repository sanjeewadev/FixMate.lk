import React from "react";
import "./DashboardLayout.css";
import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";

const Sidebar = ({ role }) => {
  const menuItems = {
    admin: [
      { name: "Service Request" },
      { name: "Manage Users" },
      { name: "Manage Services" },
      { name: "View Reports" },
      { name: "Manage Staff" },
      { name: "Manage Technician" },
    ],
    technician: [
      { name: "Assigned Tasks" },
      { name: "Profile" },
    ],
    staff: [
      { name: "Verify Requests" },
      { name: "Assign Technicians" },
    ],
    user: [
      { name: "Book Service" },
      { name: "Service History" },
      { name: "Profile" },
    ],
  };

  return (
    <div className="sidebar">
      <h2>Fixmate {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
      <p className="role-label">{role}</p>
      <ul>
        {menuItems[role].map((item, index) => (
          <li key={index}>
            <Link to={`/UserDashboard/${item.name.replace(/\s+/g, '').toLowerCase()}`}>
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

const DashboardLayout = ({ role = " " }) => {
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
