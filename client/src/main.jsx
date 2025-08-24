// src/main.jsx (or wherever your router is bootstrapped)
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "./App.jsx";
import AboutUs from "./Pages/AboutUs/AboutUs.jsx";
import Services from "./Pages/Services/Services.jsx";

import AdminDashboard from "./Pages/AdminDashboard/AdminDashboard.jsx";
import UserDashboard from "./Pages/UserDashboard/UserDashboard.jsx";
import TechnicianDashboard from "./Pages/TechnicianDashboard/TechnicianDashboard.jsx"; // ✅ fixed path
import StaffDashboard from "./Pages/StaffDashboard/StaffDashboard.jsx";

import UserProfile from "./Components/UserProfile/UserProfile.jsx";
import BookService from "./Pages/BookService/BookService.jsx";

import Overview from "./Pages/UserDashboard/Overview.jsx";
import MyBookings from "./Pages/UserDashboard/MyBookings.jsx";
import BookingDetails from "./Pages/UserDashboard/BookingDetails.jsx";
import Support from "./Pages/UserDashboard/Support.jsx";
import Complaints from "./Pages/UserDashboard/Complaints.jsx";
import Ratings from "./Pages/UserDashboard/Ratings.jsx";
import ChatTech from "./Pages/UserDashboard/ChatTech.jsx";

// Admin nested pages
import ManageUsers from "./Pages/AdminDashboard/components/ManageUsers.jsx";
import ManageStaff from "./Pages/AdminDashboard/components/ManageStaff.jsx";
import ManageTechnicians from "./Pages/AdminDashboard/components/ManageTechnicians.jsx";
import ManageAdmins from "./Pages/AdminDashboard/components/ManageAdmins.jsx";
import ManageServices from "./Pages/AdminDashboard/components/ManageServices.jsx";
import ServiceRequestsAdmin from "./Pages/AdminDashboard/components/ServiceRequests.jsx";
import ManageComplaints from "./Pages/AdminDashboard/components/ManageComplaints.jsx";
import RateTechnician from "./Pages/AdminDashboard/components/RateTechnician.jsx";

import TechnicianRegisterForm from "./Pages/TechnicianRegisterForm/TechnicianRegisterForm.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Auth guard
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/AboutUs", element: <AboutUs /> },
  { path: "/Services", element: <Services /> },

  // Public technician registration
  { path: "/TechnicianRegisterForm", element: <TechnicianRegisterForm /> },

  // Only logged-in customers can access booking
  {
    path: "/book",
    element: (
      <ProtectedRoute>
        <BookService />
      </ProtectedRoute>
    ),
  },

  // Admin dashboard (protected) with nested routes
  {
    path: "/AdminDashboard/*",
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
    children: [
      { path: "manage-users", element: <ManageUsers /> },
      { path: "staff", element: <ManageStaff /> },
      { path: "technicians", element: <ManageTechnicians /> },
      { path: "admins", element: <ManageAdmins /> },
      { path: "services", element: <ManageServices /> },
      { path: "requests", element: <ServiceRequestsAdmin /> },
      { path: "complaints", element: <ManageComplaints /> },
      { path: "rating", element: <RateTechnician /> },
    ],
  },

  // FULL User Dashboard with nested pages (protected)
  {
    path: "/UserDashboard",
    element: (
      <ProtectedRoute>
        <UserDashboard />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Overview /> },
      { path: "overview", element: <Overview /> },
      { path: "book", element: <BookService /> },
      { path: "history", element: <MyBookings /> },
      { path: "booking/:id", element: <BookingDetails /> },
      { path: "complaints", element: <Complaints /> },
      { path: "ratings", element: <Ratings /> },
      { path: "chat", element: <ChatTech /> },
      { path: "support", element: <Support /> },
      { path: "profile", element: <UserProfile /> },
      { path: "profile", element: <UserProfile /> },
      ],
  },

  // Technician dashboard (tabbed internally)
  { path: "/TechnicianDashboard", element: <TechnicianDashboard /> },
  // ✅ Extra route so "/TechnicianDashboard/chat" opens the same component
  //    (your TechnicianDashboard will switch to the Chat tab based on location)
  { path: "/TechnicianDashboard/chat", element: <TechnicianDashboard /> },

  // Staff
  {
    path: "/StaffDashboard/*",
    element: (
        <StaffDashboard />
    ),
    children: [{ path: "requests", element: <ServiceRequestsAdmin /> }],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <div className="fontBody">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </div>
  </StrictMode>
);
