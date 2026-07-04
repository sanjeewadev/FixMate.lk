import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import TechnicianSidebar from "./TechnicianSidebar.jsx";
import TechnicianTopbar from "./TechnicianTopbar.jsx";
import "./technician-dashboard.css";

import TechnicianProfile from "./TechnicianProfile.jsx";

import OverviewTab from "./tabs/OverviewTab.jsx";
import AssignedTab from "./tabs/AssignedTab.jsx";
import PendingTab from "./tabs/PendingTab.jsx";
import ApprovedTab from "./tabs/ApprovedTab.jsx";
import CompletedTab from "./tabs/CompletedTab.jsx";
import TechnicianChat from "./tabs/TechnicianChat.jsx";

const VALID_TABS = new Set([
  "overview",
  "assigned",
  "pending",
  "approved",
  "completed",
  "chat",
  "profile",
]);

export default function TechnicianDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.toLowerCase();

    if (path.endsWith("/techniciandashboard/chat")) {
      setActiveTab("chat");
      return;
    }

    const lastSegment = path.split("/").filter(Boolean).at(-1);

    if (VALID_TABS.has(lastSegment)) {
      setActiveTab(lastSegment);
    }
  }, [location.pathname]);

  const handleTabChange = (tabKey) => {
    if (!VALID_TABS.has(tabKey)) return;
    setActiveTab(tabKey);
  };

  return (
    <div className="fm-tech-shell tech-dashboard">
      <TechnicianSidebar activeTab={activeTab} setActiveTab={handleTabChange} />

      <div className="tech-main">
        <TechnicianTopbar activeTab={activeTab} />

        <main className="tech-content">
          {activeTab === "overview" ? <OverviewTab /> : null}
          {activeTab === "assigned" ? <AssignedTab /> : null}
          {activeTab === "pending" ? <PendingTab /> : null}
          {activeTab === "approved" ? <ApprovedTab /> : null}
          {activeTab === "completed" ? <CompletedTab /> : null}
          {activeTab === "chat" ? <TechnicianChat /> : null}
          {activeTab === "profile" ? <TechnicianProfile /> : null}
        </main>
      </div>
    </div>
  );
}
