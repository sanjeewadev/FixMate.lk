import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import "./TechniciansList.css";

const FALLBACK_100 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="36">👤</text></svg>';

export default function TechniciansList({ title = "👨‍🔧 Technicians", onSelect }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true); setErr("");
        const { data } = await api.get("/api/technician/technicians");
        if (!ignore) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) {
          setErr(e?.response?.data?.message || "Failed to load technicians");
          setItems([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(t =>
      (t.full_name || "").toLowerCase().includes(s) ||
      (t.email || "").toLowerCase().includes(s) ||
      (t.district || "").toLowerCase().includes(s) ||
      String(t.specialization || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <div className="techs">
      <div className="techs-head">
        <h3>{title}</h3>
        <div className="techs-actions">
          <input
            className="techs-search"
            type="text"
            placeholder="Search name, email, district…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="techs-btn" onClick={() => setQ("")} disabled={!q}>Clear</button>
        </div>
      </div>

      {loading && <div className="techs-msg">Loading technicians…</div>}
      {err && !loading && <div className="techs-msg techs-msg--error">{err}</div>}

      {!loading && !err && (
        <div className="techs-grid">
          {filtered.length === 0 ? (
            <div className="techs-empty">No technicians found.</div>
          ) : filtered.map(t => (
            <article
              key={t._id}
              className="tech-card"
              onClick={() => onSelect?.(t)}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
            >
              <img
                className="tech-avatar"
                src={t.profile_image_url || FALLBACK_100}
                alt={t.full_name}
                onError={(e) => (e.currentTarget.src = FALLBACK_100)}
              />
              <h4 className="tech-name">{t.full_name}</h4>
              <p><b>Email:</b> {t.email || "—"}</p>
              <p><b>Phone:</b> {t.phone_number || "—"}</p>
              <p><b>District:</b> {t.district || "—"}</p>
              <p><b>Specialization:</b> {t.specialization || "N/A"}</p>
              <p><b>Experience:</b> {t.experience_years ?? 0} yrs</p>
              {t.rating ? <p><b>Rating:</b> ⭐ {t.rating}</p> : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
