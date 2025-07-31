import React, { useEffect, useState } from "react";
import MenuLink from "../MenuLink/MenuLink.jsx";
import "./navbar.css";
import Login from "../Login/Login.jsx";
import UserRegister from "../UserRegister/UserRegister.jsx";
import TechnicianRegister from "../TechnicianRegister/TechnicianRegister.jsx";

function Navbar() {
  const [modalType, setModalType] = useState(null);

  // const [authentication, setauthentication] = useState(false);

  const openLogin = () => setModalType("login");
  const openRegister = () => setModalType("register");
  const closeModal = () => setModalType(null);

  // useEffect(() => {
  //   //inside
  //   if (localStorage.getItem("auth")) {
  //     setauthentication(true);
  //   }
  // }, []);

  return (
    <>
      <div className="navbar-links">
        <a href="/" className="navlink">
          <img src="..." alt="FixMate" />
        </a>

        <div className="navbar-menu">
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
        <div className="login-modal-overlay" onClick={closeModal}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>
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
