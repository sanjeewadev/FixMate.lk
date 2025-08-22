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

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [modalType, setModalType] = useState(null);

  const { isAuth, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const panelRef = useRef(null);
  const menuWrapRef = useRef(null);

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

  useEffect(() => {
    const onDoc = (e) => {
      if (!menuWrapRef.current) return;
      if (!menuWrapRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const onOpen = () => setModalType("login");
    window.addEventListener("fm:open-login", onOpen);
    return () => window.removeEventListener("fm:open-login", onOpen);
  }, []);

  useEffect(() => {
    if (location.state?.openLogin) {
      setModalType("login");
      navigate(location.pathname + location.search, { replace: true });
    }
  }, [location, navigate]);

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

  useEffect(() => {
    if (!modalType) return;
    const onKey = (e) => e.key === "Escape" && setModalType(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalType]);

  const closeMenus = () => { setOpen(false); setMenuOpen(false); };
  const openLogin = () => setModalType("login");
  const openRegister = () => setModalType("register");
  const openTech = () => setModalType("technician");
  const closeModal = () => setModalType(null);
  const doLogout = () => { logout(); closeMenus(); };

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
      <header className={`publicNav fontBody ${scrolled ? "isSticky" : "isTop"} ${leaving ? "isLeaving" : ""}`}>
        <div className="navInner">
          <div className="brand" onClick={() => { navigate("/"); closeMenus(); }}>
            <span className="brandDot" />
            <span className="brandName">FixMate.lk</span>
          </div>

          <button
            className="navBurger"
            aria-label="Open menu"
            aria-expanded={open}
            onClick={() => setOpen(v => !v)}
          >
            <span />
            <span />
            <span />
          </button>

          <nav className={`navLinks ${open ? "open" : ""}`}>
            <NavLink to="/" end className="navLink" onClick={closeMenus}>Home</NavLink>
            <NavLink to="/AboutUs" className="navLink" onClick={closeMenus}>About</NavLink>
            <NavLink to="/Contact" className="navLink" onClick={closeMenus}>Contact</NavLink>
            <NavLink to="/FAQ" className="navLink" onClick={closeMenus}>FAQ</NavLink>

            <NavLink
              to={isAuth ? "/UserDashboard" : "#"}
              className="navLink"
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

            <div
              ref={menuWrapRef}
              className="navLinkMenu"
              onMouseEnter={openMega}
              onMouseLeave={scheduleCloseMega}
            >
              <button
                className="serviceMenuBtn"
                aria-haspopup="true"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(v => !v)}
              >
                Services <span className="chev">▾</span>
              </button>

              <div
                ref={panelRef}
                className={`megaPanel ${menuOpen ? "show" : ""}`}
                role="menu"
                aria-label="Services"
                onMouseEnter={cancelClose}
                onMouseLeave={scheduleCloseMega}
              >
                <div className="megaTag">POPULAR SERVICES</div>
                <div className="megaGrid">
                  <section className="megaSection">
                    <div className="megaTitle">Electrical & Plumbing</div>

                    <NavLink className="megaRow" to="/Services?cat=electrical" onClick={closeMenus}>
                      <span className="megaIcon i-1" />
                      <div className="megaText">
                        <strong>Electrical Services</strong>
                        <small>Wiring, lighting, power upgrades & fault fixing</small>
                      </div>
                    </NavLink>

                    <NavLink className="megaRow" to="/Services?cat=plumbing" onClick={closeMenus}>
                      <span className="megaIcon i-2" />
                      <div className="megaText">
                        <strong>Plumbing Services</strong>
                        <small>Repairs, fittings, lines, leaks, kitchen & bath</small>
                      </div>
                    </NavLink>

                    <NavLink className="megaRow" to="/Services?cat=ac-repair" onClick={closeMenus}>
                      <span className="megaIcon i-3" />
                      <div className="megaText">
                        <strong>AC Maintenance & Repair</strong>
                        <small>Servicing, cleaning, gas refilling & repairs</small>
                      </div>
                    </NavLink>
                  </section>

                  <section className="megaSection">
                    <div className="megaTitle">Security & Low-Voltage</div>

                    <NavLink className="megaRow" to="/Services?cat=cctv" onClick={closeMenus}>
                      <span className="megaIcon i-4" />
                      <div className="megaText">
                        <strong>CCTV Installation</strong>
                        <small>Cameras, DVR/NVR setup & maintenance</small>
                      </div>
                    </NavLink>

                    <NavLink className="megaRow" to="/Services?cat=fire-alarm" onClick={closeMenus}>
                      <span className="megaIcon i-5" />
                      <div className="megaText">
                        <strong>Fire Alarm Systems</strong>
                        <small>Install, inspect, maintain & commission</small>
                      </div>
                    </NavLink>

                    <NavLink className="megaRow" to="/Services?cat=networking" onClick={closeMenus}>
                      <span className="megaIcon i-6" />
                      <div className="megaText">
                        <strong>Networking Solutions</strong>
                        <small>Cabling, Wi-Fi, secure LAN/WAN</small>
                      </div>
                    </NavLink>

                    <NavLink className="megaRow" to="/Services?cat=low-voltage" onClick={closeMenus}>
                      <span className="megaIcon i-1" />
                      <div className="megaText">
                        <strong>Low Voltage Maintenance</strong>
                        <small>Intercoms, access control, data cabling</small>
                      </div>
                    </NavLink>
                  </section>

                  <section className="megaSection">
                    <div className="megaTitle">Carpentry & Finishes</div>

                    <NavLink className="megaRow" to="/Services?cat=carpentry" onClick={closeMenus}>
                      <span className="megaIcon i-2" />
                      <div className="megaText">
                        <strong>Carpentry Services</strong>
                        <small>Repairs, custom woodwork, doors & cabinetry</small>
                      </div>
                    </NavLink>

                    <NavLink className="megaRow" to="/Services?cat=painting" onClick={closeMenus}>
                      <span className="megaIcon i-3" />
                      <div className="megaText">
                        <strong>Painting Services</strong>
                        <small>Interior, exterior & decorative finishes</small>
                      </div>
                    </NavLink>

                    <NavLink className="megaRow" to="/Services?cat=aluminium" onClick={closeMenus}>
                      <span className="megaIcon i-4" />
                      <div className="megaText">
                        <strong>Aluminium Works</strong>
                        <small>Doors, windows, partitions & custom</small>
                      </div>
                    </NavLink>

                    <NavLink className="megaRow" to="/Services?cat=upvc" onClick={closeMenus}>
                      <span className="megaIcon i-5" />
                      <div className="megaText">
                        <strong>uPVC Works</strong>
                        <small>Modern, durable windows & doors</small>
                      </div>
                    </NavLink>
                  </section>

                  <div className="megaFoot">
                    <NavLink to="/Services" className="megaCta" onClick={closeMenus}>
                      Explore all services
                    </NavLink>
                    <NavLink to="/AboutUs#contact" className="megaLink" onClick={closeMenus}>
                      Need help? Contact us →
                    </NavLink>
                  </div>
                </div>
              </div>

              {menuOpen && (
                <div
                  className="megaHoverPad"
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleCloseMega}
                />
              )}
            </div>
          </nav>

          <div className="navActions">
            {!isAuth ? (
              <button className="navBtn outline" onClick={openLogin}>Login</button>
            ) : (
              <button className="navBtn outline" onClick={doLogout}>Logout</button>
            )}
          </div>
        </div>
      </header>

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
