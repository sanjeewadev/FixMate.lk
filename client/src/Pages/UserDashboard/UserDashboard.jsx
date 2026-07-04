import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import DashboardTopbar from "./components/DashboardTopbar.jsx";
import Sidebar from "./components/Sidebar.jsx";

import Overview from "./components/Overview.jsx";
import BookService from "./components/BookService.jsx";
import BookingDetails from "./components/BookingDetails.jsx";
import MyBookings from "./components/MyBookings.jsx";
import Complaints from "./components/Complaints.jsx";
import Ratings from "./components/Ratings.jsx";
import ChatTech from "./components/ChatTech.jsx";
import Support from "./components/Support.jsx";
import UserProfile from "./components/UserProfile.jsx";

import "./user-dashboard.css";

export default function UserDashboard() {
  return (
    <div className="fm-user-shell">
      <Sidebar role="user" />

      <div className="fm-user-main">
        <DashboardTopbar />

        <main className="fm-user-content">
          <Routes>
            <Route index element={<Navigate to="overview" replace />} />

            <Route path="overview" element={<Overview />} />
            <Route path="book" element={<BookService />} />
            <Route path="booking/:id" element={<BookingDetails />} />
            <Route path="history" element={<MyBookings />} />
            <Route path="complaints" element={<Complaints />} />
            <Route path="ratings" element={<Ratings />} />
            <Route path="chat" element={<ChatTech />} />
            <Route path="support" element={<Support />} />
            <Route path="profile" element={<UserProfile />} />

            <Route path="*" element={<Navigate to="overview" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
