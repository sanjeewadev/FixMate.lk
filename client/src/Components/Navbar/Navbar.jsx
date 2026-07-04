import React, { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import useScrollGate from "../../hooks/useScrollGate.js";
import { useAuth } from "../../context/AuthContext.jsx";

import Login from "../Login/Login.jsx";
import UserRegister from "../UserRegister/UserRegister.jsx";

import { navbarConfig, publicNavLinks } from "./NavBar.js";

import "./Navbar.css";

export default function Navbar() {
  const scrolled = useScrollGate(
    navbarConfig.scrollTarget,
    navbarConfig.scrollRatio,
    navbarConfig.fallbackScrollPx,
  );

  const [open, setOpen] = useState(false);
  const [modalType, setModalType] = useState(null);
  const [leaving, setLeaving] = useState(false);

  const prevScrolled = useRef(scrolled);

  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let timer;

    if (prevScrolled.current && !scrolled) {
      setLeaving(true);
      timer = setTimeout(() => {
        setLeaving(false);
      }, navbarConfig.leavingAnimationMs);
    }

    prevScrolled.current = scrolled;

    return () => {
      clearTimeout(timer);
    };
  }, [scrolled]);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onOpen = () => {
      setModalType("login");
    };

    window.addEventListener("fm:open-login", onOpen);

    return () => {
      window.removeEventListener("fm:open-login", onOpen);
    };
  }, []);

  useEffect(() => {
    if (location.state?.openLogin) {
      setModalType("login");
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location, navigate]);

  useEffect(() => {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;

    if (modalType) {
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = scrollbarWidth
        ? `${scrollbarWidth}px`
        : "";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [modalType]);

  useEffect(() => {
    if (!modalType && !open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setModalType(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [modalType, open]);

  const closeMenus = () => {
    setOpen(false);
  };

  const openLogin = () => {
    closeMenus();
    setModalType("login");
  };

  const openRegister = () => {
    closeMenus();
    setModalType("register");
  };

  const closeModal = () => {
    setModalType(null);
  };

  const doLogout = () => {
    if (typeof logout === "function") {
      logout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    closeMenus();
    navigate("/", { replace: true });
  };

  return (
    <>
      <header
        className={`publicNav ${scrolled ? "isSticky" : "isTop"} ${
          leaving ? "isLeaving" : ""
        }`}>
        <div className="navInner">
          <button
            type="button"
            className="brand"
            onClick={() => {
              navigate("/");
              closeMenus();
            }}
            aria-label="Go to FixMate home page">
            <span className="brandDot" aria-hidden="true" />
            <span className="brandName">{navbarConfig.brandName}</span>
          </button>

          <button
            type="button"
            className="navBurger"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}>
            <span />
            <span />
            <span />
          </button>

          <nav
            className={`navLinks ${open ? "open" : ""}`}
            aria-label="Main navigation">
            {publicNavLinks.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="navLink"
                  onClick={closeMenus}>
                  {item.label}
                </a>
              ) : (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className="navLink"
                  onClick={closeMenus}>
                  {item.label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="navActions">
            {!isAuth ? (
              <button
                type="button"
                className="navBtn outline"
                onClick={openLogin}>
                Login
              </button>
            ) : (
              <button
                type="button"
                className="navBtn outline"
                onClick={doLogout}>
                Logout
              </button>
            )}
          </div>
        </div>
      </header>

      {modalType ? (
        <div
          className="fm-auth-modal-overlay"
          onClick={closeModal}
          role="dialog"
          aria-modal="true"
          aria-label={modalType === "login" ? "Login" : "Create account"}>
          <div
            className={`fm-auth-modal ${
              modalType === "register" ? "fm-auth-modal--register" : ""
            }`}
            onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="fm-auth-modal__close"
              onClick={closeModal}
              aria-label="Close">
              &times;
            </button>

            {modalType === "login" ? (
              <Login onSwitch={openRegister} onSuccess={closeModal} />
            ) : (
              <UserRegister onSwitch={openLogin} />
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
