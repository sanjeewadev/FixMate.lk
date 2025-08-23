import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import "./Ratings.css";

/* Consistent 5-star display (rounded to nearest) */
function Stars({ value = 0, showNumber = true }) {
  const v = Math.max(0, Math.min(5, Number(value) || 0));
  const full = Math.round(v);
  return (
    <span className="rt-stars" aria-label={`${v} out of 5`}>
      {[0,1,2,3,4].map(i => (
        <span key={i} className={`rt-star ${i < full ? "full" : ""}`}>★</span>
      ))}
      {showNumber && <span className="rt-stars-num tiny muted">({v})</span>}
    </span>
  );
}

export default function Ratings() {
  // ---- Filters ----
  const [technicianId, setTechnicianId] = useState("");
  const [minStars, setMinStars] = useState(1);
  const [maxStars, setMaxStars] = useState(5);
  const [q, setQ] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ---- Data ----
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Technician dropdown
  const [techList, setTechList] = useState([]);
  const [techLoading, setTechLoading] = useState(false);

  // Summary modal
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summary, setSummary] = useState(null); // { technician, summary }

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(Number(total || 0) / Number(limit || 20))),
    [total, limit]
  );

  // Load technicians (for filter)
  useEffect(() => {
    let ignore = false;
    async function loadTechs() {
      setTechLoading(true);
      try {
        const { data } = await api.get("/api/coordinator/technicians", { params: { page: 1, limit: 200 } });
        if (!ignore) setTechList(data?.items || []);
      } catch {
        if (!ignore) setTechList([]);
      } finally {
        if (!ignore) setTechLoading(false);
      }
    }
    loadTechs();
    return () => { ignore = true; };
  }, []);

  async function loadRatings(p = page) {
    setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/ratings", {
        params: {
          technicianId: technicianId || undefined,
          minStars,
          maxStars,
          q: q || undefined,
          from: from || undefined,
          to: to || undefined,
          page: p,
          limit,
        },
      });
      setItems(data?.items || []);
      setTotal(data?.total || 0);
      setPage(data?.page || p);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load ratings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRatings(1); /* initial */ // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyFilters = (e) => { e?.preventDefault?.(); loadRatings(1); };

  const resetFilters = () => {
    setTechnicianId("");
    setMinStars(1);
    setMaxStars(5);
    setQ("");
    setFrom("");
    setTo("");
    setLimit(20);
    loadRatings(1);
  };

  const onPrev = () => { const p = Math.max(1, page - 1); if (p !== page) loadRatings(p); };
  const onNext = () => { const p = Math.min(totalPages, page + 1); if (p !== page) loadRatings(p); };

  // Open/Close summary
  const openSummary = async (techId) => {
    if (!techId) return;
    setSummaryOpen(true);
    setSummaryLoading(true);
    setSummary(null);
    try {
      const { data } = await api.get(`/api/technicians/${techId}/ratings/summary`);
      setSummary(data);
    } catch (e) {
      setSummary({ error: e?.response?.data?.message || "Failed to load summary" });
    } finally {
      setSummaryLoading(false);
    }
  };
  useEffect(() => {
    if (!summaryOpen) return;
    const onKey = (e) => { if (e.key === "Escape") setSummaryOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [summaryOpen]);

  // Options for tech select
  const techOptions = useMemo(() => {
    return (techList || []).map((t) => {
      let specs = t.specialization;
      if (Array.isArray(specs)) {
        specs = specs
          .map((s) => (typeof s === "object" ? (s.name || s.code || s.category || s.slug) : String(s)))
          .filter(Boolean)
          .join(", ");
      } else if (typeof specs === "object" && specs) {
        const s = specs;
        specs = s.name || s.code || s.category || s.slug || "";
      } else {
        specs = String(specs || "");
      }
      return { id: t._id, label: `${t.full_name}${specs ? " — " + specs : ""}` };
    });
  }, [techList]);

  return (
    <div className="rt">
      {/* Header */}
      <div className="rt-header">
        <div className="rt-title">
          <h2>Ratings & Feedback</h2>
          <div className="rt-sub">Browse and filter customer ratings on completed jobs.</div>
        </div>
      </div>

      {/* Filters */}
      <form className="rt-filters" onSubmit={applyFilters}>
        <div className="rt-filter">
          <label>Technician</label>
          <select value={technicianId} onChange={(e) => setTechnicianId(e.target.value)} disabled={techLoading}>
            <option value="">{techLoading ? "Loading…" : "All technicians"}</option>
            {techOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>{opt.label}</option>
            ))}
          </select>
          <div className="tiny muted">Filter to a single technician.</div>
        </div>

        <div className="rt-filter">
          <label>Min Stars</label>
          <select value={minStars} onChange={(e) => setMinStars(Number(e.target.value))}>
            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="rt-filter">
          <label>Max Stars</label>
          <select value={maxStars} onChange={(e) => setMaxStars(Number(e.target.value))}>
            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="rt-filter">
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>

        <div className="rt-filter">
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>

        <div className="rt-filter">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search comments or problem titles…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="rt-filter">
          <label>Per Page</label>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            {[10,20,50,100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div className="rt-filter rt-actions">
          <button type="submit" className="rt-btn rt-btn--primary">Apply</button>
          <button type="button" className="rt-btn rt-btn--outline" onClick={resetFilters}>Reset</button>
        </div>
      </form>

      {/* Messages */}
      {err && <div className="rt-alert rt-alert--error">{err}</div>}
      {loading && <div className="rt-alert rt-alert--info">Loading ratings…</div>}

      {/* Table */}
      {!loading && (
        <div className="rt-table-wrap">
          <table className="rt-table">
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
                  <td colSpan="6" style={{ textAlign: "center", padding: 20 }}>
                    No ratings found with current filters.
                  </td>
                </tr>
              ) : (
                items.map((r) => (
                  <tr key={r.bookingId}>
                    <td>{r.ratedAt ? new Date(r.ratedAt).toLocaleString() : "-"}</td>
                    <td><Stars value={r?.rating?.stars} /></td>
                    <td className="rt-comment">
                      {r?.rating?.comment ? r.rating.comment : <span className="muted">—</span>}
                    </td>
                    <td>
                      <div className="tiny muted">{r.service?.category || "—"}</div>
                      <div>{r.service?.name || "—"}</div>
                      <div className="tiny muted">{r.problemTitle || ""}</div>
                    </td>
                    <td>
                      {r.technician ? (
                        <div className="rt-tech">
                          <img
                            className="rt-avatar"
                            src={r.technician.profile_image_url || "/default-profile.png"}
                            alt=""
                          />
                          <div className="rt-tech-meta">
                            <div className="rt-tech-name">
                              {r.technician.name}{" "}
                              <button
                                className="rt-link-btn tiny"
                                onClick={() => openSummary(r.technician.id)}
                                title="View rating summary"
                              >
                                View summary
                              </button>
                            </div>
                            <div className="tiny muted">
                              {Array.isArray(r.technician.specialization)
                                ? r.technician.specialization
                                    .map((s) =>
                                      typeof s === "object"
                                        ? (s.name || s.code || s.category || s.slug)
                                        : String(s)
                                    )
                                    .filter(Boolean)
                                    .join(", ")
                                : (r.technician.specialization || "")}
                            </div>
                            <div className="tiny muted">
                              {r.technician.district || ""} • {r.technician.email || ""} • {r.technician.phone || ""}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {r.customer ? (
                        <>
                          <div>{r.customer.name}</div>
                          <div className="tiny muted">{r.customer.email}</div>
                        </>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pager */}
      <div className="rt-pager">
        <button className="rt-btn rt-btn--outline" onClick={onPrev} disabled={page <= 1}>Prev</button>
        <span className="muted tiny">
          Page {page} of {totalPages} • {total} total
        </span>
        <button className="rt-btn rt-btn--outline" onClick={onNext} disabled={page >= totalPages}>Next</button>
      </div>

      {/* Summary Modal */}
      {summaryOpen && (
        <div className="rt-modal-overlay" onClick={() => setSummaryOpen(false)} role="dialog" aria-modal="true">
          <div className="rt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rt-modal-head">
              <h4>Technician Rating Summary</h4>
              <button className="rt-btn rt-btn--danger rt-btn--small" onClick={() => setSummaryOpen(false)}>Close</button>
            </div>

            {summaryLoading && <div className="rt-alert rt-alert--info">Loading…</div>}

            {!summaryLoading && summary?.error && (
              <div className="rt-alert rt-alert--error">{summary.error}</div>
            )}

            {!summaryLoading && summary && !summary.error && (
              <>
                <div className="rt-tech-summary">
                  <img
                    className="rt-avatar lg"
                    src={summary.technician?.profile_image_url || "/default-profile.png"}
                    alt=""
                  />
                  <div>
                    <div className="rt-tech-title">{summary.technician?.name || "Technician"}</div>
                    <div className="tiny muted">
                      {summary.technician?.email || ""} • {summary.technician?.district || ""}
                    </div>
                    <div className="tiny muted">
                      {Array.isArray(summary.technician?.specialization)
                        ? summary.technician.specialization
                            .map((s) =>
                              typeof s === "object" ? (s.name || s.code || s.category || s.slug) : String(s)
                            )
                            .filter(Boolean)
                            .join(", ")
                        : (summary.technician?.specialization || "")}
                    </div>
                  </div>
                </div>

                <div className="rt-metrics">
                  <div className="rt-metric-card">
                    <h4>Average Rating</h4>
                    <div className="rt-metric">{Number(summary?.summary?.avgStars || 0).toFixed(2)}</div>
                  </div>
                  <div className="rt-metric-card">
                    <h4>Total Reviews</h4>
                    <div className="rt-metric">{summary?.summary?.count || 0}</div>
                  </div>
                </div>

                <div className="rt-dist">
                  {[5,4,3,2,1].map((s) => {
                    const count = summary?.summary?.distribution?.[String(s)] || 0;
                    const totalCount = summary?.summary?.count || 0;
                    const pct = totalCount ? Math.round((count / totalCount) * 100) : 0;
                    return (
                      <div className="rt-dist-row" key={s}>
                        <div className="rt-dist-label">{s} ★</div>
                        <div className="rt-dist-bar">
                          <div className="rt-dist-fill" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="rt-dist-val tiny">{count} ({pct}%)</div>
                      </div>
                    );
                  })}
                </div>

                <div className="rt-modal-actions">
                  <button
                    className="rt-btn rt-btn--primary"
                    onClick={() => {
                      if (summary?.technician?.id) {
                        setTechnicianId(summary.technician.id);
                        setSummaryOpen(false);
                        loadRatings(1);
                      }
                    }}
                  >
                    Filter by this technician
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
