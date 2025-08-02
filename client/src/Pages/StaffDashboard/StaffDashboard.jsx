import React from 'react'
import Navbar from '../../Components/Navbar/Navbar'
import DashboardLayout from '../../Components/DashboardLayout/DashboardLayout.jsx'

function StaffDashboard() {
  return (
     <div>
   <Navbar />
    <DashboardLayout role="staff" />
   </div>
  )
}

export default StaffDashboard