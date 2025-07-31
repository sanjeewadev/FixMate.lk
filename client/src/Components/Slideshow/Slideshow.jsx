import React, { useState, useEffect } from "react";
import "./Slideshow.css";

import img1 from "../../assets/Slideshowimages/img1.jpg";
import img2 from "../../assets/Slideshowimages/img2.jpg";
import img3 from "../../assets/Slideshowimages/img3.jpg";

const images = [img1, img2, img3];

function Slideshow() {
  const [current, setCurrent] = useState(0);
  const [showFlash, setShowFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      triggerNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [current]);

  const triggerNext = () => {
    setShowFlash(true);
    setTimeout(() => {
      setCurrent((prev) => (prev + 1) % images.length);
      setShowFlash(false);
    }, 400);
  };

  const goToSlide = (index) => {
    setShowFlash(true);
    setTimeout(() => {
      setCurrent(index);
      setShowFlash(false);
    }, 200);
  };

  return (
    <div className="slideshow-container">
      <img
        src={images[current]}
        alt="Slide"
        className="slide-image fade-in"
        key={current}
      />

      <div className="dots-container">
        {images.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === current ? "active" : ""}`}
            onClick={() => goToSlide(index)}
          ></span>
        ))}
      </div>
    </div>
  );
}

export default Slideshow;
