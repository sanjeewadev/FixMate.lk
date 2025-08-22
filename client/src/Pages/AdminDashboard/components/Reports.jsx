// src/Pages/AdminDashboard/components/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../lib/api";
import "./Reports.css"; 

function num(n) {
  if (n == null) return "0";
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function useQueryParams({ from, to, commissionRate, limit }) {
  return useMemo(() => {
    const p = new URLSearchParams();
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    if (commissionRate !== "" && commissionRate != null) p.set("commissionRate", commissionRate);
    if (limit) p.set("limit", String(limit));
    const s = p.toString();
    return s ? `?${s}` : "";
  }, [from, to, commissionRate, limit]);
}

function Sparkline({ points = [], height = 48, padding = 4, strokeWidth = 2 }) {
  if (!points.length) return <div style={{ height }} />;
  const max = Math.max(...points.map(p => p.y), 1);
  const min = Math.min(...points.map(p => p.y), 0);
  const range = Math.max(max - min, 1);
  const w = Math.max(points.length * 24, 120);
  const scaleX = (i) => padding + (i * (w - padding * 2)) / Math.max(points.length - 1, 1);
  const scaleY = (v) => padding + (height - padding * 2) * (1 - (v - min) / range);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(p.y)}`).join(" ");
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none">
      <path d={d} fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
    </svg>
  );
}

export default function Reports() {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";

  const today = new Date().toISOString().slice(0, 10);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 10);

  const [from, setFrom] = useState(startOfYear);
  const [to, setTo] = useState(today);
  const [commissionRate, setCommissionRate] = useState(""); // empty = serviceCharge basis
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [summary, setSummary] = useState(null);
  const [topServices, setTopServices] = useState([]);
  const [topDistricts, setTopDistricts] = useState([]);
  const [topTechnicians, setTopTechnicians] = useState([]);
  const [highest, setHighest] = useState(null);
  const [daily, setDaily] = useState([]);
  const [monthly, setMonthly] = useState([]);

  const qs = useQueryParams({ from, to, commissionRate, limit });

  async function loadAll() {
    try {
      setErr(null);
      setLoading(true);

      const [
        sumRes,
        svcRes,
        distRes,
        techRes,
        highRes,
        dailyRes,
        monthlyRes
      ] = await Promise.all([
        api.get(`/api/reports/payments/summary${qs}`),
        api.get(`/api/reports/payments/top-services${qs}`),
        api.get(`/api/reports/payments/top-districts${qs}`),
        api.get(`/api/reports/payments/top-technicians${qs}`),
        api.get(`/api/reports/payments/highest-booking${qs}`),
        api.get(`/api/reports/payments/daily${qs}`),
        api.get(`/api/reports/payments/monthly${qs}`)
      ]);

      setSummary(sumRes.data || null);
      setTopServices(svcRes.data?.items || []);
      setTopDistricts(distRes.data?.items || []);
      setTopTechnicians(techRes.data?.items || []);
      setHighest(highRes.data || null);
      setDaily(dailyRes.data?.items || []);
      setMonthly(monthlyRes.data?.items || []);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qs]);

  if (!isAdmin) {
    return <div className="msg error">You are not authorized to view Reports.</div>;
  }

  return (
    <div className="reports-page">
      <div className="page-header">
        <h2>Finance Reports</h2>
        <div className="muted">Completed bookings with payments (confirmed by technician).</div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter">
          <label>From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="filter">
          <label>To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="filter">
          <label>Commission Rate</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            placeholder="(optional, 0..1)"
            value={commissionRate}
            onChange={(e) => setCommissionRate(e.target.value)}
          />
          <div className="hint">Empty = use serviceCharge as profit</div>
        </div>
        <div className="filter">
          <label>Top N</label>
          <input
            type="number"
            min="1"
            max="100"
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value || 10))}
          />
        </div>
        <div className="filter actions">
          <button className="btn btn-primary" onClick={loadAll} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {err && <div className="error">{err}</div>}

      {/* KPIs */}
      <div className="kpi-grid">
        <div className="metric-card">
          <h4>Total Revenue</h4>
          <div className="metric">LKR {num(summary?.totalRevenue)}</div>
        </div>
        <div className="metric-card">
          <h4>Total Expenses</h4>
          <div className="metric">LKR {num(summary?.totalExpenses)}</div>
        </div>
        <div className="metric-card">
          <h4>Service Charges</h4>
          <div className="metric">LKR {num(summary?.totalServiceCharge)}</div>
        </div>
        <div className="metric-card">
          <h4>Projected Profit</h4>
          <div className="metric">LKR {num(summary?.totalProfit)}</div>
        </div>
        <div className="metric-card">
          <h4>Completed Bookings</h4>
          <div className="metric">{num(summary?.count)}</div>
        </div>
      </div>

      {/* Highest booking */}
      <div className="card-grid" style={{ marginTop: 16 }}>
        <div className="metric-card" style={{ alignItems: "flex-start" }}>
          <h4>Highest Grossing Booking</h4>
          {highest ? (
            <div className="highest-wrap">
              <div><b>Booking ID:</b> {highest._id}</div>
              <div><b>Service:</b> {highest.serviceName || "-"} ({highest.serviceCode || "—"})</div>
              <div><b>Technician:</b> {highest.technicianName || "-"}</div>
              <div><b>Customer District:</b> {highest.customerDistrict || "-"}</div>
              <div><b>Work Completed:</b> {highest.workCompletedAt ? new Date(highest.workCompletedAt).toLocaleString() : "-"}</div>
              <div style={{ marginTop: 8 }}><b>Grand Total:</b> LKR {num(highest.payment?.grandTotal)}</div>
            </div>
          ) : (
            <div className="muted">No data for selected period.</div>
          )}
        </div>

        {/* Monthly sparkline */}
        <div className="metric-card chart-card">
          <h4>Monthly Revenue Trend</h4>
          <Sparkline
            points={monthly.map((m) => ({ x: m.yearMonth, y: m.revenue || 0 }))}
          />
          <div className="muted tiny">
            {monthly.map((m) => m.yearMonth).join(" · ")}
          </div>
        </div>
      </div>

      {/* Top Services */}
      <section className="report-section">
        <div className="section-head">
          <h3>Top Services</h3>
          <div className="muted">Sorted by Revenue</div>
        </div>
        <div className="table-wrapper">
          <table className="styled-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Service</th>
                <th>Count</th>
                <th>Revenue (LKR)</th>
                <th>Expenses (LKR)</th>
                <th>Service Charges (LKR)</th>
                <th>Profit (LKR)</th>
              </tr>
            </thead>
            <tbody>
              {topServices.length ? topServices.map((r, i) => (
                <tr key={r.serviceId || i}>
                  <td>{i + 1}</td>
                  <td>{r.serviceName || "-"} {r.serviceCode ? <span className="muted">({r.serviceCode})</span> : null}</td>
                  <td>{num(r.count)}</td>
                  <td>{num(r.revenue)}</td>
                  <td>{num(r.expenses)}</td>
                  <td>{num(r.serviceCharge)}</td>
                  <td><b>{num(r.profit)}</b></td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="muted">No data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Top Districts & Technicians (side by side) */}
      <div className="two-col">
        <section className="report-section">
          <div className="section-head">
            <h3>Top Districts</h3>
            <div className="muted">By Revenue</div>
          </div>
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>District</th>
                  <th>Count</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {topDistricts.length ? topDistricts.map((r, i) => (
                  <tr key={r.district || i}>
                    <td>{i + 1}</td>
                    <td>{r.district || "-"}</td>
                    <td>{num(r.count)}</td>
                    <td>{num(r.revenue)}</td>
                    <td><b>{num(r.profit)}</b></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="muted">No data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="report-section">
          <div className="section-head">
            <h3>Top Technicians</h3>
            <div className="muted">By Revenue</div>
          </div>
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Technician</th>
                  <th>Count</th>
                  <th>Revenue</th>
                  <th>Profit</th>
                </tr>
              </thead>
              <tbody>
                {topTechnicians.length ? topTechnicians.map((r, i) => (
                  <tr key={r.technicianId || i}>
                    <td>{i + 1}</td>
                    <td>
                      {r.technicianName || "-"}
                      {r.technicianEmail ? <div className="tiny muted">{r.technicianEmail}</div> : null}
                      {r.technicianPhone ? <div className="tiny muted">{r.technicianPhone}</div> : null}
                    </td>
                    <td>{num(r.count)}</td>
                    <td>{num(r.revenue)}</td>
                    <td><b>{num(r.profit)}</b></td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="muted">No data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Time Series Tables */}
      <div className="two-col">
        <section className="report-section">
          <div className="section-head">
            <h3>Daily (Revenue)</h3>
            <div className="muted">Sum by day</div>
          </div>
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Profit</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {daily.length ? daily.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{num(d.revenue)}</td>
                    <td>{num(d.expenses)}</td>
                    <td><b>{num(d.profit)}</b></td>
                    <td>{num(d.count)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="muted">No data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="report-section">
          <div className="section-head">
            <h3>Monthly (Revenue)</h3>
            <div className="muted">Sum by month</div>
          </div>
          <div className="table-wrapper">
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Revenue</th>
                  <th>Expenses</th>
                  <th>Profit</th>
                  <th>Count</th>
                </tr>
              </thead>
              <tbody>
                {monthly.length ? monthly.map((m) => (
                  <tr key={m.yearMonth}>
                    <td>{m.yearMonth}</td>
                    <td>{num(m.revenue)}</td>
                    <td>{num(m.expenses)}</td>
                    <td><b>{num(m.profit)}</b></td>
                    <td>{num(m.count)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="5" className="muted">No data.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
