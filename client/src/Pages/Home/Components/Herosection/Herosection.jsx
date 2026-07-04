import React from "react";
import { NavLink } from "react-router-dom";

import { useAuth } from "../../../../context/AuthContext.jsx";

import {
  heroAudienceChips,
  heroBookingPreview,
  heroContent,
  heroTrustItems,
} from "./HeroSection.js";

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
    <section id="hero" className="fm-hero" aria-labelledby="fm-hero-title">
      <div className="fm-hero__container">
        <div className="fm-hero__content">
          <div className="fm-hero__eyebrow">
            <span className="fm-hero__eyebrowText">{heroContent.eyebrow}</span>

            {heroAudienceChips.map((chip) => (
              <span className="fm-hero__serviceChip" key={chip}>
                {chip}
              </span>
            ))}
          </div>

          <h1 id="fm-hero-title" className="fm-hero__title">
            {heroContent.titleStart}{" "}
            <span className="fm-hero__highlight">{heroContent.highlight}</span>{" "}
            {heroContent.titleEnd}
          </h1>

          <p className="fm-hero__subtitle">{heroContent.subtitle}</p>

          <div className="fm-hero__actions">
            <NavLink
              to={heroContent.primaryAction.to}
              className="fm-hero__button fm-hero__button--primary"
              onClick={handleBookClick}
              aria-label={heroContent.primaryAction.label}>
              {heroContent.primaryAction.label}
            </NavLink>

            <NavLink
              to={heroContent.secondaryAction.to}
              className="fm-hero__button fm-hero__button--secondary">
              {heroContent.secondaryAction.label}
            </NavLink>
          </div>

          <div className="fm-hero__trustList" aria-label="FixMate benefits">
            {heroTrustItems.map((item) => (
              <span className="fm-hero__trustItem" key={item}>
                {item}
              </span>
            ))}
          </div>
        </div>

        <aside
          className="fm-hero__bookingCard"
          aria-label="Quick booking preview">
          <div className="fm-hero__bookingHeader">
            <div>
              <p className="fm-hero__bookingLabel">
                {heroBookingPreview.label}
              </p>

              <h2 className="fm-hero__bookingTitle">
                {heroBookingPreview.title}
              </h2>
            </div>

            <span className="fm-hero__statusBadge">
              {heroBookingPreview.status}
            </span>
          </div>

          <div className="fm-hero__bookingBody">
            {heroBookingPreview.rows.map((row) => (
              <div className="fm-hero__bookingRow" key={row.key}>
                <span className="fm-hero__bookingKey">{row.key}</span>
                <strong className="fm-hero__bookingValue">{row.value}</strong>
              </div>
            ))}
          </div>

          <div className="fm-hero__ratingBox">
            <div>
              <span className="fm-hero__ratingLabel">
                {heroBookingPreview.rating.label}
              </span>

              <strong className="fm-hero__ratingValue">
                {heroBookingPreview.rating.value}
              </strong>
            </div>

            <span className="fm-hero__ratingDot" aria-hidden="true" />
          </div>

          <div className="fm-hero__bookingFooter">
            <span>{heroBookingPreview.footerText}</span>

            <NavLink
              to={heroBookingPreview.footerLink.to}
              className="fm-hero__miniLink">
              {heroBookingPreview.footerLink.label}
            </NavLink>
          </div>
        </aside>
      </div>
    </section>
  );
}
