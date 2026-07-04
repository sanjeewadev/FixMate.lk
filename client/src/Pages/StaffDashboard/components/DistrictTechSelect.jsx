import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, RefreshCw, RotateCcw, UserRound } from "lucide-react";

import api from "../../../lib/api";
import "./DistrictTechSelect.css";

const SL_DISTRICTS = [
  "Colombo",
  "Gampaha",
  "Kalutara",
  "Kandy",
  "Matale",
  "Nuwara Eliya",
  "Galle",
  "Matara",
  "Hambantota",
  "Jaffna",
  "Kilinochchi",
  "Mannar",
  "Vavuniya",
  "Mullaitivu",
  "Batticaloa",
  "Ampara",
  "Trincomalee",
  "Kurunegala",
  "Puttalam",
  "Anuradhapura",
  "Polonnaruwa",
  "Badulla",
  "Monaragala",
  "Ratnapura",
  "Kegalle",
];

const norm = (value) => String(value || "").trim();

const getSpecializationLabels = (specialization) => {
  const list = Array.isArray(specialization) ? specialization : [];

  return list
    .map((item) =>
      typeof item === "object"
        ? item.name || item.code || item.category || item.slug
        : String(item),
    )
    .filter(Boolean);
};

export default function DistrictTechSelect({ booking, value, onChange }) {
  const bookingDistrict = norm(
    booking?.customerSnapshot?.district || booking?.district || "",
  );

  const [district, setDistrict] = useState(bookingDistrict || "");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);

  const prevBookingId = useRef(null);

  useEffect(() => {
    const id = booking?._id || null;

    if (id && prevBookingId.current !== id) {
      setDistrict(bookingDistrict || "");
      onChange?.("");
      prevBookingId.current = id;
    }
  }, [booking?._id, bookingDistrict, onChange]);

  const districts = useMemo(() => {
    const set = new Set(SL_DISTRICTS.map(norm));

    if (bookingDistrict && !set.has(bookingDistrict)) {
      set.add(bookingDistrict);
    }

    return Array.from(set);
  }, [bookingDistrict]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      if (!district) {
        setItems([]);
        return;
      }

      setLoading(true);

      try {
        const { data } = await api.get("/api/coordinator/technicians", {
          params: {
            district,
            page: 1,
            limit: 200,
          },
        });

        if (!ignore) {
          setItems(data?.items || []);
        }
      } catch (error) {
        console.warn(
          "[DistrictTechSelect] fetch failed",
          error?.response?.status,
          error?.response?.data,
        );

        if (!ignore) {
          setItems([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [district]);

  const options = useMemo(() => {
    return (items || []).map((technician) => {
      const labels = getSpecializationLabels(technician.specialization);

      return {
        id: technician._id,
        label: `${technician.full_name}${
          labels.length ? ` — ${labels.slice(0, 3).join(", ")}` : ""
        }`,
      };
    });
  }, [items]);

  const resetAll = () => {
    if (district) {
      setDistrict("");
    }

    if (value) {
      onChange?.("");
    }

    setItems([]);
  };

  return (
    <section className="fm-staff-dts">
      <div className="fm-staff-dts__header">
        <div className="fm-staff-dts__title">
          <span>
            <UserRound size={16} />
          </span>

          <div>
            <strong>Assign Technician</strong>
            <p>Filter available technicians by customer district.</p>
          </div>
        </div>

        <div className="fm-staff-dts__right">
          <span className="fm-staff-dts__badge" aria-live="polite">
            {district
              ? loading
                ? "Loading"
                : `${options.length} tech${options.length === 1 ? "" : "s"}`
              : "No district"}
          </span>

          <button
            type="button"
            className="fm-staff-dts__btn fm-staff-dts__btn--outline"
            onClick={resetAll}>
            <RotateCcw size={14} />
            Reset
          </button>
        </div>
      </div>

      <div className="fm-staff-dts__row">
        <div className="fm-staff-dts__field">
          <label htmlFor="fm-staff-dts-district">District</label>

          <div className="fm-staff-dts__selectWrap">
            <MapPin size={16} />

            <select
              id="fm-staff-dts-district"
              value={district}
              onChange={(event) => {
                setDistrict(norm(event.target.value));
                onChange?.("");
              }}
              aria-label="Select district">
              <option value="">Select a district</option>

              {districts.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <p>
            {bookingDistrict
              ? "Auto-selected from customer's address."
              : "Pick the customer's district."}
          </p>
        </div>

        <div className="fm-staff-dts__field">
          <label htmlFor="fm-staff-dts-technician">Technician</label>

          <div className="fm-staff-dts__selectWrap">
            {loading ? <RefreshCw size={16} /> : <UserRound size={16} />}

            <select
              id="fm-staff-dts-technician"
              value={value || ""}
              onChange={(event) => onChange?.(event.target.value)}
              disabled={!district || loading || options.length === 0}
              aria-label="Select technician">
              {!district ? (
                <option value="">Pick a district first</option>
              ) : null}

              {district && loading ? (
                <option value="">Loading technicians</option>
              ) : null}

              {district && !loading && options.length === 0 ? (
                <option value="">No technicians found in {district}</option>
              ) : null}

              {options.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <p>Filtered by district. Specializations are shown for context.</p>
        </div>
      </div>
    </section>
  );
}
