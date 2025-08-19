// src/Components/Footer/Footer.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import "./footer.css";

import footerfb from "../../assets/footer-facebook.svg";
import footerinsta from "../../assets/footer-instagram.svg";
import footerx from "../../assets/footer-twitter.svg";
import footeryt from "../../assets/footer-youtube.svg";

export default function Footer({ variant = "dark" }) {
  const cls = `site-footer ${variant === "light" ? "is-light" : "is-dark"}`;

  return (
    <footer className={cls}>
      <div className="foot__inner">
        <nav className="foot__grid" aria-label="Footer">
          <section className="foot__col">
            <h4 className="foot__head">The Good</h4>
            <NavLink to="/" className="foot__link">Home</NavLink>
            <NavLink to="/AboutUs" className="foot__link">About</NavLink>
            <NavLink to="/Services" className="foot__link">Services</NavLink>
            <a className="foot__link" href="/#contact">Contact Us</a>
          </section>

          <section className="foot__col">
            <h4 className="foot__head">The Boring</h4>
            <a className="foot__link" href="/terms">Terms</a>
            <a className="foot__link" href="/privacy">Privacy</a>
            <a className="foot__link" href="/refunds">Refunds & Policies</a>
          </section>

          <section className="foot__col">
            <h4 className="foot__head">The Cool</h4>
            <a className="foot__link foot__social" href="https://x.com" target="_blank" rel="noreferrer">
              <img src={footerx} alt="" aria-hidden /> <span>X</span>
            </a>
            <a className="foot__link foot__social" href="https://instagram.com" target="_blank" rel="noreferrer">
              <img src={footerinsta} alt="" aria-hidden /> <span>Instagram</span>
            </a>
            <a className="foot__link foot__social" href="https://facebook.com" target="_blank" rel="noreferrer">
              <img src={footerfb} alt="" aria-hidden /> <span>Facebook</span>
            </a>
            <a className="foot__link foot__social" href="https://youtube.com" target="_blank" rel="noreferrer">
              <img src={footeryt} alt="" aria-hidden /> <span>YouTube</span>
            </a>
          </section>
        </nav>

        <div className="foot__bar">
          <p>© 2025 FixMate.lk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
