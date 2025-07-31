import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AboutUs from './Pages/AboutUs/AboutUs.jsx'
import Services from './Pages/Services/Services.jsx'
import AdminDashboard from './Pages/AdminDashboard/AdminDashboard.jsx'

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
]);
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
