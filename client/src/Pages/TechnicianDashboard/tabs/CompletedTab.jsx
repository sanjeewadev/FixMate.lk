// src/Pages/Technician/tabs/CompletedTab.jsx
import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import api from "../../../lib/api";

export default function CompletedTab() {
  const [completed, setCompleted] = useState([]);

  const fmt = (d) => (d ? format(new Date(d), "PPpp") : "-");

  const loadCompleted = async () => {
    try {
      const res = await api.get("/api/technician/bookings/mine?status=completed");
      setCompleted(res.data || []);
    } catch { setCompleted([]); }
  };

  useEffect(() => { loadCompleted(); }, []);

  return (
    <>
      <h2>Completed Requests</h2>

      <table className="tech-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Problem</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {completed.length === 0 ? (
            <tr><td colSpan={3}>No data available</td></tr>
          ) : completed.map((b) => (
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
