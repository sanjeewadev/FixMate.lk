import React, { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  MessageSquareText,
  RefreshCw,
  Search,
  Star,
  UserRound,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./Ratings.css";

function Stars({ value = 0, showNumber = true }) {
  const numberValue = Math.max(0, Math.min(5, Number(value) || 0));
  const fullStars = Math.round(numberValue);

  return (
    <span
      className="fm-admin-ratings__stars"
      aria-label={`${numberValue} out of 5`}>
      {[0, 1, 2, 3, 4].map((index) => (
        <span
          key={index}
          className={`fm-admin-ratings__star ${index < fullStars ? "isFull" : ""}`}>
          ★
        </span>
      ))}

      {showNumber ? (
        <span className="fm-admin-ratings__starsNumber">({numberValue})</span>
      ) : null}
    </span>
  );
}

const normalizeSpecialization = (specialization) => {
  if (Array.isArray(specialization)) {
    return specialization
      .map((item) =>
        typeof item === "object"
          ? item.name || item.code || item.category || item.slug
          : String(item),
      )
      .filter(Boolean)
      .join(", ");
  }

  if (typeof specialization === "object" && specialization) {
    return (
      specialization.name ||
      specialization.code ||
      specialization.category ||
      specialization.slug ||
      ""
    );
  }

  return String(specialization || "");
};

const defaultFilters = {
  technicianId: "",
  minStars: 1,
  maxStars: 5,
  query: "",
  from: "",
  to: "",
  limit: 20,
};

export default function Ratings() {
  const [technicianId, setTechnicianId] = useState(defaultFilters.technicianId);
  const [minStars, setMinStars] = useState(defaultFilters.minStars);
  const [maxStars, setMaxStars] = useState(defaultFilters.maxStars);
  const [query, setQuery] = useState(defaultFilters.query);
  const [from, setFrom] = useState(defaultFilters.from);
  const [to, setTo] = useState(defaultFilters.to);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultFilters.limit);

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [techList, setTechList] = useState([]);
  const [techLoading, setTechLoading] = useState(false);

  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Number(total || 0) / Number(limit || 20))),
    [limit, total],
  );

  const visibleAverage = useMemo(() => {
    if (!items.length) return 0;

    const totalStars = items.reduce(
      (sum, item) => sum + Number(item?.rating?.stars || 0),
      0,
    );

    return totalStars / items.length;
  }, [items]);

  const techOptions = useMemo(() => {
    return (techList || []).map((technician) => {
      const specialization = normalizeSpecialization(technician.specialization);

      return {
        id: technician._id,
        label: `${technician.full_name}${specialization ? ` — ${specialization}` : ""}`,
      };
    });
  }, [techList]);

  useEffect(() => {
    let ignore = false;

    async function loadTechnicians() {
      setTechLoading(true);

      try {
        const { data } = await api.get("/api/coordinator/technicians", {
          params: {
            page: 1,
            limit: 200,
          },
        });

        if (!ignore) {
          setTechList(data?.items || []);
        }
      } catch {
        if (!ignore) {
          setTechList([]);
        }
      } finally {
        if (!ignore) {
          setTechLoading(false);
        }
      }
    }

    loadTechnicians();

    return () => {
      ignore = true;
    };
  }, []);

  async function loadRatings(nextPage = page, override = {}) {
    const values = {
      technicianId,
      minStars,
      maxStars,
      query,
      from,
      to,
      limit,
      ...override,
    };

    setLoading(true);
    setErr("");

    try {
      const { data } = await api.get("/api/ratings", {
        params: {
          technicianId: values.technicianId || undefined,
          minStars: values.minStars,
          maxStars: values.maxStars,
          q: values.query || undefined,
          from: values.from || undefined,
          to: values.to || undefined,
          page: nextPage,
          limit: values.limit,
        },
      });

      setItems(data?.items || []);
      setTotal(data?.total || 0);
      setPage(data?.page || nextPage);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to load ratings.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRatings(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (event) => {
    event?.preventDefault?.();
    loadRatings(1);
  };

  const resetFilters = () => {
    setTechnicianId(defaultFilters.technicianId);
    setMinStars(defaultFilters.minStars);
    setMaxStars(defaultFilters.maxStars);
    setQuery(defaultFilters.query);
    setFrom(defaultFilters.from);
    setTo(defaultFilters.to);
    setLimit(defaultFilters.limit);

    loadRatings(1, defaultFilters);
  };

  const onPrev = () => {
    const nextPage = Math.max(1, page - 1);

    if (nextPage !== page) {
      loadRatings(nextPage);
    }
  };

  const onNext = () => {
    const nextPage = Math.min(totalPages, page + 1);

    if (nextPage !== page) {
      loadRatings(nextPage);
    }
  };

  const openSummary = async (techId) => {
    if (!techId) return;

    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummary(null);

    try {
      const { data } = await api.get(
        `/api/technicians/${techId}/ratings/summary`,
      );
      setSummary(data);
    } catch (error) {
      setSummary({
        error: error?.response?.data?.message || "Failed to load summary.",
      });
    } finally {
      setSummaryLoading(false);
    }
  };

  useEffect(() => {
    if (!summaryOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSummaryOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [summaryOpen]);

  return (
    <section className="fm-admin-ratings">
      <div className="fm-admin-ratings__header">
        <div>
          <span className="fm-admin-ratings__eyebrow">Ratings & Feedback</span>
          <h1>Ratings & Feedback</h1>
          <p>
            Browse customer ratings, filter technician feedback, and review
            technician rating summaries for completed jobs.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-ratings__btn fm-admin-ratings__btn--outline"
          onClick={() => loadRatings(page)}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-admin-ratings__summaryGrid">
        <article className="fm-admin-ratings__summaryCard">
          <span>
            <Star size={17} />
          </span>
          <div>
            <strong>{Number(visibleAverage || 0).toFixed(2)}</strong>
            <p>Visible average</p>
          </div>
        </article>

        <article className="fm-admin-ratings__summaryCard">
          <span>
            <MessageSquareText size={17} />
          </span>
          <div>
            <strong>{total}</strong>
            <p>Total reviews</p>
          </div>
        </article>

        <article className="fm-admin-ratings__summaryCard">
          <span>
            <UserRound size={17} />
          </span>
          <div>
            <strong>{techList.length}</strong>
            <p>Technicians loaded</p>
          </div>
        </article>

        <article className="fm-admin-ratings__summaryCard">
          <span>
            <BarChart3 size={17} />
          </span>
          <div>
            <strong>{page}</strong>
            <p>Current page</p>
          </div>
        </article>
      </div>

      <form className="fm-admin-ratings__card" onSubmit={applyFilters}>
        <div className="fm-admin-ratings__cardHeader">
          <div>
            <span>Rating filters</span>
            <h2>Search Reviews</h2>
          </div>
        </div>

        <div className="fm-admin-ratings__filters">
          <div className="fm-admin-ratings__field fm-admin-ratings__field--wide">
            <label htmlFor="fm-rating-technician">Technician</label>
            <select
              id="fm-rating-technician"
              value={technicianId}
              onChange={(event) => setTechnicianId(event.target.value)}
              disabled={techLoading}>
              <option value="">
                {techLoading ? "Loading technicians" : "All technicians"}
              </option>

              {techOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
            <small>Filter ratings for one technician.</small>
          </div>

          <div className="fm-admin-ratings__field">
            <label htmlFor="fm-rating-min">Min Stars</label>
            <select
              id="fm-rating-min"
              value={minStars}
              onChange={(event) => setMinStars(Number(event.target.value))}>
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="fm-admin-ratings__field">
            <label htmlFor="fm-rating-max">Max Stars</label>
            <select
              id="fm-rating-max"
              value={maxStars}
              onChange={(event) => setMaxStars(Number(event.target.value))}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="fm-admin-ratings__field">
            <label htmlFor="fm-rating-from">From</label>
            <input
              id="fm-rating-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>

          <div className="fm-admin-ratings__field">
            <label htmlFor="fm-rating-to">To</label>
            <input
              id="fm-rating-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>

          <div className="fm-admin-ratings__field fm-admin-ratings__field--wide">
            <label htmlFor="fm-rating-search">Search</label>
            <div className="fm-admin-ratings__searchInput">
              <Search size={16} />
              <input
                id="fm-rating-search"
                type="search"
                placeholder="Search comments or problem titles"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
          </div>

          <div className="fm-admin-ratings__field">
            <label htmlFor="fm-rating-limit">Per Page</label>
            <select
              id="fm-rating-limit"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}>
              {[10, 20, 50, 100].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>

          <div className="fm-admin-ratings__actions">
            <button
              type="submit"
              className="fm-admin-ratings__btn fm-admin-ratings__btn--primary">
              Apply
            </button>

            <button
              type="button"
              className="fm-admin-ratings__btn fm-admin-ratings__btn--outline"
              onClick={resetFilters}>
              Reset
            </button>
          </div>
        </div>
      </form>

      {err ? (
        <div className="fm-admin-ratings__notice fm-admin-ratings__notice--error">
          {err}
        </div>
      ) : null}

      {loading ? (
        <div className="fm-admin-ratings__notice fm-admin-ratings__notice--info">
          Loading ratings...
        </div>
      ) : null}

      {!loading ? (
        <section className="fm-admin-ratings__card">
          <div className="fm-admin-ratings__cardHeader">
            <div>
              <span>Review records</span>
              <h2>Customer Ratings</h2>
            </div>
          </div>

          <div className="fm-admin-ratings__tableWrap">
            <table className="fm-admin-ratings__table">
              <thead>
                <tr>
                  <th>Rated</th>
                  <th>Stars</th>
                  <th>Comment</th>
                  <th>Service / Issue</th>
                  <th>Technician</th>
                  <th>Customer</th>
                </tr>
              </thead>

              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6">
                      <div className="fm-admin-ratings__empty">
                        <Star size={24} />
                        <strong>No ratings found</strong>
                        <span>No ratings match the current filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((rating) => (
                    <tr key={rating.bookingId}>
                      <td>
                        {rating.ratedAt
                          ? new Date(rating.ratedAt).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <Stars value={rating?.rating?.stars} />
                      </td>

                      <td className="fm-admin-ratings__comment">
                        {rating?.rating?.comment || "—"}
                      </td>

                      <td>
                        <div className="fm-admin-ratings__stackedCell">
                          <small>{rating.service?.category || "—"}</small>
                          <strong>{rating.service?.name || "—"}</strong>
                          <small>{rating.problemTitle || ""}</small>
                        </div>
                      </td>

                      <td>
                        {rating.technician ? (
                          <div className="fm-admin-ratings__person">
                            <img
                              src={
                                rating.technician.profile_image_url ||
                                "/default-profile.png"
                              }
                              alt=""
                            />

                            <div>
                              <strong>{rating.technician.name}</strong>

                              <button
                                type="button"
                                className="fm-admin-ratings__linkButton"
                                onClick={() =>
                                  openSummary(rating.technician.id)
                                }>
                                View summary
                              </button>

                              <small>
                                {normalizeSpecialization(
                                  rating.technician.specialization,
                                )}
                              </small>

                              <small>
                                {rating.technician.district || ""}
                                {rating.technician.email
                                  ? ` • ${rating.technician.email}`
                                  : ""}
                                {rating.technician.phone
                                  ? ` • ${rating.technician.phone}`
                                  : ""}
                              </small>
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>

                      <td>
                        {rating.customer ? (
                          <div className="fm-admin-ratings__stackedCell">
                            <strong>{rating.customer.name}</strong>
                            <small>{rating.customer.email}</small>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="fm-admin-ratings__pager">
            <button
              type="button"
              className="fm-admin-ratings__btn fm-admin-ratings__btn--outline"
              onClick={onPrev}
              disabled={page <= 1}>
              <ChevronLeft size={16} />
              Prev
            </button>

            <span>
              Page {page} of {totalPages} • {total} total
            </span>

            <button
              type="button"
              className="fm-admin-ratings__btn fm-admin-ratings__btn--outline"
              onClick={onNext}
              disabled={page >= totalPages}>
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </section>
      ) : null}

      {summaryOpen ? (
        <div
          className="fm-admin-ratings-modal"
          onClick={() => setSummaryOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Technician rating summary">
          <div
            className="fm-admin-ratings-modal__card"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-admin-ratings-modal__header">
              <div>
                <span>Technician summary</span>
                <h2>Technician Rating Summary</h2>
              </div>

              <button
                type="button"
                className="fm-admin-ratings__iconAction"
                onClick={() => setSummaryOpen(false)}
                aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {summaryLoading ? (
              <div className="fm-admin-ratings__notice fm-admin-ratings__notice--info">
                Loading summary...
              </div>
            ) : null}

            {!summaryLoading && summary?.error ? (
              <div className="fm-admin-ratings__notice fm-admin-ratings__notice--error">
                {summary.error}
              </div>
            ) : null}

            {!summaryLoading && summary && !summary.error ? (
              <>
                <div className="fm-admin-ratings__techSummary">
                  <img
                    src={
                      summary.technician?.profile_image_url ||
                      "/default-profile.png"
                    }
                    alt=""
                  />

                  <div>
                    <strong>{summary.technician?.name || "Technician"}</strong>
                    <small>
                      {summary.technician?.email || ""}
                      {summary.technician?.district
                        ? ` • ${summary.technician.district}`
                        : ""}
                    </small>
                    <small>
                      {normalizeSpecialization(
                        summary.technician?.specialization,
                      )}
                    </small>
                  </div>
                </div>

                <div className="fm-admin-ratings__modalMetrics">
                  <article>
                    <span>Average Rating</span>
                    <strong>
                      {Number(summary?.summary?.avgStars || 0).toFixed(2)}
                    </strong>
                  </article>

                  <article>
                    <span>Total Reviews</span>
                    <strong>{summary?.summary?.count || 0}</strong>
                  </article>
                </div>

                <div className="fm-admin-ratings__distribution">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count =
                      summary?.summary?.distribution?.[String(stars)] || 0;

                    const totalCount = summary?.summary?.count || 0;
                    const percentage = totalCount
                      ? Math.round((count / totalCount) * 100)
                      : 0;

                    return (
                      <div
                        className="fm-admin-ratings__distributionRow"
                        key={stars}>
                        <div>{stars} ★</div>

                        <div className="fm-admin-ratings__bar">
                          <span style={{ width: `${percentage}%` }} />
                        </div>

                        <small>
                          {count} ({percentage}%)
                        </small>
                      </div>
                    );
                  })}
                </div>

                <div className="fm-admin-ratings-modal__actions">
                  <button
                    type="button"
                    className="fm-admin-ratings__btn fm-admin-ratings__btn--primary"
                    onClick={() => {
                      if (summary?.technician?.id) {
                        setTechnicianId(summary.technician.id);
                        setSummaryOpen(false);
                        loadRatings(1, {
                          technicianId: summary.technician.id,
                        });
                      }
                    }}>
                    Filter by this technician
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
