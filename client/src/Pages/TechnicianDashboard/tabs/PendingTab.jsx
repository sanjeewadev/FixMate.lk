// src/Pages/Technician/tabs/PendingTab.jsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../../../lib/api";

export default function PendingTab() {
  const [pending, setPending] = useState([]);

  const fmt = (d) => (d ? format(new Date(d), "PPpp") : "-");

  const loadPending = async () => {
    try {
      const res = await api.get("/api/technician/bookings/mine?status=awaiting_coordinator");
      setPending(res.data || []);
    } catch { setPending([]); }
  };

  useEffect(() => { loadPending(); }, []);

  return (
    <>
      <h2>Pending Coordinator Approval</h2>

      <table className="tech-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Problem</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {pending.length === 0 ? (
            <tr><td colSpan={3}>No data available</td></tr>
          ) : pending.map((b) => (
            <tr key={b._id}>
              <td>{b.service?.name}</td>
              <td>{b.problemTitle}</td>
              <td>{fmt(b.preferredAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
