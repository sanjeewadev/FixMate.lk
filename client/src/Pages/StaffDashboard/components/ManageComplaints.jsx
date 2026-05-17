import React, { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import "./ManageComplaints.css";

/** Pill color by status */
const statusClass = (s = "") =>
  ({
    open: "pill open",
    in_progress: "pill progress",
    resolved: "pill resolved",
    closed: "pill closed",
  })[s] || "pill open";

/** Small helper to format dates */
const fmt = (s) => {
  try {
    return new Date(s).toLocaleString();
  } catch {
    return s || "";
  }
};

export default function ManageComplaints({ role }) {
  const isCustomer = role === "customer";
  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // create form (customers)
  const [form, setForm] = useState({ bookingId: "", title: "", details: "" });

  // respond modal
  const [selected, setSelected] = useState(null);
  const [resp, setResp] = useState({ text: "", status: "" });

  // client‑side filters (optional but handy for staff/admin)
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setErr("");
      let url = "/api/complaints";
      if (isCustomer) url = "/api/complaints/mine";
      const { data } = await api.get(url);
      setComplaints(data || []);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to fetch complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints(); /* eslint-disable-next-line */
  }, [role]);

  // ===== Create complaint (customers) =====
  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await api.post("/api/complaints", form);
      setMessage("Complaint created ");
      setForm({ bookingId: "", title: "", details: "" });
      fetchComplaints();
    } catch (e) {
      setMessage(e?.response?.data?.message || "Error creating complaint");
    }
  };

  // ===== Respond (staff/admin) =====
  const handleRespond = async (e) => {
    e.preventDefault();
    if (!selected?._id) return;
    try {
      await api.patch(`/api/complaints/${selected._id}/respond`, resp);
      setMessage("Response posted ");
      setSelected(null);
      setResp({ text: "", status: "" });
      fetchComplaints();
    } catch (e) {
      setMessage(e?.response?.data?.message || "Error responding");
    }
  };

  const filtered = useMemo(() => {
    let list = complaints
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (statusFilter) list = list.filter((c) => c.status === statusFilter);
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      list = list.filter(
        (c) =>
          (c.title || "").toLowerCase().includes(s) ||
          (c.details || "").toLowerCase().includes(s) ||
          (c.booking || "").toLowerCase?.().includes?.(s),
      );
    }
    return list;
  }, [complaints, q, statusFilter]);

  return (
    <div className="mc">
      <div className="mc-head">
        <h2>Manage Complaints</h2>
        <div className="muted tiny">
          Track complaints, post responses, and update status.
        </div>
      </div>

      {message && <div className="mc-alert info">{message}</div>}
      {err && <div className="mc-alert danger">{err}</div>}

      {/* Create (customers only) */}
      {isCustomer && (
        <form
          className="mc-card mc-form"
          onSubmit={handleCreate}
          autoComplete="off">
          <div className="mc-form-grid">
            <div className="field">
              <label>Booking ID (optional)</label>
              <input
                type="text"
                name="bookingId"
                placeholder="643af…"
                value={form.bookingId}
                onChange={(e) =>
                  setForm((p) => ({ ...p, bookingId: e.target.value }))
                }
              />
            </div>
            <div className="field">
              <label>Title</label>
              <input
                type="text"
                name="title"
                placeholder="Brief summary"
                required
                value={form.title}
                onChange={(e) =>
                  setForm((p) => ({ ...p, title: e.target.value }))
                }
              />
            </div>
            <div className="field col-2">
              <label>Details</label>
              <textarea
                name="details"
                rows={4}
                placeholder="Describe the issue…"
                value={form.details}
                onChange={(e) =>
                  setForm((p) => ({ ...p, details: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="actions">
            <button className="btn primary" type="submit">
              Submit Complaint
            </button>
          </div>
        </form>
      )}

      {/* Filters (staff/admin) */}
      {!isCustomer && (
        <div className="mc-card mc-filters">
          <div className="field">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="field">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search title/details/booking…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="actions">
            <button
              className="btn outline"
              onClick={() => {
                setQ("");
                setStatusFilter("");
              }}>
              Reset
            </button>
            <button
              className="btn"
              onClick={fetchComplaints}
              disabled={loading}>
              {loading ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      <h3 className="mc-subtitle">
        {isCustomer ? "My Complaints" : "All Complaints"}
      </h3>
      {loading ? (
        <div className="mc-skel">Loading complaints…</div>
      ) : filtered.length === 0 ? (
        <div className="mc-empty">
          <div className="emoji">🗂️</div>
          <div className="muted">No complaints found.</div>
        </div>
      ) : (
        <div className="mc-grid">
          {filtered.map((c) => (
            <article className="mc-card mc-item" key={c._id}>
              <header className="mc-item-head">
                <h4 className="title">{c.title}</h4>
                <span className={statusClass(c.status)}>
                  {c.status?.replace("_", " ")}
                </span>
              </header>

              <div className="meta tiny muted">
                <div>
                  <b>Created:</b> {fmt(c.createdAt)}
                </div>
                {c.booking && (
                  <div>
                    <b>Booking:</b> {c.booking}
                  </div>
                )}
              </div>

              {c.details && <p className="details">{c.details}</p>}

              {/* Responses timeline */}
              {!!c.responses?.length && (
                <div className="timeline">
                  <div className="tl-title">Responses</div>
                  <ul>
                    {c.responses.map((r, i) => (
                      <li key={i}>
                        <div className="who">
                          <span className="dot" />
                          <b>{r.byRole || "staff"}</b>
                          <span className="time">{fmt(r.at)}</span>
                        </div>
                        <div className="text">{r.text}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Respond (staff/admin) */}
              {!isCustomer && (
                <div className="row-actions">
                  <button
                    className="btn small"
                    onClick={() => {
                      setSelected(c);
                      setResp({ text: "", status: "" });
                    }}>
                    Respond
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Respond Modal */}
      {selected && (
        <div
          className="mc-modal"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true">
          <div className="mc-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="mc-modal-head">
              <div>
                <h4>Respond to complaint</h4>
                <div className="tiny muted">{selected.title}</div>
              </div>
              <button className="btn ghost" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>

            <form className="resp-form" onSubmit={handleRespond}>
              <div className="field">
                <label>Response</label>
                <textarea
                  rows={4}
                  placeholder="Write a helpful, actionable response…"
                  value={resp.text}
                  onChange={(e) =>
                    setResp((p) => ({ ...p, text: e.target.value }))
                  }
                  required
                />
                {/* quick suggestions */}
                <div className="chips">
                  {[
                    "Thanks for reporting this. We’re investigating.",
                    "We have escalated this to a coordinator.",
                    "Issue resolved. Please confirm if everything looks good.",
                  ].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className="chip"
                      onClick={() =>
                        setResp((p) => ({
                          ...p,
                          text: (p.text ? p.text + " " : "") + t,
                        }))
                      }>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Status</label>
                <div className="status-row">
                  {["", "open", "in_progress", "resolved", "closed"].map(
                    (s) => (
                      <label key={s} className="radio-pill">
                        <input
                          type="radio"
                          name="status"
                          checked={resp.status === s}
                          onChange={() => setResp((p) => ({ ...p, status: s }))}
                        />
                        <span className={statusClass(s || selected.status)}>
                          {s ? s.replace("_", " ") : "Keep current"}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="actions end">
                <button className="btn primary" type="submit">
                  Send Response
                </button>
                <button
                  className="btn"
                  type="button"
                  onClick={() => setSelected(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
