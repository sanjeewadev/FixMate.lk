import React, { useState, useEffect } from "react";
import "./Herosection.css";

import img1 from "../../assets/Slideshowimages/img1.jpg";
import img2 from "../../assets/Slideshowimages/img2.jpg";
import img3 from "../../assets/Slideshowimages/img3.jpg";

const images = [img1, img2, img3];

function Herosection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-container">
      <img
        src={images[current]}
        alt="Hero Slide"
        className="hero-image fade-in"
        key={current}
      />

      {/* Overlay content */}
      <div className="hero-overlay">
        <h1>Welcome to FixMate</h1>
        <p>Reliable home & office maintenance services, just a click away.</p>
        <button onClick={() => window.location.href = "/services"}>
          Explore Services
        </button>
      </div>

      {/* Dots navigation */}
      <div className="hero-dots">
        {images.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === current ? "active" : ""}`}
            onClick={() => setCurrent(index)}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default Herosection;
