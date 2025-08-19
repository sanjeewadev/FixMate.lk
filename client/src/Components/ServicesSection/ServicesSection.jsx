// src/Components/ServicesSection/ServicesSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import api from "../../lib/api";              // <-- your axios instance
import "./ServicesSection.css";

const pickRandom = (arr, n = 8) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
};

const ServicesSection = () => {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        // pull a generous page, then sample 8 client-side
        const { data } = await api.get("/api/services?limit=200");
        const list = data?.data || data || [];
        if (!dead) setAll(list);
      } catch {
        if (!dead) setErr("Failed to load services");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  const items = useMemo(() => pickRandom(all, 8), [all]);

  const onImgErr = (e) => { e.currentTarget.src = "/assets/default.jpg"; };

  return (
    <div className="services-section-wrapper">
      <h2 className="services-section-title">Our Services</h2>

      {loading ? (
        <div className="services-section-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="services-section-card skeleton" key={i} />
          ))}
        </div>
      ) : err ? (
        <p className="services-error">{err}</p>
      ) : items.length === 0 ? (
        <p className="services-empty">No services available yet.</p>
      ) : (
        <div className="services-section-grid">
          {items.map((s) => (
            <NavLink
              key={s._id || s.slug}
              // Deep-link to booking (your BookService supports serviceId/slug)
              to={s._id ? `/book?serviceId=${s._id}` : `/book?slug=${encodeURIComponent(s.slug)}`}
              className="services-section-card"
              title={s.name}
            >
              <img
                src={s?.serviceImages?.[0]?.url || "/assets/default.jpg"}
                alt={s.name || "Service"}
                onError={onImgErr}
              />
              <p className="services-card-title">{s.name}</p>
              {s.category || s.description ? (
                <span className="services-card-blurb">
                  {s.category || String(s.description || "").slice(0, 80)}
                </span>
              ) : null}
            </NavLink>
          ))}
        </div>
      )}

      <div className="services-section-link">
        <Link to="/Services">View All Services &gt;&gt;</Link>
      </div>
    </div>
  );
};

export default ServicesSection;
