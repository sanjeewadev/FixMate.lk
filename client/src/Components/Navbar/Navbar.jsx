import React, { useEffect, useState } from "react";
import "./navbar.css";
import Login from "../Login/Login.jsx";
import UserRegister from "../UserRegister/UserRegister.jsx";

function Navbar() {
  const [modalType, setModalType] = useState(null);

  const openLogin = () => setModalType("login");
  const openRegister = () => setModalType("register");
  const closeModal = () => setModalType(null);


  return (
    <>
      <div className="navbar-links">
        <a href="/" className="navlink">
          <img src="..." alt="FixMate" />
        </a>

        <div className="navbar-menu">
          <div className="navbar-buttons">
            <button className="login-button" onClick={openLogin}>
              Login/Signup
            </button>

            <button
              className="tasker-button"
              onClick={() => setModalType("")}
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
