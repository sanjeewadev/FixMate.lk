import React from 'react';
import Navbar from "../../Components/Navbar/Navbar.jsx";
import './AboutUs.css';
import TeamCards from "../../Components/TeamCards/TeamCards.jsx";
import PhotoGallery from '../../Components/PhotoGallery/PhotoGallery.jsx';

function AboutUs() {
  return (
    <div>
      <Navbar />
      <div className="about-container" style={{ marginTop: '100px' }}>
        <h1>About Fixmate</h1>
        <p>
          Fixmate is a leading provider of home services, connecting homeowners with skilled
          professionals for a wide range of tasks. Our mission is to simplify home maintenance and
          repairs, ensuring quality service and customer satisfaction. We envision a future where
          finding reliable help for home projects is effortless and stress-free.
        </p>

        <h1>Our Story</h1>
        <p>
          Founded in 2018, Fixmate began with a simple idea: to make home services more accessible
          and trustworthy. We recognized the challenges homeowners faced in finding qualified
          technicians and set out to create a solution. Today, we've grown into a trusted platform,
          serving thousands of customers with a network of vetted professionals.
        </p>

        <h1>Our Values</h1>
        <p>
          At Fixmate, we are committed to excellence, integrity, and customer focus. We believe in
          transparency, reliability, and continuous improvement. Our goal is to build lasting
          relationships with our customers and technicians, fostering a community of trust and
          mutual respect.
        </p>

        
      </div>
      <div>
        <h2>Meet the Team</h2>
        <TeamCards />
      </div>
      <div className='about-container'>
        <h1>Our Commitment</h1>
        <p>We are dedicated to providing exceptional service and support. 
          Our team works tirelessly to ensure every customer has a positive 
          experience, from booking to completion. We stand behind our work 
          and are always here to help.</p>
      </div>
      <div>
         <h2 >Gallery</h2>
         <PhotoGallery />
      </div>
    </div>
  );
}

export default AboutUs;
