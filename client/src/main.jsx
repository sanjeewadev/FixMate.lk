import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AboutUs from './Pages/AboutUs/AboutUs.jsx'
import Services from './Pages/Services/Services.jsx'
import AdminDashboard from './Pages/AdminDashboard/AdminDashboard.jsx'
import UserDashboard from './Pages/UserDashboard/UserDashboard.jsx'
import TechnicianDashboard from './Pages/TechnicianDashboard/TechnicianDashboard.jsx'
import StaffDashboard from './Pages/StaffDashboard/StaffDashboard.jsx'
import UserProfile from './Components/UserProfile/UserProfile.jsx';

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/AboutUs",
    element: <AboutUs />,
  },
  {
    path: "/Services",
    element: <Services />,
  },
  {
    path: "/AdminDashboard",
    element: <AdminDashboard />,
  },
  {
  path: "/UserDashboard",
  element: <UserDashboard />,
  children: [
    {
      path: "profile",
      element: <UserProfile />,
    },
    // other user routes can go here
  ],
},
  {
    path: "/TechnicianDashboard",
    element: <TechnicianDashboard />,
  },
  {
    path: "/StaffDashboard",
    element: <StaffDashboard />,
  },
]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
