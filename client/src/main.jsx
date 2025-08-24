import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

import App from "./App.jsx";
import AboutUs from "./Pages/AboutUs/AboutUs.jsx";
import Services from "./Pages/Services/Services.jsx";

import AdminDashboard from "./Pages/AdminDashboard/AdminDashboard.jsx";
import UserDashboard from "./Pages/UserDashboard/UserDashboard.jsx";
import TechnicianDashboard from "./Pages/TechnicianDashboard/TechnicianDashboard.jsx";
import StaffDashboard from "./Pages/StaffDashboard/StaffDashboard.jsx";

import UserProfile from "./Components/UserProfile/UserProfile.jsx";
import BookService from "./Pages/BookService/BookService.jsx";

import Overview from "./Pages/UserDashboard/Overview.jsx";
import MyBookings from "./Pages/UserDashboard/MyBookings.jsx";
import BookingDetails from "./Pages/UserDashboard/BookingDetails.jsx";

import Chatwithtechni from "./Components/chat/ChatPanel.jsx";
// import ReceiptDetails from "./Pages/UserDashboard/ReceiptDetails.jsx";
import Support from "./Pages/UserDashboard/Support.jsx";
import TechnicianRegisterForm from "./Pages/TechnicianRegisterForm/TechnicianRegisterForm.jsx";
import Complaints from "./Pages/UserDashboard/Complaints.jsx";
import Ratings from "./Pages/UserDashboard/Ratings.jsx";
import ChatTech from "./Pages/UserDashboard/ChatTech.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

// 🔐 Auth
import { AuthProvider } from "./context/AuthContext.jsx";
import ProtectedRoute from "./Components/ProtectedRoute.jsx";

const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/AboutUs", element: <AboutUs /> },
  { path: "/Services", element: <Services /> },

  // only logged-in customers should access booking
  {
    path: "/book",
    element: (
      <ProtectedRoute>
        <BookService />
      </ProtectedRoute>
    ),
  },

  // Dashboards: use /* so nested routes resolve (e.g., /StaffDashboard/profile)
  {
    path: "/AdminDashboard/*",
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/TechnicianDashboard/*",
    element: (
      <ProtectedRoute>
        <TechnicianDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/StaffDashboard/*",
    element: (
      <ProtectedRoute>
        <StaffDashboard />
      </ProtectedRoute>
    ),
  },

  // FULL User Dashboard (kept as nested routes)
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
<<<<<<< HEAD
      { path: "receipts", element: <Receipts /> },
      { path: "receipt/:id", element: <ReceiptDetails /> },
    ],
  },
=======
      // { path: "receipt/:id", element: <ReceiptDetails /> },
      { path: "profile", element: <UserProfile /> },
    ],
  },

  {path: "/TechnicianDashboard", element: (<TechnicianDashboard /> ), },
  {path: "/TechnicianRegisterForm", element: (<TechnicianRegisterForm /> ), },

  {path: "/StaffDashboard", element: <StaffDashboard />,
     children: [
     { path: "requests", element: <ServiceRequests /> },
  ],
  },
>>>>>>> final-backup-08/22-sanjeewa
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
