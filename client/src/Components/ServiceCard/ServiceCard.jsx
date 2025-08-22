// src/Components/ServiceCard/ServiceCard.jsx
import React from "react";
import "./ServiceCard.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

const ServiceCard = ({ id, slug, title, description, image }) => {
  const { isAuth } = useAuth();
  const navigate = useNavigate();

  const handleBook = (e) => {
    e.preventDefault();
    const to = slug ? `/book?slug=${slug}` : `/book?serviceId=${id}`;

    if (isAuth) {
      navigate(to);
    } else {
      window.dispatchEvent(new Event("fm:open-login"));
    }
  };

  return (
    <div className="service-card">
      <img src={image} alt={title} className="service-image" />
      <div className="service-content">
        <h3 className="service-title">{title}</h3>
        <p className="service-description">{description}</p>
        <button className="book-button" onClick={handleBook}>
          Book Service
        </button>
      </div>
    </div>
  );
};

export default ServiceCard;
