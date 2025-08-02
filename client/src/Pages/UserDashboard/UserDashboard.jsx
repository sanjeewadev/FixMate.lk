import React from 'react';
import Navbar from '../../Components/Navbar/Navbar';
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout.jsx';
import { Outlet } from 'react-router-dom';

const UserDashboard = () => {
  return (
    <div>
      <Navbar />
      <DashboardLayout role="user" />
    </div>
  );
};

export default UserDashboard;
