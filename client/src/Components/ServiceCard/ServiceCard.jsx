import React from "react";
import "./ServiceCard.css";

const ServiceCard = ({ title, description, image }) => {
  return (
    <div className="service-card">
      <img src={image} alt={title} className="service-image" />
      <div className="service-content">
        <h3 className="service-title">{title}</h3>
        <p className="service-description">{description}</p>
        <button className="book-button">Book Service</button>
      </div>
    </div>
  );
};

export default ServiceCard;
