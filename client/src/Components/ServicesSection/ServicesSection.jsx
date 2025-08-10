import React from 'react';
import { Link } from 'react-router-dom';
import './ServicesSection.css';

const services = [
  { title: "Electrical Maintenance", image: "/assets/electrical.jpg" },
  { title: "Plumbing", image: "/assets/plumbing.jpg" },
  { title: "Fire Alarm Systems", image: "/assets/fire-alarm.jpg" },
  { title: "CCTV Installation", image: "/assets/cctv.jpg" },
  { title: "Paint & Drywall Repairs", image: "/assets/paint.jpg" },
  { title: "Roofing Repairs", image: "/assets/roof1.jpg" },
  { title: "Roofing Repairs", image: "/assets/roof2.jpg" },
  { title: "Green Cleaning", image: "/assets/cleaning.jpg" },
];

const ServicesSection = () => {
  return (
    <div className="services-section-wrapper">
      <h2 className="services-section-title">Our Services</h2>
      <div className="services-section-grid">
        {services.map((service, index) => (
          <div className="services-section-card" key={index}>
            <img src={service.image} alt={service.title} />
            <p>{service.title}</p>
          </div>
        ))}
      </div>
      <div className="services-section-link">
        <Link to="/services">View All Service &gt;&gt;</Link>
      </div>
    </div>
  );
};

export default ServicesSection;
