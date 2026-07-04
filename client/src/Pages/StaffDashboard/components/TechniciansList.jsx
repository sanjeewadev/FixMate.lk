import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  Star,
  UserRound,
  Users,
  Wrench,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./TechniciansList.css";

const FALLBACK_100 =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100%" height="100%" fill="%23e5e7eb"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%236b7280" font-size="34">U</text></svg>';

const normalizeSpecialization = (value) => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object"
          ? item.name || item.code || item.category || item.slug
          : String(item),
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof value === "object" && value) {
    return value.name || value.code || value.category || value.slug || "N/A";
  }

  return String(value || "N/A");
};

const getRatingValue = (technician) => {
  const rating = technician?.rating;

  if (rating === null || rating === undefined || rating === "") return "";

  if (typeof rating === "object") {
    return rating.average || rating.avg || rating.stars || rating.value || "";
  }

  return rating;
};

const getAvatar = (technician) => {
  return (
    technician?.profile_image_url ||
    technician?.profile_image?.url ||
    FALLBACK_100
  );
};

export default function TechniciansList({ title = "Technicians", onSelect }) {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const fetchTechnicians = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const { data } = await api.get("/api/technician/technicians");

      setItems(Array.isArray(data) ? data : []);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to load technicians.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTechnicians();
  }, [fetchTechnicians]);

  const stats = useMemo(() => {
    const districts = new Set(
      items.map((technician) => technician.district).filter(Boolean),
    );

    const withRating = items.filter((technician) =>
      Boolean(getRatingValue(technician)),
    ).length;

    const withPhotos = items.filter(
      (technician) =>
        technician.profile_image_url || technician.profile_image?.url,
    ).length;

    return {
      total: items.length,
      districts: districts.size,
      withRating,
      withPhotos,
    };
  }, [items]);

  const filtered = useMemo(() => {
    const searchText = q.trim().toLowerCase();

    if (!searchText) return items;

    return items.filter((technician) => {
      const specialization = normalizeSpecialization(technician.specialization);

      return [
        technician.full_name,
        technician.email,
        technician.phone_number,
        technician.district,
        specialization,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(searchText));
    });
  }, [items, q]);

  const handleCardKeyDown = (event, technician) => {
    if (!onSelect) return;

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelect(technician);
    }
  };

  return (
    <section className="fm-staff-techs">
      <div className="fm-staff-techs__header">
        <div>
          <span className="fm-staff-techs__eyebrow">Technician Directory</span>

          <h1>{title}</h1>

          <p>
            View technician records, districts, contact details, specialization,
            experience, and available rating information.
          </p>
        </div>

        <button
          type="button"
          className="fm-staff-techs__btn fm-staff-techs__btn--outline"
          onClick={fetchTechnicians}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-staff-techs__summaryGrid">
        <article className="fm-staff-techs__summaryCard">
          <span>
            <Users size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total technicians</p>
          </div>
        </article>

        <article className="fm-staff-techs__summaryCard">
          <span>
            <MapPin size={17} />
          </span>
          <div>
            <strong>{stats.districts}</strong>
            <p>Districts covered</p>
          </div>
        </article>

        <article className="fm-staff-techs__summaryCard">
          <span>
            <Star size={17} />
          </span>
          <div>
            <strong>{stats.withRating}</strong>
            <p>With ratings</p>
          </div>
        </article>

        <article className="fm-staff-techs__summaryCard">
          <span>
            <UserRound size={17} />
          </span>
          <div>
            <strong>{stats.withPhotos}</strong>
            <p>Profile photos</p>
          </div>
        </article>
      </div>

      {err ? (
        <div
          className="fm-staff-techs__notice fm-staff-techs__notice--error"
          role="status"
          aria-live="polite">
          <X size={16} />
          <span>{err}</span>
        </div>
      ) : null}

      <section className="fm-staff-techs__card">
        <div className="fm-staff-techs__toolbar">
          <div>
            <span>Technician records</span>
            <h2>Directory</h2>
          </div>

          <div className="fm-staff-techs__actions">
            <label className="fm-staff-techs__search">
              <Search size={16} />
              <input
                type="search"
                placeholder="Search name, email, district"
                value={q}
                onChange={(event) => setQ(event.target.value)}
              />
            </label>

            <button
              type="button"
              className="fm-staff-techs__btn fm-staff-techs__btn--outline"
              onClick={() => setQ("")}
              disabled={!q}>
              Clear
            </button>
          </div>
        </div>

        {loading ? (
          <div className="fm-staff-techs__empty">
            <RefreshCw size={24} />
            <strong>Loading technicians</strong>
            <span>Please wait while technician records are loaded.</span>
          </div>
        ) : null}

        {!loading && !err ? (
          <div className="fm-staff-techs__grid">
            {filtered.length === 0 ? (
              <div className="fm-staff-techs__empty">
                <Wrench size={24} />
                <strong>No technicians found</strong>
                <span>
                  {q
                    ? "Try a different search keyword."
                    : "Technician records will appear here."}
                </span>
              </div>
            ) : (
              filtered.map((technician) => {
                const rating = getRatingValue(technician);
                const specialization = normalizeSpecialization(
                  technician.specialization,
                );

                return (
                  <article
                    key={technician._id}
                    className={`fm-staff-techs__cardItem ${
                      onSelect ? "isSelectable" : ""
                    }`}
                    onClick={() => onSelect?.(technician)}
                    onKeyDown={(event) => handleCardKeyDown(event, technician)}
                    role={onSelect ? "button" : undefined}
                    tabIndex={onSelect ? 0 : undefined}>
                    <div className="fm-staff-techs__avatarWrap">
                      <img
                        className="fm-staff-techs__avatar"
                        src={getAvatar(technician)}
                        alt={technician.full_name || "Technician"}
                        onError={(event) => {
                          event.currentTarget.src = FALLBACK_100;
                        }}
                      />
                    </div>

                    <div className="fm-staff-techs__body">
                      <h3>{technician.full_name || "Unnamed technician"}</h3>

                      <span className="fm-staff-techs__status">
                        <CheckCircle2 size={13} />
                        Active technician
                      </span>

                      <div className="fm-staff-techs__meta">
                        <div>
                          <Mail size={14} />
                          <span>{technician.email || "—"}</span>
                        </div>

                        <div>
                          <Phone size={14} />
                          <span>{technician.phone_number || "—"}</span>
                        </div>

                        <div>
                          <MapPin size={14} />
                          <span>{technician.district || "—"}</span>
                        </div>

                        <div>
                          <Wrench size={14} />
                          <span>{specialization}</span>
                        </div>

                        <div>
                          <Users size={14} />
                          <span>
                            {technician.experience_years ?? 0} yrs experience
                          </span>
                        </div>

                        {rating ? (
                          <div>
                            <Star size={14} />
                            <span>{rating} rating</span>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        ) : null}
      </section>
    </section>
  );
}
