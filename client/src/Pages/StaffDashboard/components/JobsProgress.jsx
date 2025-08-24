import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../lib/api";
import "./JobsProgress.css";

const TABS = [
  { key: "coordinator_approved", label: "Assigned" },
  { key: "in_progress",          label: "In Progress" },
  { key: "completed",            label: "Completed" },
];

function fmtDate(v) {
  if (!v) return "—";
  try { return new Date(v).toLocaleString(); } catch { return String(v); }
}
function fmtMoney(n) {
  const val = Number(n || 0);
  return new Intl.NumberFormat("en-LK", { style: "currency", currency: "LKR", maximumFractionDigits: 0 }).format(val);
}

function StatusChip({ status }) {
  const map = {
    coordinator_approved: { text: "Assigned",  cls: "chip assigned" },
    in_progress:          { text: "In Progress", cls: "chip progress" },
    completed:            { text: "Completed", cls: "chip done" },
    awaiting_coordinator: { text: "Awaiting", cls: "chip wait" },
    pending:              { text: "New", cls: "chip new" },
    cancelled:            { text: "Cancelled", cls: "chip cancel" },
  };
  const m = map[status] || { text: status || "—", cls: "chip" };
  return <span className={m.cls}>{m.text}</span>;
}

function Timeline({ b }) {
  const steps = [
    { k: "techOnTheWayAt", label: "On the way" },
    { k: "techArrivedAt",  label: "Arrived" },
    { k: "workStartedAt",  label: "Started work" },
    { k: "workCompletedAt",label: "Completed" },
  ];
  return (
    <div className="timeline">
      {steps.map(({k,label}, i) => {
        const has = Boolean(b?.[k]);
        return (
          <div key={k} className={`tl-step ${has ? "done" : ""}`}>
            <div className="tl-dot" />
            <div className="tl-body">
              <div className="tl-label">{label}</div>
              <div className="tl-date tiny muted">{fmtDate(b?.[k])}</div>
            </div>
            {i < steps.length-1 && <div className="tl-line" />}
          </div>
        );
      })}
    </div>
  );
}

