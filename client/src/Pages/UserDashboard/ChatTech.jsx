import React, { useEffect, useMemo, useState } from "react";
import { getMyBookingsForCustomer } from "../../services/booking";
import ChatPanel from "../../Components/chat/ChatPanel.jsx";
import "./ChatTech.css";

const ALLOWED = new Set(["coordinator_approved", "in_progress"]);

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
        const eligible = (mine || []).filter(
          b => b.assignedTechnician && ALLOWED.has(String(b.status || "").toLowerCase())
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
    <div className="ctGrid">
      <aside className="ctLeft">
        <div className="ctHead">
          <h2>Chat with Technician</h2>
        </div>

        <div className="ctFilters">
          <input
            className="ctSearch"
            placeholder="Search by service, problem, or technician…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="ctSkeleton large" />
        ) : filtered.length === 0 ? (
          <div className="ctEmpty">No approved/active bookings yet.</div>
        ) : (
          <ul className="ctList">
            {filtered.map(b => (
              <li
                key={b._id}
                className={`ctItem ${String(b._id) === String(activeId) ? "is-active" : ""}`}
                onClick={() => setActiveId(b._id)}
              >
                <div className="ctMain">
                  <div className="ctTitle">{b.problemTitle || b.service?.name || "Booking"}</div>
                  <div className="ctSub">
                    <span className={`ctStatus ${String(b.status || "")}`}>
                      {String(b.status || "").replaceAll("_"," ")}
                    </span>
                    {b.service?.name && <> • {b.service.name}</>}
                  </div>
                </div>
                <div className="ctTech">
                  <div className="ctAvatar">
                    {b.assignedTechnician?.profile_image_url
                      ? <img src={b.assignedTechnician.profile_image_url} alt={b.assignedTechnician.full_name} />
                      : <span>{(b.assignedTechnician?.full_name?.[0] || "T").toUpperCase()}</span>}
                  </div>
                  <div className="ctTechName">{b.assignedTechnician?.full_name || "Technician"}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <main className="ctRight">
        {msg?.text && <div className={`ctMsg ${msg.type} is-visible`}>{msg.text}</div>}
        {!active ? (
          <div className="ctEmpty large">Select a booking to chat with your assigned technician.</div>
        ) : (
          <div className="ctPanelHolder">
            <ChatPanel booking={active} mode="inline" />
          </div>
        )}
      </main>
    </div>
  );
}
