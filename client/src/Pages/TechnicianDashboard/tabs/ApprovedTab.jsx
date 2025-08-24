import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import "./ApprovedTab.css";

export default function ApprovedTab() {
  const [approved, setApproved] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // live status
  const [statusState, setStatusState] = useState({ onTheWay: false, arrived: false, started: false });
  const [statusBusy, setStatusBusy] = useState(false);

  // expenses + notes + complete
  const [expenses, setExpenses] = useState([]);
  const [expForm, setExpForm] = useState({ label: "", amount: "" });
  const [expenseFiles, setExpenseFiles] = useState([]);
  const [expenseBusy, setExpenseBusy] = useState(false);

  const [notes, setNotes] = useState("");
  const [notesBusy, setNotesBusy] = useState(false);

  const [serviceCharge, setServiceCharge] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [completeBusy, setCompleteBusy] = useState(false);

  // toast
  const [toast, setToast] = useState({ type: "", text: "" });
  const showToast = (type, text) => { setToast({ type, text }); setTimeout(()=>setToast({ type:"", text:"" }), 2500); };

  const navigate = useNavigate();
  const fmt = (d) => (d ? format(new Date(d), "PPpp") : "—");

  async function loadApproved() {
    try {
      const { data } = await api.get("/api/technician/bookings/mine", { params: { status: "coordinator_approved" } });
      setApproved(Array.isArray(data) ? data : []);
    } catch { setApproved([]); }
  }
  useEffect(() => { loadApproved(); }, []);

  async function viewBooking(id) {
    setDetailLoading(true);
    try {
      const { data: bTech } = await api.get(`/api/technician/bookings/${id}`);
      let bFull = null;
      try { const { data } = await api.get(`/api/bookings/${id}`); bFull = data; } catch {}

      setSelectedBooking(bTech || null);
      setStatusState({
        onTheWay: !!bTech?.techOnTheWayAt,
        arrived:  !!bTech?.techArrivedAt,
        started:  !!bTech?.workStartedAt,
      });
      setNotes(bFull?.notes || bTech?.notes || "");
      setExpenses(Array.isArray(bFull?.expenses) ? bFull.expenses : []);
      setExpForm({ label: "", amount: "" });
      setExpenseFiles([]);
      setServiceCharge("");
      setPaymentMethod("cash");
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to load booking");
    } finally { setDetailLoading(false); }
  }

  async function updateLiveStatus(id, which) {
    setStatusBusy(true);
    try {
      const body = { onTheWay: which === "on_the_way", arrived: which === "arrived", started: which === "started" };
      await api.patch(`/api/technician/bookings/${id}/status`, body);
      if (which === "on_the_way") setStatusState({ onTheWay: true, arrived: false, started: false });
      if (which === "arrived")   setStatusState({ onTheWay: true, arrived: true,  started: false });
      if (which === "started")   setStatusState({ onTheWay: true, arrived: true,  started: true  });
      showToast("success", "Status updated");
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to update status");
    } finally { setStatusBusy(false); }
  }

  async function addExpense(id) {
    if (!expForm.label || expForm.amount === "") {
      showToast("error", "Please enter label and amount");
      return;
    }
    setExpenseBusy(true);
    try {
      const form = new FormData();
      form.append("label", expForm.label);
      form.append("amount", expForm.amount);
      for (const f of expenseFiles) form.append("attachments", f);
      const { data } = await api.post(`/api/technician/bookings/${id}/expenses`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setExpenses(data?.expenses || []);
      setExpForm({ label: "", amount: "" });
      setExpenseFiles([]);
      showToast("success", "Expense added");
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to add expense");
    } finally { setExpenseBusy(false); }
  }

  async function saveNotes(id) {
    setNotesBusy(true);
    try { await api.patch(`/api/technician/bookings/${id}/notes`, { notes }); showToast("success", "Notes saved"); }
    catch (e) { showToast("error", e?.response?.data?.message || "Failed to save notes"); }
    finally { setNotesBusy(false); }
  }

  async function completeJob(id) {
    setCompleteBusy(true);
    try {
      const body = { serviceCharge: Number(serviceCharge || 0), paymentMethod };
      const { data } = await api.post(`/api/technician/bookings/${id}/complete`, body);
      showToast("success", `Completed. Amount due LKR ${Number(data?.payment?.grandTotal || 0).toLocaleString()}`);
      setSelectedBooking(null);
      loadApproved();
    } catch (e) {
      showToast("error", e?.response?.data?.message || "Failed to complete job");
    } finally { setCompleteBusy(false); }
  }

  // Redirect to chat tab (ensure convo if possible)
  async function goToChat(b) {
    try {
      // fetch full booking to get customer id
      const { data: det } = await api.get(`/api/bookings/${b._id}`);
      const customerId = det?.customer;
      if (customerId) {
        const { data: convo } = await api.post("/api/chat/conversations", {
          bookingId: b._id,
          withRole: "customer",
          withUserId: customerId,
        });
        return navigate(`/TechnicianDashboard/chat?convoId=${convo._id}`);
      }
      return navigate(`/TechnicianDashboard/chat?bookingId=${b._id}`);
    } catch {
      return navigate(`/TechnicianDashboard/chat?bookingId=${b._id}`);
    }
  }

  const expensesTotal = (expenses || []).reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const grandTotal = Number(serviceCharge || 0) + expensesTotal;

  const renderTable = (items) => (
    <table className="approved-table">
      <thead>
        <tr>
          <th>Service</th>
          <th>Problem</th>
          <th>Date</th>
          <th style={{width:220}}>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items.length === 0 ? (
          <tr><td colSpan={4} className="muted">No data available</td></tr>
        ) : items.map((b) => (
          <tr key={b._id}>
            <td>{b.service?.name || "—"}</td>
            <td className="truncate">{b.problemTitle || "—"}</td>
            <td>{fmt(b.preferredAt)}</td>
            <td className="row-actions">
              <button className="btn primary" onClick={() => viewBooking(b._id)}>Open</button>
              <button className="btn ghost" onClick={() => goToChat(b)}>Open Chat</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="approved-tab">
      <div className="tab-head">
        <h3>Approved Requests</h3>
        <div className="actions">
          <button className="btn ghost" onClick={loadApproved}>Refresh</button>
        </div>
      </div>

      {toast.text && <div className={`toast ${toast.type || "info"}`}>{toast.text}</div>}

      {renderTable(approved)}

      {/* Details modal (unchanged aside from no chat section) */}
      {selectedBooking && (
        <div className="modal" onClick={() => setSelectedBooking(null)} role="dialog" aria-modal="true">
          <div className="modal-card wide" onClick={(e)=>e.stopPropagation()}>
            <div className="modal-head">
              <div className="mh-left">
                <div className="eyebrow">Booking</div>
                <h3>{selectedBooking.problemTitle || "Request"}</h3>
                <div className="small muted">
                  {selectedBooking?.service?.name || "Service"} · {fmt(selectedBooking?.preferredAt)}
                </div>
              </div>
              <div className="mh-right">
                <button className="btn gray" onClick={() => setSelectedBooking(null)}>Close</button>
              </div>
            </div>

            {detailLoading ? (
              <div className="pad">Loading details…</div>
            ) : (
              <div className="modal-grid">
                {/* LEFT */}
                <div className="col">
                  <div className="card">
                    <div className="card-title">Live Status</div>
                    <div className="btn-row">
                      <button className="btn info" disabled={statusState.onTheWay || statusBusy}
                              onClick={()=>updateLiveStatus(selectedBooking._id,"on_the_way")}>On the way</button>
                      <button className="btn info" disabled={statusState.arrived || statusBusy}
                              onClick={()=>updateLiveStatus(selectedBooking._id,"arrived")}>Arrived</button>
                      <button className="btn info" disabled={statusState.started || statusBusy}
                              onClick={()=>updateLiveStatus(selectedBooking._id,"started")}>Started</button>
                    </div>
                    <div className="hint muted small">Buttons become disabled once marked.</div>
                  </div>

                  {/* Expenses cart */}
                  <div className="card">
                    <div className="card-title">Expenses Cart</div>
                    <div className="exp-form">
                      <input type="text" placeholder="Label (e.g., Transport)"
                             value={expForm.label} onChange={(e)=>setExpForm({...expForm, label:e.target.value})}/>
                      <input type="number" placeholder="Amount"
                             value={expForm.amount} onChange={(e)=>setExpForm({...expForm, amount:e.target.value})}/>
                      <label className="file">Attach receipt (optional)
                        <input type="file" multiple onChange={(e)=>setExpenseFiles(Array.from(e.target.files||[]))}/>
                      </label>
                      <button className="btn success" disabled={expenseBusy}
                              onClick={()=>addExpense(selectedBooking._id)}>
                        {expenseBusy ? "Adding…" : "Add Expense"}
                      </button>
                    </div>

                    <div className="cart-list">
                      {expenses.length === 0 ? (
                        <div className="muted small">No expenses yet.</div>
                      ) : expenses.map((e,i)=>(
                        <div className="cart-row" key={i}>
                          <div className="cr-left">
                            <div className="cr-label">{e.label}</div>
                            {(e.attachments||[]).length>0 && (
                              <div className="tiny muted">{(e.attachments||[]).length} receipt(s)</div>
                            )}
                          </div>
                          <div className="cr-right">LKR {Number(e.amount||0).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>

                    <div className="totals">
                      <div><span>Expenses Total </span><b> LKR {expensesTotal.toLocaleString()}</b></div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="card">
                    <div className="card-title">Job Notes</div>
                    <textarea placeholder="Notes for this job…"
                              value={notes} onChange={(e)=>setNotes(e.target.value)} />
                    <div className="btn-row">
                      <button className="btn" disabled={notesBusy} onClick={()=>saveNotes(selectedBooking._id)}>
                        {notesBusy ? "Saving…" : "Save Notes"}
                      </button>
                    </div>
                  </div>

                  {/* Complete */}
                  <div className="card">
                    <div className="card-title">Complete & Confirm Payment</div>
                    <div className="complete-grid">
                      <input type="number" placeholder="Service charge (LKR)"
                             value={serviceCharge} onChange={(e)=>setServiceCharge(e.target.value)} />
                      <select value={paymentMethod} onChange={(e)=>setPaymentMethod(e.target.value)}>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                      </select>
                      <div className="amount-due">
                        <div className="row"><span>Expenses</span><b>LKR {expensesTotal.toLocaleString()}</b></div>
                        <div className="row"><span>Service Charge</span><b>LKR {Number(serviceCharge||0).toLocaleString()}</b></div>
                        <div className="row grand"><span>Amount Due</span><b>LKR {grandTotal.toLocaleString()}</b></div>
                      </div>
                    </div>
                    <div className="btn-row">
                      <button className="btn success" disabled={completeBusy}
                              onClick={()=>completeJob(selectedBooking._id)}>
                        {completeBusy ? "Completing…" : "Complete & Confirm"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="col">
                  <div className="card">
                    <div className="card-title">Details</div>
                    <div className="kv">
                      <div><span>Service</span><b>{selectedBooking?.service?.name || "—"}</b></div>
                      <div><span>Problem</span><b>{selectedBooking?.problemTitle || "—"}</b></div>
                      <div><span>Preferred</span><b>{fmt(selectedBooking?.preferredAt)}{selectedBooking?.timeSlot ? ` (${selectedBooking.timeSlot})` : ""}</b></div>
                      <div><span>Address</span><b>{selectedBooking?.serviceAddress || "—"}</b></div>
                      <div><span>District</span><b>{selectedBooking?.customerSnapshot?.district || "—"}</b></div>
                      <div><span>Phone</span><b>{selectedBooking?.customerSnapshot?.phone_number || "—"}</b></div>
                    </div>
                  </div>
                  {/* (Proof photos intentionally removed) */}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
