import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import "./Support.css";

export default function Support() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState(null);

  // selection
  const [activeId, setActiveId] = useState(null);
  const active = useMemo(
    () => tickets.find(t => String(t._id) === String(activeId)) || null,
    [tickets, activeId]
  );

  // compose
  const [draft, setDraft] = useState("");

  // new ticket modal
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDetails, setNewDetails] = useState("");

  // load my complaints
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await api.get("/api/complaints/mine");
        if (!dead) {
          setTickets(data || []);
          // select first open ticket by default
          const first = (data || [])[0];
          if (first) setActiveId(first._id);
        }
      } catch (e) {
        if (!dead) setMsg({ type: "error", text: e?.response?.data?.message || e.message });
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  const sendMessage = async () => {
    if (!active?._id || !draft.trim()) return;
    try {
      const { data } = await api.patch(`/api/complaints/${active._id}/respond`, {
        text: draft.trim()
      });
      // server returns { complaint } or { message, complaint }
      const updated = data?.complaint;
      if (updated) {
        setTickets(prev => prev.map(t => (t._id === updated._id ? updated : t)));
      } else {
        // fallback: optimistically append to responses
        const optimistic = {
          byRole: "customer",
          text: draft.trim(),
          at: new Date().toISOString()
        };
        setTickets(prev => prev.map(t => {
          if (t._id !== active._id) return t;
          return { ...t, responses: [...(t.responses || []), optimistic] };
        }));
      }
      setDraft("");
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Failed to send message" });
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      setCreating(true);
      const { data } = await api.post("/api/complaints", {
        title: newTitle.trim(),
        details: newDetails.trim()
        // optional: bookingId
      });
      setTickets(prev => [data, ...prev]);
      setActiveId(data._id);
      setShowNew(false);
      setNewTitle(""); setNewDetails("");
    } catch (e) {
      setMsg({ type: "error", text: e?.response?.data?.message || "Could not create ticket" });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="support-shell">
      <div className="support-left">
        <div className="support-left__head">
          <h2>Support</h2>
          <button className="pill-btn" onClick={() => setShowNew(true)}>New Ticket</button>
        </div>

        {loading ? (
          <div className="skeleton lg" />
        ) : tickets.length === 0 ? (
          <div className="empty">No tickets yet. Create one to chat with our staff.</div>
        ) : (
          <ul className="ticket-list">
            {tickets.map(t => (
              <li
                key={t._id}
                className={`ticket ${t._id === activeId ? "active" : ""}`}
                onClick={() => setActiveId(t._id)}
              >
                <div className="t-title">{t.title}</div>
                <div className="t-meta">
                  <span className={`status ${t.status || "open"}`}>{(t.status || "open").replace("_"," ")}</span>
                  <span className="t-date">{new Date(t.createdAt || Date.now()).toLocaleDateString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="support-right">
        {msg?.text && <div className={`msg ${msg.type} show`}>{msg.text}</div>}

        {!active ? (
          <div className="empty big">Select a ticket or create a new one.</div>
        ) : (
          <>
            <div className="chat-head">
              <div>
                <div className="chat-title">{active.title}</div>
                <div className="chat-sub">
                  Status:
                  <span className={`status ${active.status}`}> {(active.status || "").replace("_"," ") || "open"}</span>
                  {active.booking && <span className="dot">•</span>} {active.booking ? `Booking: ${active.booking}` : ""}
                </div>
              </div>
            </div>

            <div className="chat-body">
              {/* original details as first bubble if present */}
              {active.details && (
                <Bubble role="customer" when={active.createdAt} text={active.details} first />
              )}

              {(active.responses || []).map((r, i) => (
                <Bubble key={i} role={r.byRole} when={r.at} text={r.text} />
              ))}
            </div>

            <div className="chat-compose">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your message…"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              />
              <button className="primaryb" onClick={sendMessage}>Send</button>
            </div>
          </>
        )}
      </div>

      {/* New ticket modal */}
      {showNew && (
        <div className="overlay" onClick={() => setShowNew(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Create support ticket</h3>
            <form onSubmit={createTicket} className="new-form">
              <label>Title *</label>
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Clarification about my booking"
                required
              />
              <label>Details</label>
              <textarea
                rows="4"
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                placeholder="Optional additional information"
              />
              <div className="actions">
                <button type="button" className="btn ghost" onClick={() => setShowNew(false)}>Cancel</button>
                <button type="submit" className="primary" disabled={creating}>
                  {creating ? "Creating…" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Bubble({ role, when, text, first }) {
  const mine = role === "customer"; // current page is customer dashboard
  return (
    <div className={`bubble-row ${mine ? "mine" : ""} ${first ? "first" : ""}`}>
      <div className="bubble">
        <div className="b-text">{text}</div>
        <div className="b-time">
          {role === "customer" ? "You" : (role || "staff")}
          {" • "}
          {when ? new Date(when).toLocaleString() : ""}
        </div>
      </div>
    </div>
  );
}
