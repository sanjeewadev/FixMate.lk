import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock,
  ClipboardList,
  Eye,
  MapPin,
  ReceiptText,
  RefreshCw,
  Route,
  Timer,
  UserRound,
  Wrench,
  X,
} from "lucide-react";

import api from "../../../lib/api";
import "./JobsProgress.css";

const TABS = [
  {
    key: "coordinator_approved",
    label: "Assigned",
  },
  {
    key: "in_progress",
    label: "In Progress",
  },
  {
    key: "completed",
    label: "Completed",
  },
];

function fmtDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function fmtMoney(value) {
  const numberValue = Number(value || 0);

  return new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(numberValue);
}

function normalizeSpecializations(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "object"
          ? item.name || item.code || item.category || item.slug
          : String(item),
      )
      .filter(Boolean);
  }

  if (typeof value === "string" && value.trim()) {
    return [value.trim()];
  }

  if (typeof value === "object" && value) {
    const label = value.name || value.code || value.category || value.slug;
    return label ? [label] : [];
  }

  return [];
}

function StatusChip({ status }) {
  const map = {
    coordinator_approved: {
      text: "Assigned",
      className: "isAssigned",
    },
    in_progress: {
      text: "In Progress",
      className: "isProgress",
    },
    completed: {
      text: "Completed",
      className: "isDone",
    },
    awaiting_coordinator: {
      text: "Awaiting",
      className: "isWait",
    },
    pending: {
      text: "New",
      className: "isNew",
    },
    cancelled: {
      text: "Cancelled",
      className: "isCancel",
    },
  };

  const item = map[status] || {
    text: status || "—",
    className: "",
  };

  return (
    <span className={`fm-staff-jobs__status ${item.className}`}>
      {item.text}
    </span>
  );
}

