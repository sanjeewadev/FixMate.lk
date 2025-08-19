import React, { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import useScrollGate from "../../hooks/useScrollGate";
import { useAuth } from "../../context/AuthContext.jsx";

import Login from "../Login/Login.jsx";
import UserRegister from "../UserRegister/UserRegister.jsx";
import TechnicianRegister from "../TechnicianRegister/TechnicianRegister.jsx";

import "./nav.css";

export default function PublicNavBar() {
  const scrolled = useScrollGate("#hero", 0.6, 96);

  // mobile menu + services mega
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // auth modal
  const [modalType, setModalType] = useState(null); // 'login' | 'register' | 'technician' | null

  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const panelRef = useRef(null);
  const menuWrapRef = useRef(null);   // ⬅️ wraps trigger + panel + hover pad

  // animate when leaving sticky state (fade out nicely)
  const [leaving, setLeaving] = useState(false);
  const prevScrolled = useRef(scrolled);

  useEffect(() => {
    let timer;
    if (prevScrolled.current && !scrolled) {
      setLeaving(true);
      timer = setTimeout(() => setLeaving(false), 260);
    }
    prevScrolled.current = scrolled;
    return () => clearTimeout(timer);
  }, [scrolled]);

  // close mega on outside click (now checks the WHOLE wrapper)
  useEffect(() => {
    const onDoc = (e) => {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // open-login global hook
  useEffect(() => {
    const onOpen = () => setModalType("login");
    window.addEventListener("fm:open-login", onOpen);
    return () => window.removeEventListener("fm:open-login", onOpen);
  }, []);

  // ProtectedRoute -> open login modal
  useEffect(() => {
    if (location.state?.openLogin) {
      setModalType("login");
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location, navigate]);

  // Lock page scroll while modal open
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

  // ESC closes modal
  useEffect(() => {
    if (!modalType) return;
    const onKey = (e) => e.key === "Escape" && setModalType(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalType]);

  const closeMenus   = () => { setOpen(false); setMenuOpen(false); };
  const openLogin    = () => setModalType("login");
  const openRegister = () => setModalType("register");
  const openTech     = () => setModalType("technician");
  const closeModal   = () => setModalType(null);
  const doLogout     = () => { logout(); closeMenus(); };

  // --- robust hover for mega (with a small delayed close)
  const hoverTimer = useRef(null);
  const cancelClose = () => { if (hoverTimer.current) clearTimeout(hoverTimer.current); };
  const openMega = () => { cancelClose(); setMenuOpen(true); };
  const scheduleCloseMega = () => {
    cancelClose();
    hoverTimer.current = setTimeout(() => setMenuOpen(false), 140);
  };
  useEffect(() => () => cancelClose(), []);

  return (
    <>
      <header className={`pubnav ${scrolled ? "is-sticky" : "is-top"} ${leaving ? "is-leaving" : ""}`}>
        <div className="pubnav__inner">
          <div className="pubnav__brand" onClick={() => { navigate("/"); closeMenus(); }}>
            <span className="brand-dot" />
            <span className="brand-name">FixMate.lk</span>
          </div>

          <button
            className="pubnav__burger"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`pubnav__links ${open ? "open" : ""}`}>
            <NavLink to="/" end className="navlink" onClick={closeMenus}>Home</NavLink>
            <NavLink to="/AboutUs" className="navlink" onClick={closeMenus}>About</NavLink>
            <NavLink to="/Contact" className="navlink" onClick={closeMenus}>Contact</NavLink>
            <NavLink to="/FAQ" className="navlink" onClick={closeMenus}>FAQ</NavLink>

            <NavLink
              to={isAuth ? "/UserDashboard" : "#"}
              className="navlink"
              onClick={(e) => {
                if (!isAuth) {
                  e.preventDefault();
                  closeMenus();
                  setModalType("login");
                } else {
                  closeMenus();
                }
              }}
            >
              Dashboard
            </NavLink>

            {/* Services trigger + mega + HOVER PAD */}
            <div
              ref={menuWrapRef}
              className="navlink--menu"
              onMouseEnter={openMega}
              onMouseLeave={scheduleCloseMega}
            >
              <button
                className="service-btn-nav-dropdown"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(v => !v)}
              >
                Services <span className="chev">▾</span>
              </button>

              <div
                ref={panelRef}
                className={`mega ${menuOpen ? "show" : ""}`}
                role="menu"
                aria-label="Services"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleCloseMega}
              >
                <div className="mega__tag">POPULAR SERVICES</div>
                <div className="mega__grid">
                  {/* ELECTRICAL + PLUMBING */}
                  <section className="mega__section">
                    <div className="mega__title">Electrical & Plumbing</div>

                    <NavLink className="mega__row" to="/Services?cat=electrical" onClick={closeMenus}>
                      <span className="mega__icon i-1" />
                      <div className="mega__text">
                        <strong>Electrical Services</strong>
                        <small>Wiring, lighting, power upgrades & fault fixing</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=plumbing" onClick={closeMenus}>
                      <span className="mega__icon i-2" />
                      <div className="mega__text">
                        <strong>Plumbing Services</strong>
                        <small>Repairs, fittings, lines, leaks, kitchen & bath</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=ac-repair" onClick={closeMenus}>
                      <span className="mega__icon i-3" />
                      <div className="mega__text">
                        <strong>AC Maintenance & Repair</strong>
                        <small>Servicing, cleaning, gas refilling & repairs</small>
                      </div>
                    </NavLink>
                  </section>

                  {/* SECURITY + LOW VOLTAGE */}
                  <section className="mega__section">
                    <div className="mega__title">Security & Low-Voltage</div>

                    <NavLink className="mega__row" to="/Services?cat=cctv" onClick={closeMenus}>
                      <span className="mega__icon i-4" />
                      <div className="mega__text">
                        <strong>CCTV Installation</strong>
                        <small>Cameras, DVR/NVR setup & maintenance</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=fire-alarm" onClick={closeMenus}>
                      <span className="mega__icon i-5" />
                      <div className="mega__text">
                        <strong>Fire Alarm Systems</strong>
                        <small>Install, inspect, maintain & commission</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=networking" onClick={closeMenus}>
                      <span className="mega__icon i-6" />
                      <div className="mega__text">
                        <strong>Networking Solutions</strong>
                        <small>Cabling, Wi-Fi, secure LAN/WAN</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=low-voltage" onClick={closeMenus}>
                      <span className="mega__icon i-1" />
                      <div className="mega__text">
                        <strong>Low Voltage Maintenance</strong>
                        <small>Intercoms, access control, data cabling</small>
                      </div>
                    </NavLink>
                  </section>

                  {/* CARPENTRY + FINISHES */}
                  <section className="mega__section">
                    <div className="mega__title">Carpentry & Finishes</div>

                    <NavLink className="mega__row" to="/Services?cat=carpentry" onClick={closeMenus}>
                      <span className="mega__icon i-2" />
                      <div className="mega__text">
                        <strong>Carpentry Services</strong>
                        <small>Repairs, custom woodwork, doors & cabinetry</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=painting" onClick={closeMenus}>
                      <span className="mega__icon i-3" />
                      <div className="mega__text">
                        <strong>Painting Services</strong>
                        <small>Interior, exterior & decorative finishes</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=aluminium" onClick={closeMenus}>
                      <span className="mega__icon i-4" />
                      <div className="mega__text">
                        <strong>Aluminium Works</strong>
                        <small>Doors, windows, partitions & custom</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=upvc" onClick={closeMenus}>
                      <span className="mega__icon i-5" />
                      <div className="mega__text">
                        <strong>uPVC Works</strong>
                        <small>Modern, durable windows & doors</small>
                      </div>
                    </NavLink>
                  </section>

                  {/* Footer row */}
                  <div className="mega__foot">
                    <NavLink to="/Services" className="mega__cta" onClick={closeMenus}>
                      Explore all services
                    </NavLink>
                    <NavLink to="/AboutUs#contact" className="mega__link" onClick={closeMenus}>
                      Need help? Contact us →
                    </NavLink>
                  </div>
                </div>

              </div>
              {/* ⬇️ Invisible “bridge” area that keeps menu open */}
              {menuOpen && (
                <div
                  className="mega-hoverpad"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleCloseMega}
                />
              )}
            </div>
          </nav>

          <div className="pubnav__actions">
            {!isAuth ? (
              <button className="btn outline" onClick={openLogin}>Login</button>
            ) : (
              <button className="btn outline" onClick={doLogout}>Logout</button>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      {modalType && (
        <div className="login-modal-overlay" onClick={closeModal} role="dialog" aria-modal="true">
          <div className={`login-modal ${modalType === "register" ? "wide" : ""}`} onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal} aria-label="Close">&times;</button>

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
