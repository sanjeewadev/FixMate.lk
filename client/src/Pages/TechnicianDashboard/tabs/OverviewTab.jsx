import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import {
  CheckCircle2,
  ClipboardList,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Wrench,
} from "lucide-react";

import api from "../../../lib/api";
import "./ApprovedTab.css";

const fmt = (value) => {
  if (!value) return "—";

  try {
    return format(new Date(value), "PPpp");
  } catch {
    return "—";
  }
};

function EmptyRow({ colSpan = 3, text = "No data available" }) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <div className="fm-tech-tabs__empty isCompact">
          <span>{text}</span>
        </div>
      </td>
    </tr>
  );
}

export default function OverviewTab() {
  const [assigned, setAssigned] = useState([]);
  const [pending, setPending] = useState([]);
  const [approved, setApproved] = useState([]);
  const [completed, setCompleted] = useState([]);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");

      const [assignedRes, pendingRes, approvedRes, completedRes] =
        await Promise.all([
          api.get("/api/technician/bookings/available"),
          api.get("/api/technician/bookings/mine?status=awaiting_coordinator"),
          api.get("/api/technician/bookings/mine?status=coordinator_approved"),
          api.get("/api/technician/bookings/mine?status=completed"),
        ]);

      setAssigned(Array.isArray(assignedRes.data) ? assignedRes.data : []);
      setPending(Array.isArray(pendingRes.data) ? pendingRes.data : []);
      setApproved(Array.isArray(approvedRes.data) ? approvedRes.data : []);
      setCompleted(Array.isArray(completedRes.data) ? completedRes.data : []);
    } catch (error) {
      setAssigned([]);
      setPending([]);
      setApproved([]);
      setCompleted([]);

      setErr(
        error?.response?.data?.message || "Failed to load technician overview.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const totalCount = useMemo(
    () => assigned.length + pending.length + approved.length + completed.length,
    [assigned, pending, approved, completed],
  );

  const recent = useMemo(() => {
    return [...assigned, ...pending, ...approved, ...completed]
      .filter(Boolean)
      .slice(0, 5);
  }, [assigned, pending, approved, completed]);

  return (
    <section className="fm-tech-tabs">
      <div className="fm-tech-tabs__header">
        <div>
          <span className="fm-tech-tabs__eyebrow">Technician Workspace</span>
          <h1>Overview</h1>
          <p>
            Review your current work queue, requests waiting for coordinator
            approval, approved jobs, and recently completed work.
          </p>
        </div>

        <button
          type="button"
          className="fm-tech-tabs__btn fm-tech-tabs__btn--outline"
          onClick={loadAll}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {err ? (
        <div className="fm-tech-tabs__notice fm-tech-tabs__notice--error">
          {err}
        </div>
      ) : null}

      <div className="fm-tech-tabs__summaryGrid">
        <article className="fm-tech-tabs__summaryCard">
          <span>
            <ClipboardList size={17} />
          </span>
          <div>
            <strong>{totalCount}</strong>
            <p>Total records</p>
          </div>
        </article>

        <article className="fm-tech-tabs__summaryCard">
          <span>
            <Wrench size={17} />
          </span>
          <div>
            <strong>{assigned.length}</strong>
            <p>Available tasks</p>
          </div>
        </article>

        <article className="fm-tech-tabs__summaryCard">
          <span>
            <Clock3 size={17} />
          </span>
          <div>
            <strong>{pending.length}</strong>
            <p>Pending approval</p>
          </div>
        </article>

        <article className="fm-tech-tabs__summaryCard">
          <span>
            <ShieldCheck size={17} />
          </span>
          <div>
            <strong>{approved.length}</strong>
            <p>Approved jobs</p>
          </div>
        </article>

        <article className="fm-tech-tabs__summaryCard">
          <span>
            <CheckCircle2 size={17} />
          </span>
          <div>
            <strong>{completed.length}</strong>
            <p>Completed</p>
          </div>
        </article>
      </div>

      <section className="fm-tech-tabs__card">
        <div className="fm-tech-tabs__cardHeader">
          <div>
            <span>Recent activity</span>
            <h2>Recent Bookings</h2>
          </div>
        </div>

        <div className="fm-tech-tabs__tableWrap">
          <table className="fm-tech-tabs__table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Problem</th>
                <th>Preferred Date</th>
              </tr>
            </thead>

            <tbody>
              {recent.length === 0 ? (
                <EmptyRow />
              ) : (
                recent.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.service?.name || "—"}</td>
                    <td>
                      <div className="fm-tech-tabs__titleCell">
                        <strong>{booking.problemTitle || "—"}</strong>
                        <small>{booking._id}</small>
                      </div>
                    </td>
                    <td>{fmt(booking.preferredAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
