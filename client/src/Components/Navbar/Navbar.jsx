import React, { useEffect, useState } from "react";
import MenuLink from "../MenuLink/MenuLink.jsx";
import "./navbar.css";
import Login from "../Login/Login.jsx";
import UserRegister from "../UserRegister/UserRegister.jsx";
import TechnicianRegister from "../TechnicianRegister/TechnicianRegister.jsx";

function Navbar() {
  const [modalType, setModalType] = useState(null);
  const [scrolled, setScrolled] = useState(false);

  const openLogin = () => setModalType("login");
  const openRegister = () => setModalType("register");
  const closeModal = () => setModalType(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock page scroll while modal is open
  useEffect(() => {
    const sb = window.innerWidth - document.documentElement.clientWidth;
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

  // Close on ESC
  useEffect(() => {
    if (!modalType) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalType]);

  return (
    <>
      <div className={`navbar-links ${scrolled ? "scrolled" : ""}`}>
        <a href="/" className="navlink">
          <img src="..." alt="FixMate" />
        </a>

        <div className="navbar-menu">
          <MenuLink linkName="StaffDashboard" url="/StaffDashboard" />
          <MenuLink linkName="TechnicianDashboard" url="/TechnicianDashboard" />
          <MenuLink linkName="UserDashboard" url="/UserDashboard" />
          <MenuLink linkName="AdminDashboard" url="/AdminDashboard" />
          <MenuLink linkName="Home" url="/" />
          <MenuLink linkName="AboutUs" url="/AboutUs" />
          <MenuLink linkName="Services" url="/Services" />
          <div className="navbar-buttons">
            <button className="login-button" onClick={openLogin}>
              Login/Signup
            </button>
            <button
              className="tasker-button"
              onClick={() => setModalType("technician")}
            >
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
          {/* make the register modal a bit wider */}
          <div
            className={`login-modal ${modalType === "register" ? "wide" : ""}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="close-btn" onClick={closeModal} aria-label="Close">
              &times;
            </button>

            {modalType === "login" ? (
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
