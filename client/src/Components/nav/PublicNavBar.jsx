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

  // animate when leaving sticky state (fade out nicely)
  const [leaving, setLeaving] = useState(false);
  const prevScrolled = useRef(scrolled);

  useEffect(() => {
    let timer;
    if (prevScrolled.current && !scrolled) {
      // transitioned sticky -> top
      setLeaving(true);
      timer = setTimeout(() => setLeaving(false), 260); // match CSS navExit duration
    }
    prevScrolled.current = scrolled;
    return () => clearTimeout(timer);
  }, [scrolled]);

  // close mega on outside click
  useEffect(() => {
    const onDoc = (e) => {
      if (!panelRef.current) return;
      if (!panelRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Global event so other parts of the app can open login (same API you used)
  useEffect(() => {
    const onOpen = () => setModalType("login");
    window.addEventListener("fm:open-login", onOpen);
    return () => window.removeEventListener("fm:open-login", onOpen);
  }, []);

  // If a ProtectedRoute redirected with { state: { openLogin: true } }
  useEffect(() => {
    if (location.state?.openLogin) {
      setModalType("login");
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location, navigate]);

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

  // ESC to close modal
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

  // --- robust hover for mega: small delayed close so micro-gaps don't snap shut
  const hoverTimer = useRef(null);
  const openMega = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    setMenuOpen(true);
  };
  const scheduleCloseMega = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setMenuOpen(false), 140);
  };
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

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

            {/* Services trigger + mega */}
            <div
              className="navlink navlink--menu"
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
              >
                <div className="mega__tag">SERVICES</div>

                <div className="mega__grid">
                  {/* STRATEGY */}
                  <section className="mega__section">
                    <div className="mega__title">Strategy</div>

                    <NavLink className="mega__row" to="/Services?cat=discovery" onClick={closeMenus}>
                      <span className="mega__icon i-1" />
                      <div className="mega__text">
                        <strong>Product Discovery</strong>
                        <small>Research & product architecture</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=poc" onClick={closeMenus}>
                      <span className="mega__icon i-2" />
                      <div className="mega__text">
                        <strong>Proof of Concept</strong>
                        <small>Validate your idea & viability</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=ux-audit" onClick={closeMenus}>
                      <span className="mega__icon i-3" />
                      <div className="mega__text">
                        <strong>UX Audit</strong>
                        <small>Make your product competitive</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=ui-concept" onClick={closeMenus}>
                      <span className="mega__icon i-4" />
                      <div className="mega__text">
                        <strong>UI Concept</strong>
                        <small>Define the unique style & visual</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=pitch-deck" onClick={closeMenus}>
                      <span className="mega__icon i-5" />
                      <div className="mega__text">
                        <strong>Pitch Deck</strong>
                        <small>Winning investor presentation</small>
                      </div>
                    </NavLink>
                  </section>

                  {/* DESIGN */}
                  <section className="mega__section">
                    <div className="mega__title">Design</div>

                    <NavLink className="mega__row" to="/Services?cat=ui-ux" onClick={closeMenus}>
                      <span className="mega__icon i-2" />
                      <div className="mega__text">
                        <strong>UI/UX Design</strong>
                        <small>Web & Mobile App Design</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=website-design" onClick={closeMenus}>
                      <span className="mega__icon i-3" />
                      <div className="mega__text">
                        <strong>Website Design</strong>
                        <small>Custom websites, landing pages</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=mobile-design" onClick={closeMenus}>
                      <span className="mega__icon i-4" />
                      <div className="mega__text">
                        <strong>Mobile Design</strong>
                        <small>User-friendly applications</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=brand-identity" onClick={closeMenus}>
                      <span className="mega__icon i-5" />
                      <div className="mega__text">
                        <strong>Brand Identity</strong>
                        <small>Logo, typography, color</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=graphic-design" onClick={closeMenus}>
                      <span className="mega__icon i-6" />
                      <div className="mega__text">
                        <strong>Graphic Design</strong>
                        <small>Illustrations, icons, social media</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=website-redesign" onClick={closeMenus}>
                      <span className="mega__icon i-1" />
                      <div className="mega__text">
                        <strong>Website Redesign</strong>
                        <small>Better engagement, modern UI</small>
                      </div>
                    </NavLink>
                  </section>

                  {/* DEVELOPMENT */}
                  <section className="mega__section">
                    <div className="mega__title">Development</div>

                    <NavLink className="mega__row" to="/Services?cat=webflow-dev" onClick={closeMenus}>
                      <span className="mega__icon i-4" />
                      <div className="mega__text">
                        <strong>Webflow Development</strong>
                        <small>Site builder solutions</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=landing-page" onClick={closeMenus}>
                      <span className="mega__icon i-5" />
                      <div className="mega__text">
                        <strong>Landing Page</strong>
                        <small>High-converting websites</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=web-dev" onClick={closeMenus}>
                      <span className="mega__icon i-6" />
                      <div className="mega__text">
                        <strong>Web Development</strong>
                        <small>Front-end & Back-end</small>
                      </div>
                    </NavLink>

                    <NavLink className="mega__row" to="/Services?cat=mobile-dev" onClick={closeMenus}>
                      <span className="mega__icon i-2" />
                      <div className="mega__text">
                        <strong>Mobile Development</strong>
                        <small>iOS, Android, Cross-platform</small>
                      </div>
                    </NavLink>
                  </section>

                  {/* Footer row */}
                  <div className="mega__foot">
                    <NavLink
                      to="/Services"
                      className="mega__cta"
                      onClick={closeMenus}
                    >
                      Explore all services
                    </NavLink>
                    <NavLink
                      to="/AboutUs#contact"
                      className="mega__link"
                      onClick={closeMenus}
                    >
                      Need help? Contact us →
                    </NavLink>
                  </div>
                </div>
              </div>
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
