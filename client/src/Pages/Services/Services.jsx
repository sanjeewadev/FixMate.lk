import React, { useEffect, useState } from "react";
import Navbar from "../../Components/Navbar/Navbar.jsx";
import ServiceCard from "../../Components/ServiceCard/ServiceCard.jsx";
import Loader from "../../Components/Loaders/SLoader.jsx"; // Import Loader
import "./Services.css";
import Footer from "../../Components/Footer/Footer.jsx";

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const startTime = Date.now();

    const fetchServices = async () => {
      try {
        const res = await fetch("http://localhost:7001/api/services?page=1&limit=10");
        if (!res.ok) throw new Error("Failed to fetch services");
        const data = await res.json();
        setServices(data.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        const elapsed = Date.now() - startTime;
        const delay = Math.max(2500 - elapsed, 0); // Ensure 3 sec min
        setTimeout(() => setLoading(false), delay);
      }
    };

    fetchServices();
  }, []);

  return (
    <div className="services-page">
      <Navbar />
      <div className="services-wrapper">
        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "4rem" }}>
            <Loader />
          </div>
        ) : (
          <>
            <div className="services-header">
              <h2 className="services-title">Our Services</h2>
              <p className="services-subtitle">
                Explore our comprehensive range of home maintenance and repair services.
                From electrical work to plumbing, we've got you covered.
              </p>
            </div>

            {error && <p className="services-error">{error}</p>}
              <div className={`services-container ${services.length <= 3 ? "few-items" : ""}`}>
                {services.map((service) => (
                  <ServiceCard
                    key={service.slug || service._id}
                    id={service._id}
                    slug={service.slug}
                    title={service.name}
                    description={service.description}
                    image={service.serviceImages?.[0]?.url || "/assets/default.jpg"}
                  />
                ))}
              </div>
          </>
        )}
      </div>
      <Footer variant="light" />
    </div>
  );
};

export default Services;