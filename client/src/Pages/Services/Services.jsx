import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import ServiceCard from "../../Components/ServiceCard/ServiceCard.jsx";
import "./Services.css";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await fetch("http://localhost:7001/api/services?page=1&limit=10"); // adjust port if needed
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        setServices(data.data || []); // backend sends {data: items, pagination: ...}
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  return (
    <div>
      <Navbar />

      <div className="services-wrapper">
        <h2 className="services-title">Our Services</h2>
        <p>
          Explore our comprehensive range of home maintenance and repair services.
          From electrical work to plumbing, we've got you covered.
        </p>

        {loading && <p>Loading services...</p>}
        {error && <p className="error">{error}</p>}

        <div className="services-container">
          {services.map((service) => (
            <ServiceCard
              key={service.slug}
              title={service.name}
              description={service.description}
              image={service.serviceImages?.[0]?.url || "/assets/default.jpg"}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Services;