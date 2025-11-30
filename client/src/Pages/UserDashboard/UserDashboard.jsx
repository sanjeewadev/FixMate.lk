// src/Pages/UserDashboard/UserDashboard.jsx
import React from "react";
import Navbar from "../../Pages/UserDashboard/components/DashboardTopbar.jsx";
import DashboardLayout from "../../Components/DashboardLayout/DashboardLayout.jsx";

const UserDashboard = () => {
  return (
    <>
      <Navbar />
      <DashboardLayout role="user" />
    </>
  );
};

export default UserDashboard;