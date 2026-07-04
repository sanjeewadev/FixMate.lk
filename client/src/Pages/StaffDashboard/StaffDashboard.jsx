import React from "react";
import { Navigate, Route, Routes, useSearchParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

import "./staff-dashboard.css";

import StaffTopbar from "./components/StaffTopbar.jsx";
import StaffSidebar from "./components/StaffSidebar.jsx";

import StaffProfile from "./components/StaffProfile.jsx";
import ServiceRequests from "./components/ServiceRequests.jsx";
import JobsProgress from "./components/JobsProgress.jsx";
import ManageComplaints from "./components/ManageComplaints.jsx";
import AdminChat from "./components/AdminChat.jsx";
import TechniciansList from "./components/TechniciansList.jsx";
import CustomersList from "./components/CustomersList.jsx";

function ChatRouteAdapter() {
  const [searchParams] = useSearchParams();

  return (
    <AdminChat
      conversationId={searchParams.get("conversationId") || ""}
      withRole={searchParams.get("withRole") || ""}
      withUserId={searchParams.get("withUserId") || ""}
      bookingId={searchParams.get("bookingId") || ""}
      title={searchParams.get("title") || ""}
      subtitle={searchParams.get("subtitle") || ""}
    />
  );
}

function StaffShellLoading() {
  return (
    <div className="fm-staff-shell staff-shell isLoading">
      <aside className="staff-sidebar">
        <div className="brand">
          <span className="brand-mark">FM</span>
          <span>FixMate.lk</span>
        </div>

        <nav className="side-nav" aria-label="Loading staff navigation">
          <div className="side-section">Loading</div>
          <div className="fm-staff-skeletonLink" />
          <div className="fm-staff-skeletonLink" />
          <div className="fm-staff-skeletonLink" />
        </nav>
      </aside>

      <header className="staff-topbar">
        <div className="left">
          <strong>Coordinator Dashboard</strong>
        </div>
      </header>

      <main className="staff-content">
        <div className="fm-staff-loadingCard">
          <span className="fm-staff-loadingDot" />
          <div>
            <strong>Loading dashboard</strong>
            <p>Please wait while your coordinator workspace is prepared.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function StaffAccessGuard() {
  return (
    <div className="fm-staff-guard staff-guard">
      <div className="fm-staff-guard__card guard-card">
        <span>Restricted Area</span>
        <h3>Access restricted</h3>
        <p>This dashboard is available only for coordinators.</p>
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const { role, loading } = useAuth();

  const normalizedRole = String(role || "").toLowerCase();
  const isCoordinator =
    normalizedRole === "coordinator" || normalizedRole === "staff";

  if (loading) {
    return <StaffShellLoading />;
  }

  if (!isCoordinator) {
    return <StaffAccessGuard />;
  }

  return (
    <div className="fm-staff-shell staff-shell">
      <StaffSidebar />
      <StaffTopbar />

      <main className="staff-content">
        <Routes>
          <Route index element={<Navigate to="requests" replace />} />

          <Route path="requests" element={<ServiceRequests />} />
          <Route path="jobs" element={<JobsProgress />} />
          <Route
            path="complaints"
            element={<ManageComplaints role="coordinator" />}
          />
          <Route path="chat" element={<ChatRouteAdapter />} />
          <Route path="profile" element={<StaffProfile />} />
          <Route path="techlist" element={<TechniciansList />} />
          <Route path="customerlist" element={<CustomersList />} />

          <Route path="*" element={<Navigate to="requests" replace />} />
        </Routes>
      </main>
    </div>
  );
}
