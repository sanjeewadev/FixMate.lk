import React from "react";
import { NavLink } from "react-router-dom";
import "./footer.css";

import footerfb from "../../assets/footer-facebook.svg";
import footerinsta from "../../assets/footer-instagram.svg";
import footerx from "../../assets/footer-twitter.svg";
import footeryt from "../../assets/footer-youtube.svg";

export default function Footer({ variant = "dark" }) {
  const cls = `siteFooter ${variant === "light" ? "isLight" : "isDark"} fontBody`;

  return (
    <footer className={cls}>
      <div className="footerInner">
        <nav className="footerGrid" aria-label="Footer">
          <section className="footerCol">
            <h4 className="footerHead fontHeading">The Good</h4>
            <NavLink to="/" className="footerLink">Home</NavLink>
            <NavLink to="/AboutUs" className="footerLink">About</NavLink>
            <NavLink to="/Services" className="footerLink">Services</NavLink>
            <a className="footerLink" href="/#contact">Contact Us</a>
          </section>

          <section className="footerCol">
            <h4 className="footerHead fontHeading">The Boring</h4>
            <a className="footerLink" href="/terms">Terms</a>
            <a className="footerLink" href="/privacy">Privacy</a>
            <a className="footerLink" href="/refunds">Refunds & Policies</a>
          </section>

          <section className="footerCol">
            <h4 className="footerHead fontHeading">The Cool</h4>
            <a className="footerLink footerSocial" href="https://x.com" target="_blank" rel="noreferrer">
              <img src={footerx} alt="" aria-hidden />
              <span>X</span>
            </a>
            <a className="footerLink footerSocial" href="https://instagram.com" target="_blank" rel="noreferrer">
              <img src={footerinsta} alt="" aria-hidden />
              <span>Instagram</span>
            </a>
            <a className="footerLink footerSocial" href="https://facebook.com" target="_blank" rel="noreferrer">
              <img src={footerfb} alt="" aria-hidden />
              <span>Facebook</span>
            </a>
            <a className="footerLink footerSocial" href="https://youtube.com" target="_blank" rel="noreferrer">
              <img src={footeryt} alt="" aria-hidden />
              <span>YouTube</span>
            </a>
          </section>
        </nav>

        <div className="footerBar">
          <p>© 2025 FixMate.lk. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}