import React from "react";

import NavBar from "../../Components/NavBar/NavBar.jsx";
import Hero from "./Components/Herosection/Herosection.jsx";
import ServicesSection from "./Components/ServicesSection/ServicesSection.jsx";
import AboutSection from "./Components/AboutSection/AboutSection.jsx";
import ContactUs from "./Components/ContactUs/ContactUs.jsx";
import Footer from "../../Components/Footer/Footer.jsx";

import "./Home.css";

function Home() {
  return (
    <div className="homePage">
      <NavBar />
      <Hero />
      <ServicesSection />
      <AboutSection />
      <ContactUs />
      <Footer variant="dark" />
    </div>
  );
}

export default Home;
