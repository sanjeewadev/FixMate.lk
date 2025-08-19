import React from "react";
import "./Home.css";
import PublicNavBar from "../../Components/nav/PublicNavBar.jsx";
import Hero from "../../Components/Herosection/Herosection";
import Navbar from "../../Components/Navbar/Navbar";
import BodyContent from "../../Components/BodyContent/BodyContent";
import ServicesSection from "../../Components/ServicesSection/ServicesSection";
import ContactUs from "../../Components/ContactUs/ContactUs";
import AboutSection from "../../Components/AboutSection/AboutSection";
import Footer from "../../Components/Footer/Footer.jsx";

function Home() {
  return (
    <div className="homePage">
      <PublicNavBar />
      <Hero />
      <ServicesSection />
      <AboutSection />
      <ContactUs />
      <Footer variant="dark" />
    </div>
  );
}

export default Home;