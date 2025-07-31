import React from "react";
import { FaHome } from "react-icons/fa";
import "./DashboardLayout.css";

const Sidebar = ({ role }) => {
  const menuItems = {
    admin: [
      { name: "Dashboard", icon: <FaHome /> },
      { name: "Service Request" },
      { name: "Manage Users" },
      { name: "Manage Services" },
      { name: "View Reports" },
      { name: "Manage Staff" },
      { name: "Manage Technician" },
    ],
    technician: [
      { name: "Dashboard", icon: <FaHome /> },
      { name: "Assigned Tasks" },
      { name: "My Profile" },
    ],
    staff: [
      { name: "Dashboard", icon: <FaHome /> },
      { name: "Verify Requests" },
      { name: "Assign Technicians" },
    ],
    user: [
      { name: "Dashboard", icon: <FaHome /> },
      { name: "My Requests" },
      { name: "Submit Request" },
      { name: "My Profile" },
    ],
  };

  return (
    <div className="sidebar">
      <h2>Fixmate {role.charAt(0).toUpperCase() + role.slice(1)}</h2>
      <p className="role-label">{role}</p>
      <ul>
        {menuItems[role].map((item, index) => (
          <li key={index}>
            {item.icon && <span className="icon">{item.icon}</span>}
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  );
};

const DashboardContent = () => {
  return (
    <div className="dashboard-content">
      <section className="section-card">
        <h2>Service Requests</h2>
        <table>
          <thead>
            <tr>
              <th>Request ID</th>
              <th>Customer Name</th>
              <th>Service Type</th>
              <th>Requested Date & Time</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#12345</td>
              <td>ss</td>
              <td>Plumbing</td>
              <td>2024-03-15 10:00 AM</td>
              <td><span className="status pending">Pending</span></td>
              <td><button>View & Assign</button></td>
            </tr>
            <tr>
              <td>#12346</td>
              <td>ff</td>
              <td>Electrical</td>
              <td>2024-03-15 02:00 PM</td>
              <td><span className="status assigned">Assigned</span></td>
              <td><button>View & Assign</button></td>
            </tr>
            <tr>
              <td>#12347</td>
              <td>rr</td>
              <td>HVAC</td>
              <td>2024-03-16 09:00 AM</td>
              <td><span className="status completed">Completed</span></td>
              <td><button>View & Assign</button></td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="section-card">
        <h2>Manage Users</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>aa</td>
              <td>aa@email.com</td>
              <td>Customer</td>
              <td><span className="status active">Active</span></td>
              <td>View | Edit | Delete</td>
            </tr>
            <tr>
              <td>bb</td>
              <td>bbt@email.com</td>
              <td>Technician</td>
              <td><span className="status active">Active</span></td>
              <td>View | Edit | Delete</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

const DashboardLayout = ({ role = "admin" }) => {
  return (
    <div className="dashboard-wrapper">
      <Sidebar role={role} />
      <DashboardContent />
    </div>
  );
};

export default DashboardLayout;
