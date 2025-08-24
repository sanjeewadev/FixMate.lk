// src/Pages/Technician/tabs/OverviewTab.jsx
import React, { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import api from "../../../lib/api";

export default function OverviewTab() {
  const [assigned, setAssigned] = useState([]);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [completed, setCompleted] = useState([]);

  const fmt = (d) => (d ? format(new Date(d), "PPpp") : "-");

  const loadAll = async () => {
    try {
      const [a, p, ap, c] = await Promise.all([
        api.get("/api/technician/bookings/available"),
        api.get("/api/technician/bookings/mine?status=awaiting_coordinator"),
        api.get("/api/technician/bookings/mine?status=coordinator_approved"),
        api.get("/api/technician/bookings/mine?status=completed"),
      ]);
      setAssigned(a.data || []);
      setPending(p.data || []);
      setApproved(ap.data || []);
      setCompleted(c.data || []);
    } catch {
      setAssigned([]); setPending([]); setApproved([]); setCompleted([]);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const totalCount = useMemo(
    () => assigned.length + pending.length + approved.length + completed.length,
    [assigned, pending, approved, completed]
  );

  const recent = useMemo(
    () => [...assigned, ...pending, ...approved, ...completed].slice(0, 5),
    [assigned, pending, approved, completed]
  );

  const renderTable = (items, actions = false) => (
    <table className="tech-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Problem</th>
          <th>Date</th>
          {actions && <th>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr><td colSpan={actions ? 4 : 3}>No data available</td></tr>
        ) : items.map((b) => (
          <tr key={b._id}>
            <td>{b.service?.name}</td>
            <td>{b.problemTitle}</td>
            <td>{fmt(b.preferredAt)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <>
      <h2>Overview</h2>
      <div className="overview-cards">
        <div className="card">TOTAL <span>{totalCount}</span></div>
        <div className="card">PENDING <span>{pending.length}</span></div>
        <div className="card">APPROVED <span>{approved.length}</span></div>
        <div className="card">COMPLETED <span>{completed.length}</span></div>
      </div>

      <h3>Recent Bookings</h3>
      {renderTable(recent, false)}
    </>
  );
}
