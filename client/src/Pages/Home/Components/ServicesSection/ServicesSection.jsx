import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { useAuth } from "../../../../context/AuthContext.jsx";

import {
  buildCategoryOptions,
  filterServicesForSection,
  getServiceBookingPath,
  getServiceCategoryName,
  getServiceDescription,
  getServiceImage,
  loadServicesForSection,
  SERVICES_SECTION_FALLBACK_IMAGE,
  servicesSectionContent,
} from "./ServicesSection.js";

import "./ServicesSection.css";

export default function ServicesSection() {
  const { isAuth } = useAuth();

  const [services, setServices] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);

        const list = await loadServicesForSection();

        if (!cancelled) {
          setServices(list);
        }
      } catch {
        if (!cancelled) {
          setError("Services could not be loaded right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadServices();

    return () => {
      cancelled = true;
    };
  }, []);

  const categoryOptions = useMemo(() => {
    return buildCategoryOptions(services);
  }, [services]);

  const previewServices = useMemo(() => {
    return filterServicesForSection(services, activeCategory);
  }, [services, activeCategory]);

  const handleBookClick = (e) => {
    if (!isAuth) {
      e.preventDefault();
      window.dispatchEvent(new Event("fm:open-login"));
    }
  };

  const handleImageError = (e) => {
    if (e.currentTarget.src.includes(SERVICES_SECTION_FALLBACK_IMAGE)) return;
    e.currentTarget.src = SERVICES_SECTION_FALLBACK_IMAGE;
  };

  return (
    <section
      className="fm-services-showcase"
      aria-labelledby="fm-services-showcase-title">
      <div className="fm-services-showcase__container">
        <div className="fm-services-showcase__header">
          <div className="fm-services-showcase__headerText">
            <span className="fm-services-showcase__eyebrow">
              {servicesSectionContent.eyebrow}
            </span>

            <h2
              id="fm-services-showcase-title"
              className="fm-services-showcase__title">
              {servicesSectionContent.title}
            </h2>

            <p className="fm-services-showcase__subtitle">
              {servicesSectionContent.subtitle}
            </p>
          </div>

          <div className="fm-services-showcase__promiseCard">
            <span>{servicesSectionContent.promise.eyebrow}</span>

            <strong>{servicesSectionContent.promise.title}</strong>

            <p>{servicesSectionContent.promise.text}</p>
          </div>
        </div>

        <div className="fm-services-showcase__toolbar">
          <div
            className="fm-services-showcase__chips"
            aria-label="Service categories">
            {categoryOptions.map((category) => (
              <button
                key={category.value}
                type="button"
                className={`fm-services-showcase__chip ${
                  activeCategory === category.value
                    ? "fm-services-showcase__chip--active"
                    : ""
                }`}
                onClick={() => setActiveCategory(category.value)}>
                {category.label}
              </button>
            ))}
          </div>

          <Link to="/Services" className="fm-services-showcase__viewAll">
            View all services
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        {loading ? (
          <div
            className="fm-services-showcase__grid"
            aria-label="Loading services">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="fm-services-showcase__skeletonCard" key={index}>
                <div className="fm-services-showcase__skeletonImage" />
                <div className="fm-services-showcase__skeletonLine" />
                <div className="fm-services-showcase__skeletonLine fm-services-showcase__skeletonLine--short" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="fm-services-showcase__state fm-services-showcase__state--error">
            <strong>Unable to load services.</strong>
            <span>{error}</span>
          </div>
        ) : previewServices.length === 0 ? (
          <div className="fm-services-showcase__state">
            <strong>No services found.</strong>
            <span>Try another category or open the full services page.</span>
            <Link to="/Services">Open Services</Link>
          </div>
        ) : (
          <div className="fm-services-showcase__grid">
            {previewServices.map((service, index) => (
              <article
                className={`fm-services-showcase__card ${
                  index === 0 ? "fm-services-showcase__card--featured" : ""
                }`}
                key={service._id || service.slug || service.name}>
                <div className="fm-services-showcase__imageWrap">
                  <img
                    src={getServiceImage(service)}
                    alt={service.name || "FixMate service"}
                    loading="lazy"
                    onError={handleImageError}
                  />

                  <div className="fm-services-showcase__imageShade" />

                  <span className="fm-services-showcase__category">
                    {getServiceCategoryName(service)}
                  </span>

                  {index === 0 ? (
                    <span className="fm-services-showcase__featuredBadge">
                      Featured
                    </span>
                  ) : null}
                </div>

                <div className="fm-services-showcase__body">
                  <h3>{service.name || "FixMate Service"}</h3>

                  <p>{getServiceDescription(service)}</p>

                  <div className="fm-services-showcase__meta">
                    <span>Verified tech</span>
                    <span>Fast request</span>
                  </div>

                  <div className="fm-services-showcase__cardFooter">
                    <NavLink
                      to={getServiceBookingPath(service)}
                      className="fm-services-showcase__bookButton"
                      onClick={handleBookClick}>
                      Book Service
                      <span aria-hidden="true">→</span>
                    </NavLink>

                    <span className="fm-services-showcase__miniText">
                      Trusted support
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="fm-services-showcase__process">
          {servicesSectionContent.process.map((item) => (
            <div className="fm-services-showcase__processItem" key={item.step}>
              <span>{item.step}</span>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </div>
          ))}
        </div>

        <div className="fm-services-showcase__bottomCta">
          <div>
            <span>{servicesSectionContent.cta.eyebrow}</span>
            <h3>{servicesSectionContent.cta.title}</h3>
          </div>

          <div className="fm-services-showcase__bottomActions">
            <a
              href="/#contact"
              className="fm-services-showcase__secondaryButton">
              {servicesSectionContent.cta.contactLabel}
            </a>

            <Link
              to="/Services"
              className="fm-services-showcase__primaryButton">
              {servicesSectionContent.cta.servicesLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
