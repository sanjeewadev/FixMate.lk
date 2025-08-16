import React from "react";
import "./ServiceCard.css";
import { Link } from "react-router-dom";

const ServiceCard = ({ title, description, image, serviceId, slug }) => {
  // Build the booking URL from either serviceId or slug
  const to = serviceId
    ? `/book?serviceId=${serviceId}`
    : slug
    ? `/book?slug=${slug}`
    : "/book"; // safe fallback

  return (
    <div className="service-card">
      <img src={image} alt={title} className="service-image" />
      <div className="service-content">
        <h3 className="service-title">{title}</h3>
        <p className="service-description">{description}</p>
        <Link className="book-button" to={to}>
          Book Service
        </Link>
      </div>
    </div>
  );
};

export default ServiceCard;
