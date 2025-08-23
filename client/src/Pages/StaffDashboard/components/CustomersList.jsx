import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import "./CustomersList.css";

const FALLBACK_100 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="36">👤</text></svg>';

export default function CustomersList({ title = "👤 Customers", onSelect }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true); setErr("");
        const { data } = await api.get("/api/technician/customers/public");
        if (!ignore) setItems(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!ignore) {
          setErr(e?.response?.data?.message || "Failed to load customers");
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
    return items.filter(c =>
      (c.full_name || c.name_initials || "").toLowerCase().includes(s) ||
      (c.email || "").toLowerCase().includes(s) ||
      (c.phone_number || "").toLowerCase().includes(s) ||
      (c.district || "").toLowerCase().includes(s)
    );
  }, [items, q]);

  return (
    <div className="cust">
      <div className="cust-head">
        <h3>{title}</h3>
        <div className="cust-actions">
          <input
            className="cust-search"
            type="text"
            placeholder="Search name, email, phone, district…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
          <button className="cust-btn" onClick={() => setQ("")} disabled={!q}>Clear</button>
        </div>
      </div>

      {loading && <div className="cust-msg">Loading customers…</div>}
      {err && !loading && <div className="cust-msg cust-msg--error">{err}</div>}

      {!loading && !err && (
        <div className="cust-grid">
          {filtered.length === 0 ? (
            <div className="cust-empty">No customers found.</div>
          ) : filtered.map(c => (
            <article
              key={c._id}
              className="cust-card"
              onClick={() => onSelect?.(c)}
              role={onSelect ? "button" : undefined}
              tabIndex={onSelect ? 0 : undefined}
            >
              <img
                className="cust-avatar"
                src={c.profile_image_url || FALLBACK_100}
                alt={c.full_name || c.name_initials || "Customer"}
                onError={(e) => (e.currentTarget.src = FALLBACK_100)}
              />
              <h4 className="cust-name">{c.full_name || c.name_initials}</h4>
              {c.email && <p><b>Email:</b> {c.email}</p>}
              {c.phone_number && <p><b>Phone:</b> {c.phone_number}</p>}
              {c.address && <p><b>Address:</b> {c.address}</p>}
              <p><b>District:</b> {c.district || "—"}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
