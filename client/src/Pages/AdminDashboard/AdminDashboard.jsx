import React from "react";
import {
  Activity,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  DatabaseZap,
  Headphones,
  LayoutDashboard,
  MessageSquare,
  PackageCheck,
  ShieldCheck,
  Star,
  UserCog,
  Users,
  Wrench,
} from "lucide-react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useSearchParams,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext.jsx";
import AdminTopbar from "./components/AdminTopbar.jsx";

import ManageUsers from "./components/ManageUsers.jsx";
import ManageTechnicians from "./components/ManageTechnicians.jsx";
import ManageStaff from "./components/ManageStaff.jsx";
import ManageServices from "./components/ManageServices.jsx";
import ManageAdmins from "./components/ManageAdmins.jsx";
import ManageComplaints from "./components/ManageComplaints.jsx";
import ServiceRequests from "./components/ServiceRequests.jsx";
import AdminProfile from "./components/AdminProfile.jsx";
import Reports from "./components/Reports.jsx";
import AIIngest from "./components/AIIngest.jsx";
import JobsProgress from "./components/JobsProgress.jsx";
import Ratings from "./components/Ratings.jsx";
import Chat from "./components/AdminChat.jsx";

import "./admin-dashboard.css";

function ChatRouteAdapter() {
  const { role } = useAuth();
  const [searchParams] = useSearchParams();

  const props = {
    conversationId: searchParams.get("conversationId") || "",
    withRole: searchParams.get("withRole") || undefined,
    withUserId: searchParams.get("withUserId") || undefined,
    bookingId: searchParams.get("bookingId") || undefined,
    myRole: role,
    title: searchParams.get("title") || "Chat",
    subtitle: searchParams.get("subtitle") || "",
  };

  return (
    <section className="fm-admin-page">
      <div className="fm-admin-pageHeader">
        <span className="fm-admin-eyebrow">Communication</span>
        <h1>Live Chat</h1>
        <p>Manage conversations between customers, technicians, and staff.</p>
      </div>

      <div className="fm-admin-card fm-admin-card--flush">
        <Chat {...props} />
      </div>
    </section>
  );
}

