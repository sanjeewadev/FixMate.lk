import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import {
  Check,
  ClipboardList,
  Eye,
  FileText,
  MessageSquare,
  RefreshCw,
  ReceiptText,
  Route,
  Save,
  Wrench,
  X,
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

const money = (value) => {
  return `LKR ${Number(value || 0).toLocaleString()}`;
};

export default function ApprovedTab() {
  const [approved, setApproved] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [statusState, setStatusState] = useState({
    onTheWay: false,
    arrived: false,
    started: false,
  });

  const [statusBusy, setStatusBusy] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [expForm, setExpForm] = useState({
    label: "",
    amount: "",
  });

  const [expenseFiles, setExpenseFiles] = useState([]);
  const [expenseBusy, setExpenseBusy] = useState(false);

  const [notes, setNotes] = useState("");
  const [notesBusy, setNotesBusy] = useState(false);

  const [serviceCharge, setServiceCharge] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [completeBusy, setCompleteBusy] = useState(false);

  const [toast, setToast] = useState({
    type: "",
    text: "",
  });

  const navigate = useNavigate();

  const showToast = (type, text) => {
    setToast({
      type,
      text,
    });

    window.setTimeout(() => {
      setToast({
        type: "",
        text: "",
      });
    }, 2500);
  };

  const loadApproved = useCallback(async () => {
    try {
      const { data } = await api.get("/api/technician/bookings/mine", {
        params: {
          status: "coordinator_approved",
        },
      });

      setApproved(Array.isArray(data) ? data : []);
    } catch (error) {
      setApproved([]);
      showToast(
        "error",
        error?.response?.data?.message || "Failed to load approved requests.",
      );
    }
  }, []);

  useEffect(() => {
    loadApproved();
  }, [loadApproved]);

  useEffect(() => {
    if (!selectedBooking) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedBooking(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedBooking]);

  async function viewBooking(id) {
    setDetailLoading(true);

    try {
      const { data: technicianBooking } = await api.get(
        `/api/technician/bookings/${id}`,
      );

      let fullBooking = null;

      try {
        const { data } = await api.get(`/api/bookings/${id}`);
        fullBooking = data;
      } catch {
        fullBooking = null;
      }

      setSelectedBooking(technicianBooking || null);

      setStatusState({
        onTheWay: Boolean(technicianBooking?.techOnTheWayAt),
        arrived: Boolean(technicianBooking?.techArrivedAt),
        started: Boolean(technicianBooking?.workStartedAt),
      });

      setNotes(fullBooking?.notes || technicianBooking?.notes || "");
      setExpenses(
        Array.isArray(fullBooking?.expenses) ? fullBooking.expenses : [],
      );
      setExpForm({
        label: "",
        amount: "",
      });
      setExpenseFiles([]);
      setServiceCharge("");
      setPaymentMethod("cash");
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.message || "Failed to load booking.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateLiveStatus(id, which) {
    setStatusBusy(true);

    try {
      const body = {
        onTheWay: which === "on_the_way",
        arrived: which === "arrived",
        started: which === "started",
      };

      await api.patch(`/api/technician/bookings/${id}/status`, body);

      if (which === "on_the_way") {
        setStatusState({
          onTheWay: true,
          arrived: false,
          started: false,
        });
      }

      if (which === "arrived") {
        setStatusState({
          onTheWay: true,
          arrived: true,
          started: false,
        });
      }

      if (which === "started") {
        setStatusState({
          onTheWay: true,
          arrived: true,
          started: true,
        });
      }

      showToast("success", "Status updated.");
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.message || "Failed to update status.",
      );
    } finally {
      setStatusBusy(false);
    }
  }

  async function addExpense(id) {
    if (!expForm.label || expForm.amount === "") {
      showToast("error", "Please enter label and amount.");
      return;
    }

    setExpenseBusy(true);

    try {
      const form = new FormData();

      form.append("label", expForm.label);
      form.append("amount", expForm.amount);

      for (const file of expenseFiles) {
        form.append("attachments", file);
      }

      const { data } = await api.post(
        `/api/technician/bookings/${id}/expenses`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      setExpenses(data?.expenses || []);
      setExpForm({
        label: "",
        amount: "",
      });
      setExpenseFiles([]);

      showToast("success", "Expense added.");
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.message || "Failed to add expense.",
      );
    } finally {
      setExpenseBusy(false);
    }
  }

  async function saveNotes(id) {
    setNotesBusy(true);

    try {
      await api.patch(`/api/technician/bookings/${id}/notes`, {
        notes,
      });

      showToast("success", "Notes saved.");
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.message || "Failed to save notes.",
      );
    } finally {
      setNotesBusy(false);
    }
  }

  async function completeJob(id) {
    setCompleteBusy(true);

    try {
      const body = {
        serviceCharge: Number(serviceCharge || 0),
        paymentMethod,
      };

      const { data } = await api.post(
        `/api/technician/bookings/${id}/complete`,
        body,
      );

      showToast(
        "success",
        `Completed. Amount due ${money(data?.payment?.grandTotal || 0)}.`,
      );

      setSelectedBooking(null);
      loadApproved();
    } catch (error) {
      showToast(
        "error",
        error?.response?.data?.message || "Failed to complete job.",
      );
    } finally {
      setCompleteBusy(false);
    }
  }

  async function goToChat(booking) {
    try {
      const { data: details } = await api.get(`/api/bookings/${booking._id}`);
      const customerId = details?.customer;

      if (customerId) {
        const { data: conversation } = await api.post(
          "/api/chat/conversations",
          {
            bookingId: booking._id,
            withRole: "customer",
            withUserId: customerId,
          },
        );

        return navigate(
          `/TechnicianDashboard/chat?convoId=${conversation._id}`,
        );
      }

      return navigate(`/TechnicianDashboard/chat?bookingId=${booking._id}`);
    } catch {
      return navigate(`/TechnicianDashboard/chat?bookingId=${booking._id}`);
    }
  }

  const expensesTotal = useMemo(() => {
    return (expenses || []).reduce(
      (sum, expense) => sum + (Number(expense.amount) || 0),
      0,
    );
  }, [expenses]);

  const grandTotal = Number(serviceCharge || 0) + expensesTotal;

  return (
    <section className="fm-tech-tabs approved-tab">
      <div className="fm-tech-tabs__header">
        <div>
          <span className="fm-tech-tabs__eyebrow">Approved Work</span>
          <h1>Approved Requests</h1>
          <p>
            Manage live job status, record expenses, save notes, open customer
            chat, and complete confirmed jobs.
          </p>
        </div>

        <button
          type="button"
          className="fm-tech-tabs__btn fm-tech-tabs__btn--outline"
          onClick={loadApproved}>
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {toast.text ? (
        <div
          className={`fm-tech-tabs__notice fm-tech-tabs__notice--${toast.type}`}>
          {toast.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{toast.text}</span>
        </div>
      ) : null}

      <section className="fm-tech-tabs__card">
        <div className="fm-tech-tabs__cardHeader">
          <div>
            <span>Approved job queue</span>
            <h2>Ready for Action</h2>
          </div>
        </div>

        <div className="fm-tech-tabs__tableWrap">
          <table className="fm-tech-tabs__table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Problem</th>
                <th>Preferred Date</th>
                <th className="fm-tech-tabs__actionsCol">Actions</th>
              </tr>
            </thead>

            <tbody>
              {approved.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="fm-tech-tabs__empty">
                      <ClipboardList size={24} />
                      <strong>No approved requests</strong>
                      <span>No approved jobs are available right now.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                approved.map((booking) => (
                  <tr key={booking._id}>
                    <td>{booking.service?.name || "—"}</td>

                    <td>
                      <div className="fm-tech-tabs__titleCell">
                        <strong>{booking.problemTitle || "—"}</strong>
                        <small>{booking._id}</small>
                      </div>
                    </td>

                    <td>{fmt(booking.preferredAt)}</td>

                    <td>
                      <div className="fm-tech-tabs__rowActions">
                        <button
                          type="button"
                          className="fm-tech-tabs__btn fm-tech-tabs__btn--primary fm-tech-tabs__btn--small"
                          onClick={() => viewBooking(booking._id)}>
                          <Eye size={14} />
                          Open
                        </button>

                        <button
                          type="button"
                          className="fm-tech-tabs__btn fm-tech-tabs__btn--outline fm-tech-tabs__btn--small"
                          onClick={() => goToChat(booking)}>
                          <MessageSquare size={14} />
                          Chat
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {selectedBooking ? (
        <div
          className="fm-tech-tabs-modal"
          onClick={() => setSelectedBooking(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Approved booking details">
          <div
            className="fm-tech-tabs-modal__card isWide"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-tech-tabs-modal__header">
              <div>
                <span>Booking</span>
                <h2>{selectedBooking.problemTitle || "Request"}</h2>
                <p>
                  {selectedBooking?.service?.name || "Service"} ·{" "}
                  {fmt(selectedBooking?.preferredAt)}
                </p>
              </div>

              <button
                type="button"
                className="fm-tech-tabs__iconAction"
                onClick={() => setSelectedBooking(null)}
                aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {detailLoading ? (
              <div className="fm-tech-tabs__empty">
                <RefreshCw size={24} />
                <strong>Loading booking</strong>
                <span>Please wait while booking details are loaded.</span>
              </div>
            ) : (
              <div className="fm-tech-tabs-modal__grid">
                <div className="fm-tech-tabs-modal__column">
                  <section className="fm-tech-tabs__innerCard">
                    <div className="fm-tech-tabs__innerTitle">
                      <Route size={16} />
                      <span>Live Status</span>
                    </div>

                    <div className="fm-tech-tabs__buttonRow">
                      <button
                        type="button"
                        className="fm-tech-tabs__btn fm-tech-tabs__btn--primary"
                        disabled={statusState.onTheWay || statusBusy}
                        onClick={() =>
                          updateLiveStatus(selectedBooking._id, "on_the_way")
                        }>
                        On the way
                      </button>

                      <button
                        type="button"
                        className="fm-tech-tabs__btn fm-tech-tabs__btn--primary"
                        disabled={statusState.arrived || statusBusy}
                        onClick={() =>
                          updateLiveStatus(selectedBooking._id, "arrived")
                        }>
                        Arrived
                      </button>

                      <button
                        type="button"
                        className="fm-tech-tabs__btn fm-tech-tabs__btn--primary"
                        disabled={statusState.started || statusBusy}
                        onClick={() =>
                          updateLiveStatus(selectedBooking._id, "started")
                        }>
                        Started
                      </button>
                    </div>

                    <p className="fm-tech-tabs__hint">
                      Buttons become disabled once each status is marked.
                    </p>
                  </section>

                  <section className="fm-tech-tabs__innerCard">
                    <div className="fm-tech-tabs__innerTitle">
                      <ReceiptText size={16} />
                      <span>Expenses Cart</span>
                    </div>

                    <div className="fm-tech-tabs__expenseForm">
                      <input
                        type="text"
                        placeholder="Label, e.g. Transport"
                        value={expForm.label}
                        onChange={(event) =>
                          setExpForm((current) => ({
                            ...current,
                            label: event.target.value,
                          }))
                        }
                      />

                      <input
                        type="number"
                        placeholder="Amount"
                        value={expForm.amount}
                        onChange={(event) =>
                          setExpForm((current) => ({
                            ...current,
                            amount: event.target.value,
                          }))
                        }
                      />

                      <label>
                        Attach receipt
                        <input
                          type="file"
                          multiple
                          onChange={(event) =>
                            setExpenseFiles(
                              Array.from(event.target.files || []),
                            )
                          }
                        />
                      </label>

                      <button
                        type="button"
                        className="fm-tech-tabs__btn fm-tech-tabs__btn--success"
                        disabled={expenseBusy}
                        onClick={() => addExpense(selectedBooking._id)}>
                        {expenseBusy ? "Adding..." : "Add Expense"}
                      </button>
                    </div>

                    <div className="fm-tech-tabs__cartList">
                      {expenses.length === 0 ? (
                        <div className="fm-tech-tabs__muted">
                          No expenses yet.
                        </div>
                      ) : (
                        expenses.map((expense, index) => (
                          <div
                            className="fm-tech-tabs__cartRow"
                            key={`${expense.label}-${index}`}>
                            <div>
                              <strong>{expense.label}</strong>
                              {(expense.attachments || []).length > 0 ? (
                                <span>
                                  {(expense.attachments || []).length}{" "}
                                  receipt(s)
                                </span>
                              ) : null}
                            </div>

                            <b>{money(expense.amount)}</b>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="fm-tech-tabs__totalLine">
                      <span>Expenses Total</span>
                      <strong>{money(expensesTotal)}</strong>
                    </div>
                  </section>

                  <section className="fm-tech-tabs__innerCard">
                    <div className="fm-tech-tabs__innerTitle">
                      <FileText size={16} />
                      <span>Job Notes</span>
                    </div>

                    <textarea
                      placeholder="Notes for this job"
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />

                    <div className="fm-tech-tabs__buttonRow">
                      <button
                        type="button"
                        className="fm-tech-tabs__btn fm-tech-tabs__btn--outline"
                        disabled={notesBusy}
                        onClick={() => saveNotes(selectedBooking._id)}>
                        <Save size={15} />
                        {notesBusy ? "Saving..." : "Save Notes"}
                      </button>
                    </div>
                  </section>

                  <section className="fm-tech-tabs__innerCard">
                    <div className="fm-tech-tabs__innerTitle">
                      <Check size={16} />
                      <span>Complete & Confirm Payment</span>
                    </div>

                    <div className="fm-tech-tabs__completeGrid">
                      <input
                        type="number"
                        placeholder="Service charge"
                        value={serviceCharge}
                        onChange={(event) =>
                          setServiceCharge(event.target.value)
                        }
                      />

                      <select
                        value={paymentMethod}
                        onChange={(event) =>
                          setPaymentMethod(event.target.value)
                        }>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                      </select>

                      <div className="fm-tech-tabs__amountBox">
                        <div>
                          <span>Expenses</span>
                          <b>{money(expensesTotal)}</b>
                        </div>

                        <div>
                          <span>Service Charge</span>
                          <b>{money(serviceCharge)}</b>
                        </div>

                        <div className="isGrand">
                          <span>Amount Due</span>
                          <b>{money(grandTotal)}</b>
                        </div>
                      </div>
                    </div>

                    <div className="fm-tech-tabs__buttonRow">
                      <button
                        type="button"
                        className="fm-tech-tabs__btn fm-tech-tabs__btn--success"
                        disabled={completeBusy}
                        onClick={() => completeJob(selectedBooking._id)}>
                        {completeBusy ? "Completing..." : "Complete & Confirm"}
                      </button>
                    </div>
                  </section>
                </div>

                <div className="fm-tech-tabs-modal__column">
                  <section className="fm-tech-tabs__innerCard">
                    <div className="fm-tech-tabs__innerTitle">
                      <Wrench size={16} />
                      <span>Details</span>
                    </div>

                    <div className="fm-tech-tabs__detailGrid isSingle">
                      <div>
                        <span>Service</span>
                        <strong>{selectedBooking?.service?.name || "—"}</strong>
                      </div>

                      <div>
                        <span>Problem</span>
                        <strong>{selectedBooking?.problemTitle || "—"}</strong>
                      </div>

                      <div>
                        <span>Preferred</span>
                        <strong>
                          {fmt(selectedBooking?.preferredAt)}
                          {selectedBooking?.timeSlot
                            ? ` (${selectedBooking.timeSlot})`
                            : ""}
                        </strong>
                      </div>

                      <div>
                        <span>Address</span>
                        <strong>
                          {selectedBooking?.serviceAddress || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>District</span>
                        <strong>
                          {selectedBooking?.customerSnapshot?.district || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>Phone</span>
                        <strong>
                          {selectedBooking?.customerSnapshot?.phone_number ||
                            "—"}
                        </strong>
                      </div>
                    </div>
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
