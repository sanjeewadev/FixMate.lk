// src/Components/Navbar/Navbar.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MenuLink from "../MenuLink/MenuLink.jsx";
import "./navbar.css";

import Login from "../Login/Login.jsx";
import UserRegister from "../UserRegister/UserRegister.jsx";
import TechnicianRegister from "../TechnicianRegister/TechnicianRegister.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

function Navbar() {
  const { isAuth, logout } = useAuth();

  const [modalType, setModalType] = useState(null); // 'login' | 'register' | 'technician' | null
  const [scrolled, setScrolled] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const openLogin = () => setModalType("login");
  const openRegister = () => setModalType("register");
  const openTech = () => setModalType("technician");
  const closeModal = () => setModalType(null);

  // Scroll style
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock page scroll while modal is open
  useEffect(() => {
    const sb = window.innerWidth - document.documentElement.clientWidth; // scrollbar width
    if (modalType) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = sb ? `${sb}px` : "";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [modalType]);

  // ESC to close
  useEffect(() => {
    if (!modalType) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalType]);

  // Listen for global "open login" requests (ServiceCard/MenuLink/RouteGuard)
  useEffect(() => {
    const openLoginFromAnywhere = () => setModalType("login");
    window.addEventListener("fm:open-login", openLoginFromAnywhere);
    return () => window.removeEventListener("fm:open-login", openLoginFromAnywhere);
  }, []);

  // If redirected by ProtectedRoute with state, open the login and clear state
  useEffect(() => {
    if (location.state?.openLogin) {
      setModalType("login");
      // Clear state so refresh/back doesn’t auto-open again
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location, navigate]);

  return (
    <>
      <div className={`navbar-links ${scrolled ? "scrolled" : ""}`}>
        <a href="/" className="navlink" aria-label="FixMate Home">
          <img src="..." alt="FixMate" />
        </a>

        <div className="navbar-menu">
          <MenuLink linkName="StaffDashboard" url="/StaffDashboard" />
          <MenuLink linkName="TechnicianDashboard" url="/TechnicianDashboard" />
          {/* 👇 require auth here */}
          <MenuLink linkName="UserDashboard" url="/UserDashboard" requireAuth />
          <MenuLink linkName="AdminDashboard" url="/AdminDashboard" />
          <MenuLink linkName="Home" url="/" />
          <MenuLink linkName="AboutUs" url="/AboutUs" />
          <MenuLink linkName="Services" url="/Services" />

          <div className="navbar-buttons">
            {!isAuth ? (
              <button className="login-button" onClick={openLogin}>
                Login/Signup
              </button>
            ) : (
              <button className="login-button" onClick={logout}>
                Logout
              </button>
            )}

            <button className="tasker-button" onClick={openTech}>
              Become a Tasker
            </button>
          </div>
        </div>
      </div>

      {modalType && (
        <div
          className="login-modal-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`login-modal ${modalType === "register" ? "wide" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeModal} aria-label="Close">
              &times;
            </button>

            {modalType === "login" ? (
              // Keep the modal open after success so you can see the success message
              <Login onSwitch={openRegister} />
            ) : modalType === "register" ? (
              <UserRegister onSwitch={openLogin} />
            ) : (
              <TechnicianRegister />
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;
