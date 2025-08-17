import React, { useEffect, useMemo, useState } from "react";
import api from "../../lib/api";

export default function Overview() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await api.get("/api/bookings/mine");
        if (!dead) setList(data?.bookings || data || []);
      } catch (e) {
        // ignore softly
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, []);

  const stats = useMemo(() => {
    const s = { total: list.length, pending: 0, approved: 0, completed: 0 };
    list.forEach(b => {
      const st = (b.status || "").toLowerCase();
      if (st.includes("pend")) s.pending++;
      else if (st.includes("approve") || st.includes("schedul")) s.approved++;
      else if (st.includes("complete")) s.completed++;
    });
    return s;
  }, [list]);

  return (
    <div>
      <h2 style={{ marginBottom: 16 }}>Overview</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
        <Card label="Total" value={stats.total} />
        <Card label="Pending" value={stats.pending} />
        <Card label="Approved" value={stats.approved} />
        <Card label="Completed" value={stats.completed} />
      </div>

      <h3 style={{ margin: "24px 0 12px" }}>Recent bookings</h3>
      {loading ? (
        <div>Loading…</div>
      ) : list.length === 0 ? (
        <Empty />
      ) : (
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Service</th><th>Status</th></tr>
          </thead>
          <tbody>
            {list.slice(0,5).map(b => (
              <tr key={b._id}>
                <td>{b.preferredAt ? new Date(b.preferredAt).toLocaleDateString() : "-"}</td>
                <td>{b.service?.name || b.serviceName || "—"}</td>
                <td>{b.status || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div style={{
      background:"#fff", border:"1px solid #eaecef", borderRadius:12, padding:16,
      display:"flex", flexDirection:"column", gap:6
    }}>
      <div style={{ color:"#6b7280", fontSize:12, textTransform:"uppercase", letterSpacing:".06em" }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:800 }}>{value}</div>
    </div>
  );
}
function Empty(){ return <div style={{padding:16, background:"#fff", border:"1px solid #eaecef", borderRadius:12}}>No bookings yet.</div>; }
