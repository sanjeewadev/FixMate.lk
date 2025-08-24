
 import React, { useEffect, useState } from "react";
 import { useLocation } from "react-router-dom";
  import TechnicianSidebar from "./TechnicianSidebar.jsx";
  import TechnicianTopbar from "./TechnicianTopbar.jsx";
  import "./technician-dashboard.css";

  // Existing separated pieces
  import TechnicianProfile from "./TechnicianProfile.jsx";

  // NEW: tab components
  import OverviewTab from "./tabs/OverviewTab.jsx";
  import AssignedTab from "./tabs/AssignedTab.jsx";
  import PendingTab from "./tabs/PendingTab.jsx";
  import ApprovedTab from "./tabs/ApprovedTab.jsx";
  import CompletedTab from "./tabs/CompletedTab.jsx";
 import TechnicianChat from "./tabs/TechnicianChat.jsx"; // 👈 add

  export default function TechnicianDashboard() {
    const [activeTab, setActiveTab] = useState("overview");
   const location = useLocation();

   // If URL is /TechnicianDashboard/chat → switch to Chat tab
   useEffect(() => {
     const p = location.pathname.toLowerCase();
     if (p.endsWith("/techniciandashboard/chat")) {
       setActiveTab("chat");
     }
   }, [location.pathname]);

    return (
      <div className="tech-dashboard">
        <TechnicianSidebar setActiveTab={setActiveTab} activeTab={activeTab} />

        <div className="tech-main">
          <TechnicianTopbar />

          <div className="tech-content">
            {activeTab === "overview" && <OverviewTab />}
            {activeTab === "assigned" && <AssignedTab />}
            {activeTab === "pending" && <PendingTab />}
            {activeTab === "approved" && <ApprovedTab />}
            {activeTab === "completed" && <CompletedTab />}
           {activeTab === "chat" && <TechnicianChat />}     {/* 👈 render chat */}
            {activeTab === "profile" && <TechnicianProfile />}
          </div>
        </div>
      </div>
    );
  }
