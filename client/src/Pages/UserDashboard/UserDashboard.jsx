// src/Pages/UserDashboard/UserDashboard.jsx
import React from "react";
import Navbar from "../../Pages/UserDashboard/components/DashboardTopbar.jsx";
import DashboardLayout from "../../Components/DashboardLayout/DashboardLayout.jsx";

const UserDashboard = () => {
  return (
    <>
      <Navbar />               {/* <= add this back */}
      <DashboardLayout role="user" />
    </>
  );
};

export default UserDashboard;