function DashboardOverview({ isAdmin, isSuperAdmin, isCoordinator }) {
  const metricCards = [
    {
      label: "Service Requests",
      value: "Active",
      note: "Track new and ongoing requests.",
      icon: ClipboardList,
    },
    {
      label: "Technicians",
      value: "Network",
      note: "Manage technician profiles.",
      icon: Wrench,
    },
    {
      label: "Customers",
      value: "Accounts",
      note: "Review customer information.",
      icon: Users,
    },
    {
      label: "Operations",
      value: "Control",
      note: "Jobs, complaints, chat, and ratings.",
      icon: Activity,
    },
  ];

  const quickActions = [
    {
      title: "Manage Users",
      text: "Create, update, or remove customer accounts.",
      to: "/AdminDashboard/users",
      icon: Users,
    },
    {
      title: "Service Requests",
      text: "Check requests waiting for action.",
      to: "/AdminDashboard/requests",
      icon: ClipboardList,
      restricted: !(isAdmin || isCoordinator),
    },
    {
      title: "Technicians",
      text: "Review technician access and profile details.",
      to: "/AdminDashboard/technicians",
      icon: Wrench,
    },
    {
      title: "Complaints",
      text: "Review customer complaints and service issues.",
      to: "/AdminDashboard/complaints",
      icon: Headphones,
    },
  ].filter((item) => !item.restricted);

  return (
    <section className="fm-admin-page fm-admin-overview">
      <div className="fm-admin-pageHeader">
        <span className="fm-admin-eyebrow">FixMate Control Center</span>
        <h1>Dashboard Overview</h1>
        <p>
          Manage customers, technicians, services, requests, complaints, chat,
          ratings, and administrator tools from one workspace.
        </p>
      </div>

      <div className="fm-admin-summaryGrid">
        {metricCards.map((item) => {
          const Icon = item.icon;

          return (
            <article className="fm-admin-summaryCard" key={item.label}>
              <div className="fm-admin-summaryIcon">
                <Icon size={19} />
              </div>

              <div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <p>{item.note}</p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="fm-admin-overviewGrid">
        <section className="fm-admin-card">
          <div className="fm-admin-cardHeader">
            <div>
              <span className="fm-admin-cardKicker">Quick Actions</span>
              <h2>Common admin tasks</h2>
            </div>
          </div>

          <div className="fm-admin-actionList">
            {quickActions.map((item) => {
              const Icon = item.icon;

              return (
                <NavLink
                  className="fm-admin-actionItem"
                  to={item.to}
                  key={item.to}>
                  <span>
                    <Icon size={17} />
                  </span>

                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.text}</p>
                  </div>
                </NavLink>
              );
            })}
          </div>
        </section>

        <section className="fm-admin-card">
          <div className="fm-admin-cardHeader">
            <div>
              <span className="fm-admin-cardKicker">Workspace</span>
              <h2>Current access</h2>
            </div>
          </div>

          <div className="fm-admin-roleBox">
            <strong>
              {isSuperAdmin ? "Super Admin" : isAdmin ? "Admin" : "Coordinator"}
            </strong>
            <span>Role-based access is enabled for this dashboard.</span>
          </div>

          <div className="fm-admin-checkList">
            <div>
              <CheckCircle2 size={17} />
              <span>Review pending service requests.</span>
            </div>
            <div>
              <CheckCircle2 size={17} />
              <span>Monitor technician work progress.</span>
            </div>
            <div>
              <CheckCircle2 size={17} />
              <span>Respond to complaints and messages.</span>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}

const renderSideLink = (item) => {
  const Icon = item.icon;

  return (
    <NavLink
      key={item.to}
      to={item.to}
      className={({ isActive }) =>
        `fm-admin-sideLink ${isActive ? "active" : ""}`
      }>
      <span className="fm-admin-sideIcon" aria-hidden="true">
        <Icon size={17} strokeWidth={2} />
      </span>
      <span className="fm-admin-sideText">{item.label}</span>
    </NavLink>
  );
};

export default function AdminDashboard() {
  const { role, loading } = useAuth();

  const normalizedRole = String(role || "").toLowerCase();

  const isAdmin =
    normalizedRole === "admin" || normalizedRole === "super_admin";
  const isSuperAdmin = normalizedRole === "super_admin";
  const isCoordinator =
    normalizedRole === "coordinator" || normalizedRole === "staff";

  const canSeeRequests = isAdmin || isCoordinator;
  const canSeeChat = isAdmin || isCoordinator;
  const canSeeAdminTools = isAdmin;

  const navGroups = [
    {
      title: "General",
      items: [
        {
          label: "Dashboard",
          to: "/AdminDashboard/overview",
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: "People",
      items: [
        {
          label: "Manage Users",
          to: "/AdminDashboard/users",
          icon: Users,
        },
        {
          label: "Manage Technicians",
          to: "/AdminDashboard/technicians",
          icon: Wrench,
        },
        {
          label: "Manage Staff",
          to: "/AdminDashboard/staff",
          icon: BriefcaseBusiness,
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Manage Services",
          to: "/AdminDashboard/services",
          icon: PackageCheck,
        },
        {
          label: "Complaints",
          to: "/AdminDashboard/complaints",
          icon: Headphones,
        },
        ...(canSeeRequests
          ? [
              {
                label: "Service Requests",
                to: "/AdminDashboard/requests",
                icon: ClipboardList,
              },
            ]
          : []),
        ...(canSeeChat
          ? [
              {
                label: "Chat",
                to: "/AdminDashboard/chat",
                icon: MessageSquare,
              },
            ]
          : []),
        {
          label: "Ratings",
          to: "/AdminDashboard/ratings",
          icon: Star,
        },
        {
          label: "Jobs & Progress",
          to: "/AdminDashboard/jobs",
          icon: Activity,
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          label: "My Profile",
          to: "/AdminDashboard/profile",
          icon: UserCog,
        },
      ],
    },
    ...(canSeeAdminTools
      ? [
          {
            title: isSuperAdmin ? "Super Admin" : "Administration",
            items: [
              {
                label: "Manage Admins",
                to: "/AdminDashboard/admins",
                icon: ShieldCheck,
              },
              {
                label: "Reports",
                to: "/AdminDashboard/reports",
                icon: BarChart3,
              },
              {
                label: "AI Ingest",
                to: "/AdminDashboard/ai-ingest",
                icon: DatabaseZap,
              },
            ],
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <div className="fm-admin-shell fm-admin-shell--loading">
        <aside className="fm-admin-sidebar">
          <div className="fm-admin-brand">
            <span className="fm-admin-brandMark">F</span>
            <span className="fm-admin-brandText">
              <strong>FixMate</strong>
              <small>Admin Console</small>
            </span>
          </div>
        </aside>

        <header className="fm-admin-topbar">
          <div className="fm-admin-topbarLeft">
            <h1>Loading dashboard</h1>
            <p>Please wait while your workspace is prepared.</p>
          </div>
        </header>

        <main className="fm-admin-content">
          <div className="fm-admin-loadingCard">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="fm-admin-shell">
      <aside className="fm-admin-sidebar">
        <div className="fm-admin-brand">
          <span className="fm-admin-brandMark">F</span>

          <span className="fm-admin-brandText">
            <strong>FixMate</strong>
            <small>Admin Console</small>
          </span>
        </div>

        <nav className="fm-admin-sideNav" aria-label="Admin dashboard">
          {navGroups.map((group) => (
            <section className="fm-admin-navGroup" key={group.title}>
              <div className="fm-admin-sideSection">{group.title}</div>
              {group.items.map(renderSideLink)}
            </section>
          ))}
        </nav>
      </aside>

      <AdminTopbar />

      <main className="fm-admin-content">
        <Routes>
          <Route index element={<Navigate to="overview" replace />} />

          <Route
            path="overview"
            element={
              <DashboardOverview
                isAdmin={isAdmin}
                isSuperAdmin={isSuperAdmin}
                isCoordinator={isCoordinator}
              />
            }
          />

          <Route path="users" element={<ManageUsers />} />
          <Route path="technicians" element={<ManageTechnicians />} />
          <Route path="staff" element={<ManageStaff />} />
          <Route path="services" element={<ManageServices />} />

          <Route
            path="complaints"
            element={
              <ManageComplaints
                role={isCoordinator ? "coordinator" : "admin"}
              />
            }
          />

          {canSeeRequests ? (
            <Route path="requests" element={<ServiceRequests />} />
          ) : null}

          {canSeeChat ? (
            <Route path="chat" element={<ChatRouteAdapter />} />
          ) : null}

          <Route path="ratings" element={<Ratings />} />
          <Route path="jobs" element={<JobsProgress />} />
          <Route path="profile" element={<AdminProfile />} />

          {canSeeAdminTools ? (
            <>
              <Route path="admins" element={<ManageAdmins />} />
              <Route path="reports" element={<Reports />} />
              <Route path="ai-ingest" element={<AIIngest />} />
            </>
          ) : null}

          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </main>
    </div>
  );
}
