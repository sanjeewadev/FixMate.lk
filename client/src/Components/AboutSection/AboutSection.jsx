import React from "react";
import "./AboutSection.css";
import { useNavigate } from "react-router-dom";

const AboutSection = () => {
  const navigate = useNavigate();

  const handleExploreMore = () => {
    navigate("/aboutus");
  };

  return (
    <div className="fixmate-about-wrapper">
      <h2 className="fixmate-about-heading">About FixMate</h2>
      <div className="fixmate-about-container">
        <div className="fixmate-about-image">
          {/* <img src={AboutImage} alt="About illustration" /> */}
        </div>
        <div className="fixmate-about-text">
          <h3>How to design your site footer like we did</h3>
          <p>
            Donec a eros justo. Fusce egestas tristique ultrices. Nam tempor, augue nec tincidunt molestie,
            massa nunc varius arcu, at scelerisque elit erat a magna. Donec quis erat at libero ultrices
            mollis. In hac habitasse platea dictumst. Vivamus vehicula leo dui, at porta nisi facilisis finibus.
            In euismod augue vitae nisi ultricies, non aliquet urna tincidunt. Integer in nisi eget nulla
            commodo faucibus efficitur quis massa. Praesent felis est, finibus et nisi ac, hendrerit venenatis
            libero. Donec consectetur faucibus ipsum id gravida.
          </p>
          <button className="fixmate-about-btn" onClick={handleExploreMore}>
            Explore More
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutSection;
