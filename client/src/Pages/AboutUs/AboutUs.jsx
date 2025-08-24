import React from "react";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import "./AboutUs.css";
import TeamCards from "../../Components/TeamCards/TeamCards.jsx";
import Footer from "../../Components/Footer/Footer.jsx";
import PublicNavBar from "../../Components/nav/PublicNavBar.jsx";

export default function AboutUs() {
  return (
    <div className="about-page">
      <PublicNavBar />

      {/* Top spacer to clear fixed navbar */}
      <div className="nav-spacer" aria-hidden="true" />

      {/* Hero */}
      <header className="about-hero">
        <div className="container">
          <h1 className="about-title">About Fixmate</h1>
          <p className="about-sub">
            Fixmate is a leading provider of home services, connecting homeowners with skilled
            professionals for a wide range of tasks. Our mission is to simplify home maintenance and
            repairs, ensuring quality service and customer satisfaction. We envision a future where
            finding reliable help for home projects is effortless and stress-free.
          </p>
        </div>
      </header>

      {/* Content grid */}
      <main className="container about-grid">
        <section className="about-card">
          <h2>Our Story</h2>
          <p>
            Founded in 2018, Fixmate began with a simple idea: to make home services more
            accessible and trustworthy. We recognized the challenges homeowners faced in finding
            qualified technicians and set out to create a solution. Today, we've grown into a
            trusted platform, serving thousands of customers with a network of vetted professionals.
          </p>
        </section>

        <section className="about-card">
          <h2>Our Values</h2>
          <p>
            At Fixmate, we are committed to excellence, integrity, and customer focus. We believe in
            transparency, reliability, and continuous improvement. Our goal is to build lasting
            relationships with our customers and technicians, fostering a community of trust and
            mutual respect.
          </p>
        </section>
      </main>

      {/* Team */}
      <section className="container team-wrap">
        <TeamCards />
      </section>

      {/* Commitment / CTA band */}
      <section className="about-cta">
        <div className="container about-cta-inner">
          <h2>Our Commitment</h2>
          <p>
            We are dedicated to providing exceptional service and support. Our team works tirelessly
            to ensure every customer has a positive experience, from booking to completion. We stand
            behind our work and are always here to help.
          </p>
        </div>
      </section>

      <Footer variant="dark" />
    </div>
  );
}