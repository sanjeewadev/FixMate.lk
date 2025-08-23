import React, { useEffect, useRef, useState } from "react";
import { listMyComplaints } from "../../services/complaints";
import "./Complaints.css";
import { useNavigate } from "react-router-dom";

export default function Complaints() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);
  const pollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let dead = false;
    async function load() {
      try {
        const list = await listMyComplaints();
        if (!dead) setItems(list);
      } catch (e) {
        if (!dead) setMsg({ type: "error", text: e?.response?.data?.message || e.message });
      } finally {
        if (!dead) setLoading(false);
      }
    }
    load();
    pollRef.current = setInterval(load, 8000);
    return () => { dead = true; if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  return (
    <div className="complaintsWrap">
      <h2 className="cTitle">My Complaints</h2>
      {msg?.text && <div className={`cMsg ${msg.type}`}>{msg.text}</div>}

      {loading ? (
        <div className="cCard">Loading…</div>
      ) : items.length === 0 ? (
        <div className="cCard">No complaints yet.</div>
      ) : (
        <div className="cList">
          {items.map((c) => (
            <div className="cItem" key={c._id}>
              <div className="cHeader">
                <div className="cHeadMain">
                  <div className="cH1">{c.title}</div>
                  <span className={`cStatus ${c.status}`}>{(c.status || "").replaceAll("_"," ")}</span>
                </div>
                {c.details && <div className="cDetails">{c.details}</div>}
                {c.booking && (
                  <button
                    className="cLink"
                    onClick={() => navigate(`/UserDashboard/booking/${c.booking}`)}
                  >
                    View related booking
                  </button>
                )}
              </div>

              <div className="cThread">
                {(c.responses || []).map((r, i) => (
                  <div className={`cBubble ${r.byRole === "customer" ? "me" : "them"}`} key={i}>
                    <div className="cBy">
                      {(r.byRole === "customer" ? "You" : (r.byRole || "staff"))}
                      {r.byName ? ` (${r.byName})` : ""}
                      {" • "}
                      {r.at ? new Date(r.at).toLocaleString() : ""}
                    </div>
                    <div className="cText">{r.text}</div>
                  </div>
                ))}
                {!c.responses?.length && <div className="cEmptyNote">No responses yet.</div>}
              </div>

              <div className="cFooter">
                <button className="cBtn ghost" onClick={() => navigate("/UserDashboard/support")}>
                  Discuss in Support chat
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
