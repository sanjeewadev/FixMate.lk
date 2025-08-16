import React from 'react'
import './Home.css';
import Hero from '../../Components/Herosection/Herosection';
import Navbar from '../../Components/Navbar/Navbar';
import BodyContent from '../../Components/BodyContent/BodyContent';
import ServicesSection from '../../Components/ServicesSection/ServicesSection';
import ContactUs from '../../Components/ContactUs/ContactUs';
import AboutSection from '../../Components/AboutSection/AboutSection';

function Home() {
  return (
    <div>
    <Navbar />
    <Hero />
    <ServicesSection />
    <AboutSection />
    <ContactUs />
    </div>
  )
}

export default Home