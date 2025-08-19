import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/tokens.css";

import App from "./App.jsx";
import AboutUs from "./Pages/AboutUs/AboutUs.jsx";
import Services from "./Pages/Services/Services.jsx";
import AdminDashboard from "./Pages/AdminDashboard/AdminDashboard.jsx";
import UserDashboard from "./Pages/UserDashboard/UserDashboard.jsx";
import TechnicianDashboard from "./Pages/TechnicianDashboard/TechnicianDashboard.jsx";
import StaffDashboard from "./Pages/StaffDashboard/StaffDashboard.jsx";
import UserProfile from "./Components/UserProfile/UserProfile.jsx";
import BookService from "./Pages/BookService/BookService.jsx";
import TechnicianRegisterForm from "./Pages/TechnicianRegisterForm/TechnicianRegisterForm.jsx";
import Support from "./Pages/UserDashboard/Support.jsx";
import Overview from "./Pages/UserDashboard/Overview.jsx";
import MyBookings from "./Pages/UserDashboard/MyBookings.jsx";
import BookingDetails from "./Pages/UserDashboard/BookingDetails.jsx";
import Chatwithtechni from "./Components/chat/ChatPanel.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Auth context + route guard
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/AboutUs", element: <AboutUs /> },
  { path: "/Services", element: <Services /> },

  {
    path: "/book",
    element: (
      <ProtectedRoute>
        <BookService />
      </ProtectedRoute>
    ),
  },

  { path: "/AdminDashboard", element: <AdminDashboard /> },

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
      { path: "profile", element: <UserProfile /> },
      { path: "chat", element: <Chatwithtechni /> },
      { path: "support", element: <Support /> },
    ],
  },

  { path: "/TechnicianRegisterForm", element: <TechnicianRegisterForm /> },
  { path: "/TechnicianDashboard", element: <TechnicianDashboard /> },
  { path: "/StaffDashboard", element: <StaffDashboard /> },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {/* This single wrapper applies Inter site-wide */}
    <div className="fontBody">
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </div>
  </StrictMode>
);
