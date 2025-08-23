import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../lib/api";
import "./DistrictTechSelect.css";

const SL_DISTRICTS = [
  "Colombo","Gampaha","Kalutara","Kandy","Matale","Nuwara Eliya","Galle","Matara","Hambantota",
  "Jaffna","Kilinochchi","Mannar","Vavuniya","Mullaitivu","Batticaloa","Ampara","Trincomalee",
  "Kurunegala","Puttalam","Anuradhapura","Polonnaruwa","Badulla","Monaragala","Ratnapura","Kegalle"
];

const norm = (s) => String(s || "").trim();

export default function DistrictTechSelect({ booking, value, onChange }) {
  const bookingDistrict = norm(booking?.customerSnapshot?.district || booking?.district || "");

  const [district, setDistrict] = useState(bookingDistrict || "");
  const [loading, setLoading]   = useState(false);
  const [items, setItems]       = useState([]);

  // 🔒 guard so we only reset when booking actually changes
  const prevBookingId = useRef(null);

  useEffect(() => {
    const id = booking?._id || null;
    if (id && prevBookingId.current !== id) {
      // booking changed → reset once
      setDistrict(bookingDistrict || "");
      onChange?.("");
      prevBookingId.current = id;
    }
    // if no booking id (defensive), do nothing
  }, [booking?._id, bookingDistrict, onChange]);

  const districts = useMemo(() => {
    const set = new Set(SL_DISTRICTS.map(norm));
    if (bookingDistrict && !set.has(bookingDistrict)) set.add(bookingDistrict);
    return Array.from(set);
  }, [bookingDistrict]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!district) { setItems([]); return; }
      setLoading(true);
      try {
        const { data } = await api.get("/api/coordinator/technicians", {
          params: { district, page: 1, limit: 200 }
        });
        if (!ignore) setItems(data?.items || []);
      } catch (e) {
        console.warn("[DistrictTechSelect] fetch failed", e?.response?.status, e?.response?.data);
        if (!ignore) setItems([]);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => { ignore = true; };
  }, [district]);

  const options = useMemo(() => {
    return (items || []).map(t => {
      const specs = Array.isArray(t.specialization) ? t.specialization : [];
      const labels = specs.map(s =>
        typeof s === "object" ? (s.name || s.code || s.category || s.slug) : String(s)
      ).filter(Boolean);
      return {
        id: t._id,
        label: `${t.full_name}${labels.length ? " — " + labels.slice(0, 3).join(", ") : ""}`,
      };
    });
  }, [items]);

  const resetAll = () => {
    if (district) setDistrict("");
    if (value) onChange?.("");
    setItems([]);
  };

  return (
    <div className="dts">
      <div className="dts-header">
        <div className="dts-title">Assign Technician</div>
        <div className="dts-right">
          <span className="dts-badge" aria-live="polite">
            {district ? (loading ? "Loading…" : `${options.length} tech${options.length === 1 ? "" : "s"}`) : "—"}
          </span>
          <button type="button" className="dts-btn dts-btn--danger dts-btn--sm" onClick={resetAll}>
            Reset
          </button>
        </div>
      </div>

      <div className="dts-row">
        <div className="dts-field">
          <label className="dts-label">District</label>
          <select
            className="dts-select"
            value={district}
            onChange={(e) => { setDistrict(norm(e.target.value)); onChange?.(""); }}
            aria-label="Select district"
          >
            <option value="">Select a district…</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <div className="dts-help">
            {bookingDistrict ? `Auto‑selected from customer's address.` : `Pick the customer's district.`}
          </div>
        </div>

        <div className="dts-field">
          <label className="dts-label">Technician</label>
          <select
            className="dts-select"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            disabled={!district || loading || options.length === 0}
            aria-label="Select technician"
          >
            {!district && <option value="">Pick a district first…</option>}
            {district && loading && <option value="">Loading technicians…</option>}
            {district && !loading && options.length === 0 && (
              <option value="">No technicians found in {district}</option>
            )}
            {options.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
          </select>
          <div className="dts-help">Filtered by district only. Specializations shown for context.</div>
        </div>
      </div>
    </div>
  );
}
