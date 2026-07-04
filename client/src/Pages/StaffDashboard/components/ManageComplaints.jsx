import React, { useEffect, useMemo, useState } from "react";
import {
  Check,
  ClipboardList,
  MessageSquareReply,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./ManageComplaints.css";

const statusClass = (status = "") =>
  ({
    open: "isOpen",
    in_progress: "isProgress",
    resolved: "isResolved",
    closed: "isClosed",
  })[status] || "isOpen";

const formatStatus = (status = "open") =>
  String(status || "open").replace("_", " ");

const formatDate = (value) => {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value || "—";
  }
};

const getBookingLabel = (booking) => {
  if (!booking) return "";

  if (typeof booking === "string") return booking;

  return booking?._id || booking?.problemTitle || "Linked booking";
};

export default function ManageComplaints({ role }) {
  const isCustomer = role === "customer";

  const [complaints, setComplaints] = useState([]);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [form, setForm] = useState({
    bookingId: "",
    title: "",
    details: "",
  });

  const [selected, setSelected] = useState(null);
  const [resp, setResp] = useState({
    text: "",
    status: "",
  });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setErr("");

      const url = isCustomer ? "/api/complaints/mine" : "/api/complaints";
      const { data } = await api.get(url);

      setComplaints(Array.isArray(data) ? data : []);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to fetch complaints.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  useEffect(() => {
    if (!selected) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelected(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  const stats = useMemo(() => {
    const open = complaints.filter((item) => item.status === "open").length;
    const progress = complaints.filter(
      (item) => item.status === "in_progress",
    ).length;
    const resolved = complaints.filter(
      (item) => item.status === "resolved",
    ).length;
    const closed = complaints.filter((item) => item.status === "closed").length;

    return {
      total: complaints.length,
      open,
      progress,
      resolved,
      closed,
    };
  }, [complaints]);

  const filtered = useMemo(() => {
    let list = complaints
      .slice()
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (statusFilter) {
      list = list.filter((complaint) => complaint.status === statusFilter);
    }

    if (query.trim()) {
      const text = query.trim().toLowerCase();

      list = list.filter((complaint) =>
        [
          complaint.title,
          complaint.details,
          getBookingLabel(complaint.booking),
          complaint.customer?.full_name,
          complaint.customer?.email,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(text)),
      );
    }

    return list;
  }, [complaints, query, statusFilter]);

  const handleCreate = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!form.title.trim()) {
      setMessage({
        type: "error",
        text: "Please enter complaint title.",
      });
      return;
    }

    try {
      await api.post("/api/complaints", form);

      setMessage({
        type: "success",
        text: "Complaint created successfully.",
      });

      setForm({
        bookingId: "",
        title: "",
        details: "",
      });

      fetchComplaints();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Error creating complaint.",
      });
    }
  };

  const handleRespond = async (event) => {
    event.preventDefault();

    if (!selected?._id) return;

    try {
      await api.patch(`/api/complaints/${selected._id}/respond`, resp);

      setMessage({
        type: "success",
        text: "Response posted successfully.",
      });

      setSelected(null);
      setResp({
        text: "",
        status: "",
      });

      fetchComplaints();
    } catch (error) {
      setMessage({
        type: "error",
        text: error?.response?.data?.message || "Error responding.",
      });
    }
  };

  const resetFilters = () => {
    setQuery("");
    setStatusFilter("");
  };

  return (
    <section className="fm-staff-complaints">
      <div className="fm-staff-complaints__header">
        <div>
          <span className="fm-staff-complaints__eyebrow">
            Complaint Management
          </span>

          <h1>Manage Complaints</h1>

          <p>
            Track customer complaints, post coordinator responses, and update
            complaint status from one workspace.
          </p>
        </div>

        <button
          type="button"
          className="fm-staff-complaints__btn fm-staff-complaints__btn--outline"
          onClick={fetchComplaints}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-staff-complaints__summaryGrid">
        <article className="fm-staff-complaints__summaryCard">
          <span>
            <ClipboardList size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total complaints</p>
          </div>
        </article>

        <article className="fm-staff-complaints__summaryCard">
          <span>
            <MessageSquareReply size={17} />
          </span>
          <div>
            <strong>{stats.open}</strong>
            <p>Open</p>
          </div>
        </article>

        <article className="fm-staff-complaints__summaryCard">
          <span>
            <SlidersHorizontal size={17} />
          </span>
          <div>
            <strong>{stats.progress}</strong>
            <p>In progress</p>
          </div>
        </article>

        <article className="fm-staff-complaints__summaryCard">
          <span>
            <Check size={17} />
          </span>
          <div>
            <strong>{stats.resolved + stats.closed}</strong>
            <p>Resolved / closed</p>
          </div>
        </article>
      </div>

      {message?.text ? (
        <div
          className={`fm-staff-complaints__notice fm-staff-complaints__notice--${message.type}`}
          role="status"
          aria-live="polite">
          {message.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{message.text}</span>
        </div>
      ) : null}

      {err ? (
        <div
          className="fm-staff-complaints__notice fm-staff-complaints__notice--error"
          role="status"
          aria-live="polite">
          <X size={16} />
          <span>{err}</span>
        </div>
      ) : null}

      {isCustomer ? (
        <form
          className="fm-staff-complaints__card"
          onSubmit={handleCreate}
          autoComplete="off">
          <div className="fm-staff-complaints__cardHeader">
            <div>
              <span>New complaint</span>
              <h2>Create Complaint</h2>
            </div>
          </div>

          <div className="fm-staff-complaints__formGrid">
            <div className="fm-staff-complaints__field">
              <label htmlFor="fm-complaint-booking">Booking ID</label>
              <input
                id="fm-complaint-booking"
                type="text"
                name="bookingId"
                placeholder="Optional booking ID"
                value={form.bookingId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    bookingId: event.target.value,
                  }))
                }
              />
            </div>

            <div className="fm-staff-complaints__field">
              <label htmlFor="fm-complaint-title">Title *</label>
              <input
                id="fm-complaint-title"
                type="text"
                name="title"
                placeholder="Brief summary"
                required
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
              />
            </div>

            <div className="fm-staff-complaints__field fm-staff-complaints__field--wide">
              <label htmlFor="fm-complaint-details">Details</label>
              <textarea
                id="fm-complaint-details"
                name="details"
                rows={4}
                placeholder="Describe the issue"
                value={form.details}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    details: event.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="fm-staff-complaints__actions">
            <button
              type="submit"
              className="fm-staff-complaints__btn fm-staff-complaints__btn--primary">
              Submit Complaint
            </button>
          </div>
        </form>
      ) : (
        <section className="fm-staff-complaints__card">
          <div className="fm-staff-complaints__toolbar">
            <div>
              <span>Complaint filters</span>
              <h2>Review Queue</h2>
            </div>

            <div className="fm-staff-complaints__tools">
              <label className="fm-staff-complaints__select">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">All statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </label>

              <label className="fm-staff-complaints__search">
                <Search size={16} />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search complaints"
                />
              </label>

              <button
                type="button"
                className="fm-staff-complaints__btn fm-staff-complaints__btn--outline"
                onClick={resetFilters}>
                Reset
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="fm-staff-complaints__card">
        <div className="fm-staff-complaints__cardHeader">
          <div>
            <span>Complaint records</span>
            <h2>{isCustomer ? "My Complaints" : "All Complaints"}</h2>
          </div>
        </div>

        {loading ? (
          <div className="fm-staff-complaints__empty">
            <RefreshCw size={24} />
            <strong>Loading complaints</strong>
            <span>Please wait while complaint records are loaded.</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="fm-staff-complaints__empty">
            <ClipboardList size={24} />
            <strong>No complaints found</strong>
            <span>
              {query || statusFilter
                ? "Try changing the filters."
                : "Complaint records will appear here."}
            </span>
          </div>
        ) : (
          <div className="fm-staff-complaints__grid">
            {filtered.map((complaint) => (
              <article
                className="fm-staff-complaints__item"
                key={complaint._id}>
                <header className="fm-staff-complaints__itemHeader">
                  <h3>{complaint.title || "Untitled complaint"}</h3>

                  <span
                    className={`fm-staff-complaints__status ${statusClass(
                      complaint.status,
                    )}`}>
                    {formatStatus(complaint.status)}
                  </span>
                </header>

                <div className="fm-staff-complaints__meta">
                  <span>
                    <strong>Created:</strong> {formatDate(complaint.createdAt)}
                  </span>

                  {complaint.booking ? (
                    <span>
                      <strong>Booking:</strong>{" "}
                      {getBookingLabel(complaint.booking)}
                    </span>
                  ) : null}
                </div>

                {complaint.details ? (
                  <p className="fm-staff-complaints__details">
                    {complaint.details}
                  </p>
                ) : null}

                {complaint.responses?.length ? (
                  <div className="fm-staff-complaints__timeline">
                    <strong>Responses</strong>

                    <ul>
                      {complaint.responses.map((response, index) => (
                        <li key={`${complaint._id}-${index}`}>
                          <div>
                            <span>{response.byRole || "staff"}</span>
                            <small>{formatDate(response.at)}</small>
                          </div>

                          <p>{response.text}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {!isCustomer ? (
                  <div className="fm-staff-complaints__rowActions">
                    <button
                      type="button"
                      className="fm-staff-complaints__btn fm-staff-complaints__btn--primary"
                      onClick={() => {
                        setSelected(complaint);
                        setResp({
                          text: "",
                          status: "",
                        });
                      }}>
                      <MessageSquareReply size={15} />
                      Respond
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>

      {selected ? (
        <div
          className="fm-staff-complaints-modal"
          onClick={() => setSelected(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Respond to complaint">
          <div
            className="fm-staff-complaints-modal__card"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-staff-complaints-modal__header">
              <div>
                <span>Complaint response</span>
                <h2>Respond to complaint</h2>
                <p>{selected.title}</p>
              </div>

              <button
                type="button"
                className="fm-staff-complaints__iconAction"
                onClick={() => setSelected(null)}
                aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <form
              className="fm-staff-complaints__responseForm"
              onSubmit={handleRespond}>
              <div className="fm-staff-complaints__field">
                <label htmlFor="fm-response-text">Response *</label>
                <textarea
                  id="fm-response-text"
                  rows={4}
                  placeholder="Write a helpful response"
                  value={resp.text}
                  onChange={(event) =>
                    setResp((current) => ({
                      ...current,
                      text: event.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div className="fm-staff-complaints__chips">
                {[
                  "Thanks for reporting this. We are investigating.",
                  "We have escalated this to a coordinator.",
                  "Issue resolved. Please confirm if everything looks good.",
                ].map((text) => (
                  <button
                    key={text}
                    type="button"
                    onClick={() =>
                      setResp((current) => ({
                        ...current,
                        text: `${current.text ? `${current.text} ` : ""}${text}`,
                      }))
                    }>
                    {text}
                  </button>
                ))}
              </div>

              <div className="fm-staff-complaints__field">
                <label>Status</label>

                <div className="fm-staff-complaints__statusOptions">
                  {["", "open", "in_progress", "resolved", "closed"].map(
                    (status) => (
                      <label key={status || "keep"}>
                        <input
                          type="radio"
                          name="status"
                          checked={resp.status === status}
                          onChange={() =>
                            setResp((current) => ({
                              ...current,
                              status,
                            }))
                          }
                        />

                        <span
                          className={`fm-staff-complaints__status ${statusClass(
                            status || selected.status,
                          )}`}>
                          {status ? formatStatus(status) : "Keep current"}
                        </span>
                      </label>
                    ),
                  )}
                </div>
              </div>

              <div className="fm-staff-complaints-modal__actions">
                <button
                  type="submit"
                  className="fm-staff-complaints__btn fm-staff-complaints__btn--primary">
                  Send Response
                </button>

                <button
                  type="button"
                  className="fm-staff-complaints__btn fm-staff-complaints__btn--outline"
                  onClick={() => setSelected(null)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
