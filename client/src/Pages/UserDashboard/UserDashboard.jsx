import React from "react";
import {
  CalendarPlus,
  ClipboardList,
  Headphones,
  History,
  LayoutDashboard,
  MessageSquare,
  Star,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

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

const mobileNavItems = [
  { to: "/UserDashboard/overview", label: "Home", icon: LayoutDashboard },
  { to: "/UserDashboard/book", label: "Book", icon: CalendarPlus },
  { to: "/UserDashboard/history", label: "History", icon: History },
  { to: "/UserDashboard/complaints", label: "Complaints", icon: TriangleAlert },
  { to: "/UserDashboard/ratings", label: "Ratings", icon: Star },
  { to: "/UserDashboard/chat", label: "Chat", icon: MessageSquare },
  { to: "/UserDashboard/support", label: "Support", icon: Headphones },
  { to: "/UserDashboard/profile", label: "Profile", icon: UserRound },
];

export default function UserDashboard() {
  const location = useLocation();

  return (
    <div className="fm-user-shell">
      <Sidebar role="user" />

      <div className="fm-user-main">
        <DashboardTopbar />

        <nav
          className="fm-user-mobile-nav"
          aria-label="Customer mobile navigation"
        >
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`fm-user-mobile-nav__item ${isActive ? "active" : ""}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

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
