import React, { useState } from "react";
import "./PhotoGallery.css";

const images = [
  "/assets/gallery1.jpg",
  "/assets/gallery2.jpg",
  "/assets/gallery3.jpg",
  "/assets/gallery4.jpg",
  "/assets/gallery5.jpg",
  "/assets/gallery6.jpg",
  "/assets/gallery7.jpg",
  "/assets/gallery8.jpg",
];

const PhotoGallery = () => {
  const [startIndex, setStartIndex] = useState(0);
  const visibleCount = 5;

  const handleNext = () => {
    if (startIndex + visibleCount < images.length) {
      setStartIndex(startIndex + 1);
    }
  };

  const handlePrev = () => {
    if (startIndex > 0) {
      setStartIndex(startIndex - 1);
    }
  };

  const visibleImages = images.slice(startIndex, startIndex + visibleCount);

  return (
    <div className="gallery-wrapper">
      <h2 className="gallery-title">Our Work in Action</h2>

      <div className="gallery-controls">
        <button
          onClick={handlePrev}
          className="gallery-button"
          disabled={startIndex === 0}
        >
          Prev
        </button>

        <div className="gallery-images">
          {visibleImages.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Gallery ${index + 1}`}
              className="gallery-image"
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="gallery-button"
          disabled={startIndex + visibleCount >= images.length}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default PhotoGallery;
