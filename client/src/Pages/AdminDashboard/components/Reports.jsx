import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  BarChart3,
  CalendarDays,
  ClipboardList,
  CreditCard,
  RefreshCw,
  TrendingUp,
  Trophy,
  WalletCards,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../lib/api";
import "./Reports.css";

function num(value) {
  if (value == null || value === "") return "0";

  const numberValue = Number(value);

  if (Number.isNaN(numberValue)) return "0";

  return numberValue.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
}

function useQueryParams({ from, to, commissionRate, limit }) {
  return useMemo(() => {
    const params = new URLSearchParams();

    if (from) params.set("from", from);
    if (to) params.set("to", to);

    if (commissionRate !== "" && commissionRate != null) {
      params.set("commissionRate", commissionRate);
    }

    if (limit) params.set("limit", String(limit));

    const queryString = params.toString();

    return queryString ? `?${queryString}` : "";
  }, [from, to, commissionRate, limit]);
}

function Sparkline({ points = [], height = 48, padding = 4, strokeWidth = 2 }) {
  if (!points.length) {
    return <div className="fm-admin-reports__sparkEmpty" style={{ height }} />;
  }

  const max = Math.max(...points.map((point) => point.y), 1);
  const min = Math.min(...points.map((point) => point.y), 0);
  const range = Math.max(max - min, 1);
  const width = Math.max(points.length * 24, 120);

  const sx = (index) =>
    padding + (index * (width - padding * 2)) / Math.max(points.length - 1, 1);

  const sy = (value) =>
    padding + (height - padding * 2) * (1 - (value - min) / range);

  const path = points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${sx(index)} ${sy(point.y)}`,
    )
    .join(" ");

  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true">
      <path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

export default function Reports() {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";

  const today = new Date().toISOString().slice(0, 10);
  const startOfYear = new Date(new Date().getFullYear(), 0, 1)
    .toISOString()
    .slice(0, 10);

  const [from, setFrom] = useState(startOfYear);
  const [to, setTo] = useState(today);
  const [commissionRate, setCommissionRate] = useState("");
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

  const queryString = useQueryParams({
    from,
    to,
    commissionRate,
    limit,
  });

  async function loadAll() {
    try {
      setErr(null);
      setLoading(true);

      const [
        summaryResponse,
        servicesResponse,
        districtsResponse,
        techniciansResponse,
        highestResponse,
        dailyResponse,
        monthlyResponse,
      ] = await Promise.all([
        api.get(`/api/reports/payments/summary${queryString}`),
        api.get(`/api/reports/payments/top-services${queryString}`),
        api.get(`/api/reports/payments/top-districts${queryString}`),
        api.get(`/api/reports/payments/top-technicians${queryString}`),
        api.get(`/api/reports/payments/highest-booking${queryString}`),
        api.get(`/api/reports/payments/daily${queryString}`),
        api.get(`/api/reports/payments/monthly${queryString}`),
      ]);

      setSummary(summaryResponse.data || null);
      setTopServices(servicesResponse.data?.items || []);
      setTopDistricts(districtsResponse.data?.items || []);
      setTopTechnicians(techniciansResponse.data?.items || []);
      setHighest(highestResponse.data || null);
      setDaily(dailyResponse.data?.items || []);
      setMonthly(monthlyResponse.data?.items || []);
    } catch (error) {
      setErr(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to load reports.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  if (!isAdmin) {
    return (
      <div className="fm-admin-reports__notice fm-admin-reports__notice--error">
        You are not authorized to view Reports.
      </div>
    );
  }

  return (
    <section className="fm-admin-reports">
      <div className="fm-admin-reports__header">
        <div>
          <span className="fm-admin-reports__eyebrow">Finance Reports</span>
          <h1>Finance Reports</h1>
          <p>
            Review completed bookings, payment totals, platform service charges,
            revenue performance, and technician/service contribution.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-reports__btn fm-admin-reports__btn--outline"
          onClick={loadAll}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <section className="fm-admin-reports__card">
        <div className="fm-admin-reports__cardHeader">
          <div>
            <span>Report filters</span>
            <h2>Selected Period</h2>
          </div>
        </div>

        <div className="fm-admin-reports__filters">
          <div className="fm-admin-reports__field">
            <label htmlFor="fm-report-from">From</label>
            <input
              id="fm-report-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
            />
          </div>

          <div className="fm-admin-reports__field">
            <label htmlFor="fm-report-to">To</label>
            <input
              id="fm-report-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
            />
          </div>

          <div className="fm-admin-reports__field">
            <label htmlFor="fm-report-commission">Commission Rate</label>
            <input
              id="fm-report-commission"
              type="number"
              step="0.01"
              min="0"
              max="1"
              placeholder="Optional, 0 to 1"
              value={commissionRate}
              onChange={(event) => setCommissionRate(event.target.value)}
            />
            <small>Empty value uses serviceCharge as profit.</small>
          </div>

          <div className="fm-admin-reports__field">
            <label htmlFor="fm-report-limit">Top N</label>
            <input
              id="fm-report-limit"
              type="number"
              min="1"
              max="100"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value || 10))}
            />
          </div>
        </div>
      </section>

      {err ? (
        <div className="fm-admin-reports__notice fm-admin-reports__notice--error">
          {err}
        </div>
      ) : null}

      <div className="fm-admin-reports__summaryGrid">
        <article className="fm-admin-reports__summaryCard">
          <span>
            <BadgeDollarSign size={17} />
          </span>
          <div>
            <strong>LKR {num(summary?.totalRevenue)}</strong>
            <p>Total revenue</p>
          </div>
        </article>

        <article className="fm-admin-reports__summaryCard">
          <span>
            <CreditCard size={17} />
          </span>
          <div>
            <strong>LKR {num(summary?.totalExpenses)}</strong>
            <p>Total expenses</p>
          </div>
        </article>

        <article className="fm-admin-reports__summaryCard">
          <span>
            <WalletCards size={17} />
          </span>
          <div>
            <strong>LKR {num(summary?.totalServiceCharge)}</strong>
            <p>Service charges</p>
          </div>
        </article>

        <article className="fm-admin-reports__summaryCard">
          <span>
            <TrendingUp size={17} />
          </span>
          <div>
            <strong>LKR {num(summary?.totalProfit)}</strong>
            <p>Projected profit</p>
          </div>
        </article>

        <article className="fm-admin-reports__summaryCard">
          <span>
            <ClipboardList size={17} />
          </span>
          <div>
            <strong>{num(summary?.count)}</strong>
            <p>Completed bookings</p>
          </div>
        </article>
      </div>

      <section className="fm-admin-reports__gridTwo">
        <article className="fm-admin-reports__card">
          <div className="fm-admin-reports__cardHeader">
            <div>
              <span>Highest booking</span>
              <h2>Highest Grossing Booking</h2>
            </div>

            <Trophy size={18} />
          </div>

          {highest ? (
            <div className="fm-admin-reports__highest">
              <div>
                <strong>Booking ID</strong>
                <span>{highest._id || "—"}</span>
              </div>

              <div>
                <strong>Service</strong>
                <span>
                  {highest.serviceName || "—"}{" "}
                  {highest.serviceCode ? `(${highest.serviceCode})` : ""}
                </span>
              </div>

              <div>
                <strong>Technician</strong>
                <span>{highest.technicianName || "—"}</span>
              </div>

              <div>
                <strong>Customer District</strong>
                <span>{highest.customerDistrict || "—"}</span>
              </div>

              <div>
                <strong>Work Completed</strong>
                <span>
                  {highest.workCompletedAt
                    ? new Date(highest.workCompletedAt).toLocaleString()
                    : "—"}
                </span>
              </div>

              <div className="fm-admin-reports__highestTotal">
                <strong>Grand Total</strong>
                <span>LKR {num(highest.payment?.grandTotal)}</span>
              </div>
            </div>
          ) : (
            <div className="fm-admin-reports__empty">
              No data for the selected period.
            </div>
          )}
        </article>

        <article className="fm-admin-reports__card">
          <div className="fm-admin-reports__cardHeader">
            <div>
              <span>Revenue trend</span>
              <h2>Monthly Revenue Trend</h2>
            </div>

            <BarChart3 size={18} />
          </div>

          <div className="fm-admin-reports__chart">
            <Sparkline
              points={monthly.map((item) => ({
                x: item.yearMonth,
                y: item.revenue || 0,
              }))}
            />
          </div>

          <div className="fm-admin-reports__chartLabels">
            {monthly.map((item) => item.yearMonth).join(" · ") ||
              "No monthly data"}
          </div>
        </article>
      </section>

      <section className="fm-admin-reports__section">
        <div className="fm-admin-reports__sectionHeader">
          <div>
            <span>By revenue</span>
            <h2>Top Services</h2>
          </div>
        </div>

        <div className="fm-admin-reports__tableWrap">
          <table className="fm-admin-reports__table">
            <thead>
              <tr>
                <th>#</th>
                <th>Service</th>
                <th>Count</th>
                <th>Revenue</th>
                <th>Expenses</th>
                <th>Service Charges</th>
                <th>Profit</th>
              </tr>
            </thead>

            <tbody>
              {topServices.length ? (
                topServices.map((row, index) => (
                  <tr key={row.serviceId || index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{row.serviceName || "—"}</strong>
                      {row.serviceCode ? (
                        <small>{row.serviceCode}</small>
                      ) : null}
                    </td>
                    <td>{num(row.count)}</td>
                    <td>{num(row.revenue)}</td>
                    <td>{num(row.expenses)}</td>
                    <td>{num(row.serviceCharge)}</td>
                    <td>
                      <strong>{num(row.profit)}</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7">No data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fm-admin-reports__section">
        <div className="fm-admin-reports__sectionHeader">
          <div>
            <span>By revenue</span>
            <h2>Top Districts</h2>
          </div>
        </div>

        <div className="fm-admin-reports__tableWrap">
          <table className="fm-admin-reports__table">
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
              {topDistricts.length ? (
                topDistricts.map((row, index) => (
                  <tr key={row.district || index}>
                    <td>{index + 1}</td>
                    <td>{row.district || "—"}</td>
                    <td>{num(row.count)}</td>
                    <td>{num(row.revenue)}</td>
                    <td>
                      <strong>{num(row.profit)}</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fm-admin-reports__section">
        <div className="fm-admin-reports__sectionHeader">
          <div>
            <span>By revenue</span>
            <h2>Top Technicians</h2>
          </div>
        </div>

        <div className="fm-admin-reports__tableWrap">
          <table className="fm-admin-reports__table">
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
              {topTechnicians.length ? (
                topTechnicians.map((row, index) => (
                  <tr key={row.technicianId || index}>
                    <td>{index + 1}</td>
                    <td>
                      <strong>{row.technicianName || "—"}</strong>
                      {row.technicianEmail ? (
                        <small>{row.technicianEmail}</small>
                      ) : null}
                      {row.technicianPhone ? (
                        <small>{row.technicianPhone}</small>
                      ) : null}
                    </td>
                    <td>{num(row.count)}</td>
                    <td>{num(row.revenue)}</td>
                    <td>
                      <strong>{num(row.profit)}</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fm-admin-reports__section">
        <div className="fm-admin-reports__sectionHeader">
          <div>
            <span>Daily performance</span>
            <h2>Daily Revenue</h2>
          </div>

          <CalendarDays size={18} />
        </div>

        <div className="fm-admin-reports__tableWrap">
          <table className="fm-admin-reports__table">
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
              {daily.length ? (
                daily.map((row) => (
                  <tr key={row.date}>
                    <td>{row.date}</td>
                    <td>{num(row.revenue)}</td>
                    <td>{num(row.expenses)}</td>
                    <td>
                      <strong>{num(row.profit)}</strong>
                    </td>
                    <td>{num(row.count)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="fm-admin-reports__section">
        <div className="fm-admin-reports__sectionHeader">
          <div>
            <span>Monthly performance</span>
            <h2>Monthly Revenue</h2>
          </div>
        </div>

        <div className="fm-admin-reports__tableWrap">
          <table className="fm-admin-reports__table">
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
              {monthly.length ? (
                monthly.map((row) => (
                  <tr key={row.yearMonth}>
                    <td>{row.yearMonth}</td>
                    <td>{num(row.revenue)}</td>
                    <td>{num(row.expenses)}</td>
                    <td>
                      <strong>{num(row.profit)}</strong>
                    </td>
                    <td>{num(row.count)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No data.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
