import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../lib/api";

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const { data } = await api.get(`/api/bookings/${id}`);
        if (!dead) setBooking(data?.booking || data);
      } finally { if (!dead) setLoading(false); }
    })();
    return () => { dead = true; };
  }, [id]);

  if (loading) return <div>Loading…</div>;
  if (!booking) return <div className="card">Not found</div>;

  const s = booking;
  const photos = s.media || s.photos || [];

  return (
    <div>
      <button className="link" onClick={() => navigate(-1)}>← back</button>
      <h2 style={{ margin: "8px 0 16px" }}>{s.service?.name || s.serviceName || "Service"} <StatusChip v={s.status} /></h2>

      <div className="grid2">
        <div className="card">
          <h3>Visit</h3>
          <div className="kv"><span>Date</span><b>{s.preferredAt ? new Date(s.preferredAt).toLocaleString() : "-"}</b></div>
          <div className="kv"><span>Time</span><b>{s.timeSlot || "Any"}</b></div>
          <div className="kv"><span>Address</span><b>{s.address || "-"}</b></div>
          <div className="kv"><span>District</span><b>{s.district || "-"}</b></div>
          <div className="kv"><span>Phone</span><b>{s.phone_number || "-"}</b></div>
        </div>
        <div className="card">
          <h3>Problem</h3>
          <div className="kv"><span>Title</span><b>{s.problemTitle || "-"}</b></div>
          <div className="kv"><span>Description</span><b>{s.problemDescription || "-"}</b></div>
          <div className="kv"><span>Brand/Model</span><b>{s.brandModel || "-"}</b></div>
          <div className="kv"><span>Equipment Age</span><b>{s.equipmentAge || "-"}</b></div>
          <div className="kv"><span>Instructions</span><b>{s.specialInstructions || "-"}</b></div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Photos</h3>
        {photos.length === 0 ? (
          <div>No photos</div>
        ) : (
          <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px,1fr))", gap:10}}>
            {photos.map((m, i) => {
              const url = m.url || m.secure_url || m;
              return <img key={i} src={url} alt={`media-${i}`} style={{width:"100%", height:140, objectFit:"cover", borderRadius:8, border:"1px solid #eaecef"}}/>;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ v }) {
  const text = v || "–";
  const color =
    /complete/i.test(text) ? "#16a34a" :
    /approve|schedul/i.test(text) ? "#2563eb" :
    /decline|cancel/i.test(text) ? "#b91c1c" : "#6b7280";
  return (
    <span style={{
      marginLeft:8, fontSize:12, padding:"3px 8px", borderRadius:999,
      color:"#fff", background:color
    }}>{text}</span>
  );
}
