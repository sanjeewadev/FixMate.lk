import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import api from "../../lib/api";
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
    <div className="servicesSection fontBody">
      <h2 className="servicesTitle fontHeading">Our Services</h2>

      {loading ? (
        <div className="servicesGrid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="servicesCard skeleton" key={i} />
          ))}
        </div>
      ) : err ? (
        <p className="servicesError">{err}</p>
      ) : items.length === 0 ? (
        <p className="servicesEmpty">No services available yet.</p>
      ) : (
        <div className="servicesGrid">
          {items.map((s) => (
            <NavLink
              key={s._id || s.slug}
              to={s._id ? `/book?serviceId=${s._id}` : `/book?slug=${encodeURIComponent(s.slug)}`}
              className="servicesCard"
              title={s.name}
            >
              <img
                src={s?.serviceImages?.[0]?.url || "/assets/default.jpg"}
                alt={s.name || "Service"}
                onError={onImgErr}
              />
              <p className="serviceTitle">{s.name}</p>
              {s.category || s.description ? (
                <span className="serviceBlurb">
                  {s.category || String(s.description || "").slice(0, 80)}
                </span>
              ) : null}
            </NavLink>
          ))}
        </div>
      )}

      <div className="servicesLink">
        <Link to="/Services">View All Services &gt;&gt;</Link>
      </div>
    </div>
  );
};

export default ServicesSection;