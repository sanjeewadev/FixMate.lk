import React from "react";
import Navbar from "../../Components/Navbar/Navbar.jsx"; // ✅ Import Navbar
import ServiceCard from "../../Components/ServiceCard/ServiceCard.jsx";
import "./Services.css";

const Services = () => {
  return (
    <div>
      <Navbar /> 

      <div className="services-wrapper">
        <h2 className="services-title">Our Services</h2>
        <p>Explore our comprehensive range of home maintenance and repair 
          services, designed to keep your home in top condition. 
          From electrical work to plumbing, we've got you covered.</p>
        <div className="services-container">
          <ServiceCard
            title="Electrical Repair"
            description="Expert troubleshooting and wiring repair services."
            image="/assets/electrician.jpg"
          />
          <ServiceCard
            title="Bike Maintenance"
            description="Full-service bike inspection and repair."
            image="/assets/bike.jpg"
          />
          <ServiceCard
            title="Plumbing"
            description="Leak fixing, pipe fitting and installations."
            image="/assets/plumbing.jpg"
          />
          <ServiceCard
            title="Roof Repairs"
            description="Quality roofing repair and inspection services."
            image="/assets/roof.jpg"
          />
          <ServiceCard
            title="Cleaning"
            description="Home and office cleaning by professionals."
            image="/assets/cleaning.jpg"
          />
        </div>
      </div>
    </div>
  );
};

export default Services;