function Timeline({ booking }) {
  const steps = [
    {
      key: "techOnTheWayAt",
      label: "On the way",
    },
    {
      key: "techArrivedAt",
      label: "Arrived",
    },
    {
      key: "workStartedAt",
      label: "Started work",
    },
    {
      key: "workCompletedAt",
      label: "Completed",
    },
  ];

  return (
    <div className="fm-staff-jobs__timeline">
      {steps.map(({ key, label }, index) => {
        const isDone = Boolean(booking?.[key]);

        return (
          <div
            key={key}
            className={`fm-staff-jobs__timelineStep ${isDone ? "isDone" : ""}`}>
            <div className="fm-staff-jobs__timelineDot" />

            <div className="fm-staff-jobs__timelineBody">
              <strong>{label}</strong>
              <span>{fmtDate(booking?.[key])}</span>
            </div>

            {index < steps.length - 1 ? (
              <div className="fm-staff-jobs__timelineLine" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

export default function JobsProgress() {
  const [tab, setTab] = useState("coordinator_approved");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [open, setOpen] = useState(null);
  const [openLoading, setOpenLoading] = useState(false);

  const [ready, setReady] = useState(false);
  const pollRef = useRef(null);

  async function load(options = { silent: true }) {
    const silent = options?.silent ?? true;

    if (!silent) setLoading(true);

    setErr("");

    try {
      const { data } = await api.get("/api/coordinator/bookings", {
        params: {
          status: tab,
        },
      });

      setItems(Array.isArray(data) ? data : data?.items || []);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to load jobs.");
      setItems([]);
    } finally {
      if (!silent) setLoading(false);
      setReady(true);
    }
  }

  useEffect(() => {
    load({
      silent: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load({
      silent: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    pollRef.current = setInterval(
      () =>
        load({
          silent: true,
        }),
      5000,
    );

    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function openDetails(id) {
    setOpen({
      _id: id,
      problemTitle: "Loading booking...",
    });

    setOpenLoading(true);

    try {
      const { data } = await api.get(`/api/bookings/${id}`);
      setOpen(data);
    } catch (error) {
      setErr(error?.response?.data?.message || "Failed to load booking.");
      setOpen(null);
    } finally {
      setOpenLoading(false);
    }
  }

  const rows = useMemo(() => {
    return (items || []).map((booking) => ({
      id: booking._id,
      title: booking.problemTitle || "—",
      service: booking?.service?.name || "—",
      assignedTech: booking?.assignedTechnician?.full_name || "—",
      district: booking?.customerSnapshot?.district || "—",
      created: booking.createdAt,
      status: booking.status,
      acceptedCount: Number(booking.acceptedCount || 0),
    }));
  }, [items]);

  const stats = useMemo(() => {
    const acceptedTechs = items.reduce(
      (total, booking) => total + Number(booking.acceptedCount || 0),
      0,
    );

    const withTechnician = items.filter(
      (booking) => booking.assignedTechnician,
    ).length;

    const withPayment = items.filter((booking) => booking.payment).length;

    return {
      total: items.length,
      acceptedTechs,
      withTechnician,
      withPayment,
    };
  }, [items]);

  return (
    <section className="fm-staff-jobs">
      <div className="fm-staff-jobs__header">
        <div>
          <span className="fm-staff-jobs__eyebrow">Job Operations</span>

          <h1>Jobs & Progress</h1>

          <p>
            Track assigned jobs, live work progress, technician activity,
            customer media, expenses, and payment confirmation details.
          </p>
        </div>

        <button
          type="button"
          className="fm-staff-jobs__btn fm-staff-jobs__btn--outline"
          onClick={() =>
            load({
              silent: false,
            })
          }
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-staff-jobs__summaryGrid">
        <article className="fm-staff-jobs__summaryCard">
          <span>
            <ClipboardList size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Current tab jobs</p>
          </div>
        </article>

        <article className="fm-staff-jobs__summaryCard">
          <span>
            <UserRound size={17} />
          </span>
          <div>
            <strong>{stats.withTechnician}</strong>
            <p>Assigned technicians</p>
          </div>
        </article>

        <article className="fm-staff-jobs__summaryCard">
          <span>
            <Timer size={17} />
          </span>
          <div>
            <strong>{stats.acceptedTechs}</strong>
            <p>Accepted techs</p>
          </div>
        </article>

        <article className="fm-staff-jobs__summaryCard">
          <span>
            <ReceiptText size={17} />
          </span>
          <div>
            <strong>{stats.withPayment}</strong>
            <p>Payments visible</p>
          </div>
        </article>
      </div>

      <section className="fm-staff-jobs__card">
        <div className="fm-staff-jobs__tabs">
          {TABS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`fm-staff-jobs__tab ${
                tab === item.key ? "isActive" : ""
              }`}
              onClick={() => setTab(item.key)}>
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {err ? (
        <div className="fm-staff-jobs__notice fm-staff-jobs__notice--error">
          {err}
        </div>
      ) : null}

      <section className="fm-staff-jobs__card">
        <div className="fm-staff-jobs__cardHeader">
          <div>
            <span>Job records</span>
            <h2>{TABS.find((item) => item.key === tab)?.label || "Jobs"}</h2>
          </div>
        </div>

        <div className="fm-staff-jobs__tableWrap">
          <table className="fm-staff-jobs__table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Service</th>
                <th>District</th>
                <th>Technician</th>
                <th>Status</th>
                <th>Accepted Techs</th>
                <th>Created</th>
                <th className="fm-staff-jobs__actionsCol">Action</th>
              </tr>
            </thead>

            <tbody>
              {!ready ? (
                <tr>
                  <td colSpan="8">
                    <div className="fm-staff-jobs__empty isCompact" />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="fm-staff-jobs__empty">
                      <ClipboardList size={24} />
                      <strong>No jobs found</strong>
                      <span>No records are available for this status.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="fm-staff-jobs__titleCell">
                        <strong>{row.title}</strong>
                        <small>{row.id}</small>
                      </div>
                    </td>

                    <td>{row.service}</td>

                    <td>
                      <div className="fm-staff-jobs__cellIcon">
                        <MapPin size={14} />
                        <span>{row.district}</span>
                      </div>
                    </td>

                    <td>{row.assignedTech}</td>

                    <td>
                      <StatusChip status={row.status} />
                    </td>

                    <td>{row.acceptedCount}</td>
                    <td>{fmtDate(row.created)}</td>

                    <td>
                      <button
                        type="button"
                        className="fm-staff-jobs__btn fm-staff-jobs__btn--primary fm-staff-jobs__btn--small"
                        onClick={() => openDetails(row.id)}>
                        <Eye size={14} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {open ? (
        <div
          className="fm-staff-jobs-modal"
          onClick={() => setOpen(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Booking details">
          <div
            className="fm-staff-jobs-modal__card"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-staff-jobs-modal__header">
              <div>
                <span>Booking</span>
                <h2>{open.problemTitle || "Request"}</h2>
              </div>

              <div className="fm-staff-jobs-modal__headerActions">
                <StatusChip status={open.status} />

                <button
                  type="button"
                  className="fm-staff-jobs__iconAction"
                  onClick={() => setOpen(null)}
                  aria-label="Close">
                  <X size={16} />
                </button>
              </div>
            </div>

            {openLoading ? (
              <div className="fm-staff-jobs__empty">
                <RefreshCw size={24} />
                <strong>Loading booking</strong>
                <span>Please wait while booking details are loaded.</span>
              </div>
            ) : (
              <div className="fm-staff-jobs-modal__content">
                <div className="fm-staff-jobs-modal__column">
                  <section className="fm-staff-jobs__innerCard">
                    <div className="fm-staff-jobs__innerTitle">
                      <Route size={16} />
                      <span>Timeline</span>
                    </div>

                    <Timeline booking={open} />
                  </section>

                  <section className="fm-staff-jobs__innerCard">
                    <div className="fm-staff-jobs__innerTitle">
                      <CalendarClock size={16} />
                      <span>Notes</span>
                    </div>

                    <div className="fm-staff-jobs__notes">
                      {open?.notes || "No notes yet."}
                    </div>
                  </section>
                </div>

                <div className="fm-staff-jobs-modal__column">
                  <section className="fm-staff-jobs__innerCard">
                    <div className="fm-staff-jobs__innerTitle">
                      <Wrench size={16} />
                      <span>Details</span>
                    </div>

                    <div className="fm-staff-jobs__keyValues">
                      <div>
                        <span>Service</span>
                        <strong>{open?.service?.name || "—"}</strong>
                      </div>

                      <div>
                        <span>Category</span>
                        <strong>{open?.service?.category || "—"}</strong>
                      </div>

                      <div>
                        <span>District</span>
                        <strong>
                          {open?.customerSnapshot?.district || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Address</span>
                        <strong>
                          {open?.customerSnapshot?.address || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Preferred</span>
                        <strong>
                          {fmtDate(open?.preferredAt)}
                          {open?.timeSlot ? ` (${open.timeSlot})` : ""}
                        </strong>
                      </div>

                      <div>
                        <span>Assigned Tech</span>
                        <strong>
                          {open?.assignedTechnician?.full_name || "—"}
                        </strong>
                      </div>
                    </div>

                    {Array.isArray(open?.media) && open.media.length > 0 ? (
                      <>
                        <div className="fm-staff-jobs__subTitle">
                          Customer Photos
                        </div>

                        <div className="fm-staff-jobs__thumbs">
                          {open.media.map((item, index) => (
                            <a
                              key={`${item.url}-${index}`}
                              href={item.url}
                              target="_blank"
                              rel="noreferrer">
                              <img
                                src={item.url}
                                alt={`media-${index}`}
                                onError={(event) => {
                                  event.currentTarget.src =
                                    "/fallback-image.png";
                                  event.currentTarget.onerror = null;
                                }}
                              />
                            </a>
                          ))}
                        </div>
                      </>
                    ) : null}
                  </section>

                  {open?.assignedTechnician ? (
                    <section className="fm-staff-jobs__innerCard">
                      <div className="fm-staff-jobs__innerTitle">
                        <UserRound size={16} />
                        <span>Technician</span>
                      </div>

                      <div className="fm-staff-jobs__technicianBox">
                        <img
                          src={
                            open.assignedTechnician.profile_image_url ||
                            "/default-profile.png"
                          }
                          alt="Technician"
                          onError={(event) => {
                            event.currentTarget.src = "/default-profile.png";
                            event.currentTarget.onerror = null;
                          }}
                        />

                        <div>
                          <strong>
                            {open.assignedTechnician.full_name || "—"}
                          </strong>

                          <small>
                            {open.assignedTechnician.email || "—"} ·{" "}
                            {open.assignedTechnician.phone_number || "—"}
                          </small>

                          <small>
                            District: {open.assignedTechnician.district || "—"}{" "}
                            · {open.assignedTechnician.experience_years || 0}{" "}
                            yrs exp
                          </small>

                          <div className="fm-staff-jobs__chips">
                            {normalizeSpecializations(
                              open.assignedTechnician.specialization,
                            ).map((label, index) => (
                              <span key={`${label}-${index}`}>{label}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </section>
                  ) : null}

                  <section className="fm-staff-jobs__innerCard">
                    <div className="fm-staff-jobs__innerTitle">
                      <ReceiptText size={16} />
                      <span>Expenses</span>
                    </div>

                    {Array.isArray(open?.expenses) &&
                    open.expenses.length > 0 ? (
                      <div className="fm-staff-jobs__miniTableWrap">
                        <table className="fm-staff-jobs__miniTable">
                          <thead>
                            <tr>
                              <th>Label</th>
                              <th>Amount</th>
                              <th>Attachments</th>
                            </tr>
                          </thead>

                          <tbody>
                            {open.expenses.map((expense, index) => (
                              <tr key={`${expense.label}-${index}`}>
                                <td>{expense.label}</td>
                                <td>{fmtMoney(expense.amount)}</td>
                                <td>
                                  {(expense.attachments || []).length ? (
                                    (expense.attachments || []).map(
                                      (attachment, attachmentIndex) => (
                                        <a
                                          key={`${attachment.url}-${attachmentIndex}`}
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noreferrer">
                                          view
                                        </a>
                                      ),
                                    )
                                  ) : (
                                    <span>—</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="fm-staff-jobs__muted">
                        No expenses recorded.
                      </div>
                    )}
                  </section>

                  <section className="fm-staff-jobs__innerCard">
                    <div className="fm-staff-jobs__innerTitle">
                      <ReceiptText size={16} />
                      <span>Payment</span>
                    </div>

                    {open?.payment ? (
                      <div className="fm-staff-jobs__keyValues">
                        <div>
                          <span>Method</span>
                          <strong>
                            {open.payment.method?.toUpperCase?.() || "—"}
                          </strong>
                        </div>

                        <div>
                          <span>Service Charge</span>
                          <strong>
                            {fmtMoney(open.payment.serviceCharge)}
                          </strong>
                        </div>

                        <div>
                          <span>Expenses Total</span>
                          <strong>
                            {fmtMoney(open.payment.expensesTotal)}
                          </strong>
                        </div>

                        <div>
                          <span>Grand Total</span>
                          <strong className="isBig">
                            {fmtMoney(open.payment.grandTotal)}
                          </strong>
                        </div>

                        <div>
                          <span>Currency</span>
                          <strong>{open.payment.currency || "LKR"}</strong>
                        </div>

                        <div>
                          <span>Confirmed</span>
                          <strong>
                            {fmtDate(open.payment.confirmedByTechnicianAt)}
                          </strong>
                        </div>

                        <div>
                          <span>Receipt #</span>
                          <strong>{open.payment.receiptNumber || "—"}</strong>
                        </div>
                      </div>
                    ) : (
                      <div className="fm-staff-jobs__muted">
                        No payment yet. Payment appears after technician
                        completion and confirmation.
                      </div>
                    )}
                  </section>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}
