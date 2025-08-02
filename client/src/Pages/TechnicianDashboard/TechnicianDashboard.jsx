import React from 'react'
import Navbar from '../../Components/Navbar/Navbar'
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout.jsx'
function TechnicianDashboard() {
  return (
    <div>
   <Navbar />
    <DashboardLayout role="technician" />
   </div>
  )
}

export default TechnicianDashboard