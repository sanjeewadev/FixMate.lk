// src/Pages/UserDashboard/ChatTech.jsx
import React, { useEffect, useMemo, useState } from "react";
import { getMyBookingsForCustomer } from "../../services/booking";
import ChatPanel from "../../Components/chat/ChatPanel.jsx";
import "./ChatTech.css";

const ALLOWED = new Set(["coordinator_approved", "in_progress"]); // add "completed" if needed

export default function ChatTech() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const mine = await getMyBookingsForCustomer();
        const eligible = (mine || []).filter(b =>
          b.assignedTechnician && ALLOWED.has(String(b.status || "").toLowerCase())
        );
        if (!dead) {
          setBookings(eligible);
          if (eligible[0]) setActiveId(eligible[0]._id);
        }
      } catch (e) {
        if (!dead) setMsg({ type: "error", text: e?.response?.data?.message || e.message });
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return bookings.filter(b => {
      if (!q) return true;
      const svc = b?.service?.name || "";
      const title = b?.problemTitle || "";
      const tech = b?.assignedTechnician?.full_name || "";
      return [svc, title, tech].some(v => String(v).toLowerCase().includes(q));
    });
  }, [bookings, query]);

  const active = filtered.find(b => String(b._id) === String(activeId)) || null;

  return (
    <div className="twogrid">
      <aside className="twogrid__left">
        <div className="twogrid__head">
          <h2>Chat with Technician</h2>
        </div>

        <div className="twogrid__filters">
          <input
            className="ct__search"
            placeholder="Search by service, problem, or technician…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="skeleton lg" />
        ) : filtered.length === 0 ? (
          <div className="empty">No approved/active bookings yet.</div>
        ) : (
          <ul className="chat-booking-list">
            {filtered.map(b => (
              <li
                key={b._id}
                className={`chat-booking ${String(b._id) === String(activeId) ? "active" : ""}`}
                onClick={() => setActiveId(b._id)}
              >
                <div className="cb-main">
                  <div className="cb-title">{b.problemTitle || b.service?.name || "Booking"}</div>
                  <div className="cb-sub">
                    <span className={`status ${b.status}`}>{String(b.status || "").replaceAll("_"," ")}</span>
                    {b.service?.name && <> • {b.service.name}</>}
                  </div>
                </div>
                <div className="cb-tech">
                  <div className="avatar">
                    {b.assignedTechnician?.profile_image_url
                      ? <img src={b.assignedTechnician.profile_image_url} alt={b.assignedTechnician.full_name} />
                      : <span>{(b.assignedTechnician?.full_name?.[0] || "T").toUpperCase()}</span>}
                  </div>
                  <div className="tech-name">{b.assignedTechnician?.full_name || "Technician"}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="twogrid__right">
        {msg?.text && <div className={`msg ${msg.type} show`}>{msg.text}</div>}
        {!active ? (
          <div className="empty big">Select a booking to chat with your assigned technician.</div>
        ) : (
          <div className="panel-holder">
            <ChatPanel booking={active} mode="inline" />
          </div>
        )}
      </main>
    </div>
  );
}