export default function JobsProgress() {
  const [tab, setTab] = useState("coordinator_approved");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);   // used only to disable Refresh button
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(null);      // booking object when details open
  const [openLoading, setOpenLoading] = useState(false);

  const [ready, setReady] = useState(false);   // first fetch done?
  const pollRef = useRef(null);

  // Load list (silent by default; pass { silent:false } to show button loading state only)
  async function load(opts = { silent: true }) {
    const silent = opts?.silent ?? true;
    if (!silent) setLoading(true);
    setErr("");
    try {
      const { data } = await api.get("/api/coordinator/bookings", { params: { status: tab } });
      setItems(Array.isArray(data) ? data : (data?.items || []));
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load jobs");
      setItems([]);
    } finally {
      if (!silent) setLoading(false);
      setReady(true);
    }
  }

  // Initial load (silent)
  useEffect(() => { load({ silent: true }); }, []); // mount

  // Reload silently on tab change
  useEffect(() => { load({ silent: true }); }, [tab]);

  // Background polling (silent)
  useEffect(() => {
    // refresh every 5s; reset when tab changes
    pollRef.current = setInterval(() => load({ silent: true }), 5000);
    return () => clearInterval(pollRef.current);
  }, [tab]);

  async function openDetails(id) {
    setOpenLoading(true);
    try {
      const { data } = await api.get(`/api/bookings/${id}`);
      setOpen(data);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to load booking");
    } finally {
      setOpenLoading(false);
    }
  }

  const rows = useMemo(() => {
    return (items || []).map(b => ({
      id: b._id,
      title: b.problemTitle || "—",
      service: b?.service?.name || "—",
      assignedTech: b?.assignedTechnician?.full_name || "—",
      district: b?.customerSnapshot?.district || "—",
      created: b.createdAt,
      status: b.status,
      acceptedCount: Number(b.acceptedCount || 0),
    }));
  }, [items]);

  return (
    <div className="jobs-page">
      <div className="page-header">
        <h2>Jobs and Progress</h2>
        <div className="muted tiny">Track assigned work, live status, expenses, and payments.</div>
      </div>

      <div className="tabs">
        {TABS.map(t => (
          <button key={t.key}
                  className={`tab ${tab===t.key ? "active": ""}`}
                  onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
        <div className="tabs-spacer" />
        <button className="btn small" onClick={() => load({ silent: false })} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {err && <div className="msg error">{err}</div>}
      <div className="table-wrapper">
        <table className="styled-table">
          <thead>
            <tr>
              <th style={{minWidth:220}}>Title</th>
              <th>Service</th>
              <th>District</th>
              <th>Technician</th>
              <th>Status</th>
              <th className="hide-sm">Accepted Techs</th>
              <th className="hide-sm">Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {!ready ? (
              // First render: stay silent (no loading text)
              <tr><td colSpan={8} style={{ padding: 12 }} /></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 16 }}>No records.</td></tr>
            ) : rows.map(r => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{r.service}</td>
                <td>{r.district}</td>
                <td>{r.assignedTech}</td>
                <td><StatusChip status={r.status} /></td>
                <td className="hide-sm">{r.acceptedCount}</td>
                <td className="hide-sm">{fmtDate(r.created)}</td>
                <td>
                  <button className="btn view" onClick={() => openDetails(r.id)}>View</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Drawer / Modal */}
      {open && (
        <div className="jp-overlay" onClick={() => setOpen(null)} role="dialog" aria-modal="true">
          <div className="jp-drawer" onClick={e => e.stopPropagation()}>
            <div className="jp-head">
              <div className="title">
                <div className="tiny muted">Booking</div>
                <h3>{open.problemTitle || "Request"}</h3>
              </div>
              <div className="right">
                <StatusChip status={open.status} />
                <button className="btn close" onClick={() => setOpen(null)}>Close</button>
              </div>
            </div>

            {openLoading ? (
              <div className="pad" />
            ) : (
              <div className="jp-content">
                {/* Left column: timeline + notes */}
                <div className="jp-col">
                  <div className="card">
                    <div className="card-title">Timeline</div>
                    <Timeline b={open} />
                  </div>

                  <div className="card">
                    <div className="card-title">Notes</div>
                    <div className="mono small">{open?.notes ? open.notes : <span className="muted">No notes yet.</span>}</div>
                  </div>
                </div>

                {/* Right column: details + expenses + payment */}
                <div className="jp-col">
                  <div className="card">
                    <div className="card-title">Details</div>
                    <div className="kv">
                      <div><span>Service</span><b>{open?.service?.name || "—"}</b></div>
                      <div><span>Category</span><b>{open?.service?.category || "—"}</b></div>
                      <div><span>District</span><b>{open?.customerSnapshot?.district || "—"}</b></div>
                      <div><span>Address</span><b>{open?.customerSnapshot?.address || "—"}</b></div>
                      <div><span>Preferred</span><b>{fmtDate(open?.preferredAt)} {open?.timeSlot ? `(${open.timeSlot})` : ""}</b></div>
                      <div><span>Assigned Tech</span><b>{open?.assignedTechnician?.full_name || "—"}</b></div>
                    </div>
                    {Array.isArray(open?.media) && open.media.length > 0 && (
                      <>
                        <div className="card-sub">Customer Photos</div>
                        <div className="thumbs">
                          {open.media.map((m,i) => (
                            <a key={i} href={m.url} target="_blank" rel="noreferrer">
                              <img
                                src={m.url}
                                alt={`media-${i}`}
                                onError={(e)=>{ e.currentTarget.src="/fallback-image.png"; e.currentTarget.onerror=null; }}
                              />
                            </a>
                          ))}
                        </div>
                      </>
                    )}
                  </div>

                  {open?.assignedTechnician && (
                    <div className="card">
                      <div className="card-title">Technician</div>
                      <div className="tech-box">
                        <img
                          src={open.assignedTechnician.profile_image_url || "/default-profile.png"}
                          alt="Technician"
                          onError={(e)=>{ e.currentTarget.src="/default-profile.png"; e.currentTarget.onerror=null; }}
                        />
                        <div className="tech-meta">
                          <div className="tech-name">{open.assignedTechnician.full_name || "—"}</div>
                          <div className="tiny muted">
                            {open.assignedTechnician.email || "—"} · {open.assignedTechnician.phone_number || "—"}
                          </div>
                          <div className="tiny muted">
                            District: {open.assignedTechnician.district || "—"} · {open.assignedTechnician.experience_years || 0} yrs exp
                          </div>
                          <div className="chips">
                            {(Array.isArray(open.assignedTechnician.specialization) ? open.assignedTechnician.specialization : [])
                              .map((s, i) => {
                                const label = typeof s === "object" ? (s.name || s.code || s.category || s.slug) : String(s);
                                return <span key={i} className="chip2">{label}</span>;
                              })}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="card">
                    <div className="card-title">Expenses</div>
                    {Array.isArray(open?.expenses) && open.expenses.length > 0 ? (
                      <table className="mini-table">
                        <thead><tr><th>Label</th><th style={{width:120}}>Amount</th><th>Attachments</th></tr></thead>
                        <tbody>
                          {open.expenses.map((e,i)=>(
                            <tr key={i}>
                              <td>{e.label}</td>
                              <td>{fmtMoney(e.amount)}</td>
                              <td>
                                {(e.attachments||[]).map((a,ix)=>(
                                  <a key={ix} href={a.url} target="_blank" rel="noreferrer" className="tiny link">view</a>
                                ))}
                                {(e.attachments||[]).length===0 && <span className="tiny muted">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : <div className="muted tiny">No expenses recorded.</div>}
                  </div>

                  <div className="card">
                    <div className="card-title">Payment</div>
                    {open?.payment ? (
                      <div className="kv">
                        <div><span>Method</span><b>{open.payment.method?.toUpperCase?.() || "—"}</b></div>
                        <div><span>Service Charge</span><b>{fmtMoney(open.payment.serviceCharge)}</b></div>
                        <div><span>Expenses Total</span><b>{fmtMoney(open.payment.expensesTotal)}</b></div>
                        <div><span>Grand Total</span><b className="big">{fmtMoney(open.payment.grandTotal)}</b></div>
                        <div><span>Currency</span><b>{open.payment.currency || "LKR"}</b></div>
                        <div><span>Confirmed</span><b>{fmtDate(open.payment.confirmedByTechnicianAt)}</b></div>
                        <div><span>Receipt #</span><b>{open.payment.receiptNumber || "—"}</b></div>
                      </div>
                    ) : (
                      <div className="muted tiny">No payment yet. (Visible when technician completes & confirms.)</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
