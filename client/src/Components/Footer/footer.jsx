import React from "react";
import { Link, NavLink } from "react-router-dom";

import {
  footerBrand,
  footerLinks,
  footerServiceBox,
  footerSocials,
} from "./Footer.js";

import "./footer.css";

export default function Footer({ variant = "dark" }) {
  const openLogin = () => {
    window.dispatchEvent(new Event("fm:open-login"));
  };

  const renderLink = (item) => {
    if (item.action === "login") {
      return (
        <button
          key={item.label}
          type="button"
          className="fm-footer__link fm-footer__linkButton"
          onClick={openLogin}>
          {item.label}
        </button>
      );
    }

    if (item.to) {
      return (
        <NavLink key={item.label} to={item.to} className="fm-footer__link">
          {item.label}
        </NavLink>
      );
    }

    return (
      <a key={item.label} href={item.href} className="fm-footer__link">
        {item.label}
      </a>
    );
  };

  return (
    <footer
      className={`fm-footer ${
        variant === "light" ? "fm-footer--light" : "fm-footer--dark"
      }`}>
      <div className="fm-footer__container">
        <div className="fm-footer__main">
          <section
            className="fm-footer__brandBlock"
            aria-label="FixMate summary">
            <Link to="/" className="fm-footer__brand">
              <span className="fm-footer__brandDot" aria-hidden="true" />
              <span>{footerBrand.name}</span>
            </Link>

            <p>{footerBrand.description}</p>

            <div className="fm-footer__contactLine">
              <a href={`mailto:${footerBrand.email}`}>{footerBrand.email}</a>
              <span aria-hidden="true">•</span>
              <a href={footerBrand.phoneHref}>{footerBrand.phone}</a>
            </div>
          </section>

          <nav className="fm-footer__nav" aria-label="Footer navigation">
            {footerLinks.map((group) => (
              <section className="fm-footer__column" key={group.title}>
                <h3>{group.title}</h3>

                <div className="fm-footer__links">
                  {group.items.map(renderLink)}
                </div>
              </section>
            ))}
          </nav>

          <section className="fm-footer__serviceBox">
            <span className="fm-footer__label">{footerServiceBox.eyebrow}</span>

            <h3>{footerServiceBox.title}</h3>

            <p>{footerServiceBox.text}</p>

            <div className="fm-footer__actions">
              <Link
                to={footerServiceBox.primaryTo}
                className="fm-footer__primary">
                {footerServiceBox.primaryLabel}
              </Link>

              <a
                href={footerServiceBox.secondaryHref}
                className="fm-footer__secondary">
                {footerServiceBox.secondaryLabel}
              </a>
            </div>
          </section>
        </div>

        <div className="fm-footer__bottom">
          <p>{footerBrand.copyright}</p>

          <div className="fm-footer__socials" aria-label="FixMate social links">
            {footerSocials.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                aria-label={item.label}>
                <img src={item.icon} alt="" aria-hidden="true" />
              </a>
            ))}
          </div>

          <button
            type="button"
            className="fm-footer__backTop"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            Back to top
            <span aria-hidden="true">↑</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
