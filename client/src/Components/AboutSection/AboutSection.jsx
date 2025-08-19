import React from "react";
import "./AboutSection.css";
import { useNavigate } from "react-router-dom";
import AboutImage from "../../assets/AboutImage/about-section-image.png";

export default function AboutSection() {
  const navigate = useNavigate();

  return (
    <section className="aboutWrap fontBody" aria-labelledby="about-title">
      <h2 id="about-title" className="aboutHeading fontHeading">About FixMate</h2>

      <div className="aboutCard">
        <div className="aboutMedia">
          <img
            src={AboutImage}
            alt="FixMate technician helping a homeowner"
            loading="lazy"
          />
        </div>

        <div className="aboutBody">
          <h3 className="aboutTitle fontHeading">Home services made easy</h3>
          <p className="aboutText">
            FixMate connects you with verified technicians for everyday repairs and
            bigger projects. Book online, get quick updates, and track everything
            in one place - simple, transparent, and reliable.
          </p>

          <ul className="aboutList">
            <li>Verified & experienced technicians</li>
            <li>Clear pricing and easy scheduling</li>
            <li>Chat and updates in your dashboard</li>
            <li>Full history of jobs & receipts</li>
          </ul>

          <div className="ctaRow">
            <button
              onClick={() => navigate("/AboutUs")}
              className="ctaButton primary"
            >
              Explore More
            </button>
            <button
              onClick={() => navigate("/Services")}
              className="ctaButton ghost"
            >
              Browse Services →
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}