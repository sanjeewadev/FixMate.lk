import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import "./Herosection.css";

export default function Herosection() {
  const { isAuth } = useAuth();

  const handleBookClick = (e) => {
    if (!isAuth) {
      e.preventDefault();
      window.dispatchEvent(new Event("fm:open-login"));
    }
  };

  return (
    <section id="hero" className="hero">
      <div className="hero__inner">
        <div className="hero__eyebrow">
          On-demand maintenance for
          <span className="chip">Homes</span>
          <span className="chip">Offices</span>
          <span className="chip">Apartments</span>
        </div>

        <h1 className="hero__title">
          Your reliable <span className="hl">Maintenance&nbsp;Partner</span>
          <br />
          that provides experienced <span className="underline">Technicians</span>
        </h1>

        <p className="hero__sub">
          Book vetted electricians, plumbers, AC and repair experts-fast, fair and
          guaranteed. Available across Colombo & suburbs.
        </p>

        <div className="hero__cta">
          <NavLink
            to="/book"
            className="cta cta--primary"
            onClick={handleBookClick}
            aria-label="Book a technician"
          >
            <span className="cta__arrow" aria-hidden>↘</span>
            Book a technician
          </NavLink>

          <NavLink to="/Services" className="cta cta--ghost">
            Explore services
          </NavLink>
        </div>

        <div className="hero__meta">
          <span className="pill">24/7 Support</span>
          <span className="pill">Background-checked</span>
          <span className="pill">Same-day visits</span>
        </div>
      </div>

      <aside className="hero__note">
        Subscribe to a monthly plan and get a dedicated technician on call-like an
        in-house pro, without the overhead.
      </aside>
    </section>
  );
}
