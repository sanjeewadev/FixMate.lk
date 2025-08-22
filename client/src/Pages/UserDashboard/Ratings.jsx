import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";
import RateBookingModal from "./components/Rating/RateBookingModal.jsx";
import "../UserDashboard/MyBookings.css"; // reuse table/button styles if you like

export default function Ratings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await api.get("/api/bookings/mine");
        if (!dead) setBookings(data?.bookings || data || []);
      } finally { if (!dead) setLoading(false); }
    })();
    return () => { dead = true; };
  }, []);

  const completed = useMemo(
    () => (bookings || []).filter(b => /complete/i.test(String(b.status||""))),
    [bookings]
  );
  const toRate = useMemo(() => completed.filter(b => !b.rating?.stars), [completed]);
  const rated  = useMemo(() => completed.filter(b => !!b.rating?.stars), [completed]);

  return (
    <div className="mbWrap">
      <h2 className="mbTitle">Ratings</h2>

      {loading ? <div className="mbCard">Loading…</div> : (
        <>
          <div className="mbCard" style={{marginBottom:16}}>
            <h3 style={{marginTop:0}}>To rate</h3>
            {toRate.length === 0 ? (
              <div>No completed services waiting for a rating.</div>
            ) : (
              <table className="mbTable">
                <thead><tr><th>Date</th><th>Service</th><th></th></tr></thead>
                <tbody>
                  {toRate.map(b => (
                    <tr key={b._id}>
                      <td>{b.preferredAt ? new Date(b.preferredAt).toLocaleDateString() : "-"}</td>
                      <td>{b.service?.name || b.serviceName || "—"}</td>
                      <td><button className="mbLink" onClick={() => setEditing(b)}>Rate</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="mbCard">
            <h3 style={{marginTop:0}}>My ratings</h3>
            {rated.length === 0 ? (
              <div>No ratings yet.</div>
            ) : (
              <table className="mbTable">
                <thead><tr><th>Date</th><th>Service</th><th>Rating</th><th>Comment</th><th></th></tr></thead>
                <tbody>
                  {rated.map(b => (
                    <tr key={b._id}>
                      <td>{b.preferredAt ? new Date(b.preferredAt).toLocaleDateString() : "-"}</td>
                      <td>{b.service?.name || b.serviceName || "—"}</td>
                      <td>★ {b.rating.stars}</td>
                      <td>{b.rating.comment || "—"}</td>
                      <td><button className="mbLink" onClick={() => setEditing(b)}>Update</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {editing && (
        <RateBookingModal
          booking={editing}
          onClose={() => setEditing(null)}
          onSaved={(rating) => {
            setBookings(prev => prev.map(x => x._id === editing._id ? { ...x, rating } : x));
          }}
        />
      )}
    </div>
  );
}
