import React, { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Check,
  ClipboardList,
  Eye,
  MapPin,
  RefreshCw,
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

export default function AssignedTab() {
  const [assigned, setAssigned] = useState([]);
  const [selectedAssignedBooking, setSelectedAssignedBooking] = useState(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    type: "",
    text: "",
  });

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

  const loadAssigned = useCallback(async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/api/technician/bookings/available");

      setAssigned(Array.isArray(data) ? data : []);
    } catch (error) {
      setAssigned([]);
      showToast(
        "error",
        error?.response?.data?.message || "Failed to load assigned tasks.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssigned();
  }, [loadAssigned]);

  useEffect(() => {
    if (!selectedAssignedBooking) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedAssignedBooking(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedAssignedBooking]);

  const handleAccept = async (id) => {
    try {
      await api.post(`/api/technician/bookings/${id}/accept`);

      setAssigned((current) => current.filter((booking) => booking._id !== id));

      showToast("success", "Booking accepted.");
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Accept failed.");
    }
  };

  const handleDecline = async (id) => {
    try {
      await api.post(`/api/technician/bookings/${id}/decline`);

      setAssigned((current) => current.filter((booking) => booking._id !== id));

      showToast("success", "Booking declined.");
    } catch (error) {
      showToast("error", error?.response?.data?.message || "Decline failed.");
    }
  };

  return (
    <section className="fm-tech-tabs">
      <div className="fm-tech-tabs__header">
        <div>
          <span className="fm-tech-tabs__eyebrow">Available Work</span>
          <h1>Assigned Tasks</h1>
          <p>
            Review available service requests, inspect details, then accept or
            decline based on your availability.
          </p>
        </div>

        <button
          type="button"
          className="fm-tech-tabs__btn fm-tech-tabs__btn--outline"
          onClick={loadAssigned}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
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
            <span>Request queue</span>
            <h2>Available Requests</h2>
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
              {assigned.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="fm-tech-tabs__empty">
                      <ClipboardList size={24} />
                      <strong>No assigned tasks</strong>
                      <span>No available service requests right now.</span>
                    </div>
                  </td>
                </tr>
              ) : (
                assigned.map((booking) => (
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
                          className="fm-tech-tabs__btn fm-tech-tabs__btn--outline fm-tech-tabs__btn--small"
                          onClick={() => setSelectedAssignedBooking(booking)}>
                          <Eye size={14} />
                          View
                        </button>

                        <button
                          type="button"
                          className="fm-tech-tabs__btn fm-tech-tabs__btn--success fm-tech-tabs__btn--small"
                          onClick={() => handleAccept(booking._id)}>
                          Accept
                        </button>

                        <button
                          type="button"
                          className="fm-tech-tabs__btn fm-tech-tabs__btn--danger fm-tech-tabs__btn--small"
                          onClick={() => handleDecline(booking._id)}>
                          Decline
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

      {selectedAssignedBooking ? (
        <div
          className="fm-tech-tabs-modal"
          onClick={() => setSelectedAssignedBooking(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Booking request">
          <div
            className="fm-tech-tabs-modal__card"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-tech-tabs-modal__header">
              <div>
                <span>Booking request</span>
                <h2>{selectedAssignedBooking.problemTitle || "Request"}</h2>
              </div>

              <button
                type="button"
                className="fm-tech-tabs__iconAction"
                onClick={() => setSelectedAssignedBooking(null)}
                aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="fm-tech-tabs__detailGrid">
              <div>
                <span>Service</span>
                <strong>{selectedAssignedBooking.service?.name || "—"}</strong>
              </div>

              <div>
                <span>Category</span>
                <strong>
                  {selectedAssignedBooking.service?.category || "—"}
                </strong>
              </div>

              <div>
                <span>Problem</span>
                <strong>{selectedAssignedBooking.problemTitle || "—"}</strong>
              </div>

              <div>
                <span>Preferred Date / Time</span>
                <strong>
                  {fmt(selectedAssignedBooking.preferredAt)}
                  {selectedAssignedBooking.timeSlot
                    ? ` (${selectedAssignedBooking.timeSlot})`
                    : ""}
                </strong>
              </div>

              <div className="isWide">
                <span>Description</span>
                <strong>
                  {selectedAssignedBooking.problemDescription || "—"}
                </strong>
              </div>

              <div>
                <span>Brand / Model</span>
                <strong>{selectedAssignedBooking.brandModel || "N/A"}</strong>
              </div>

              <div>
                <span>Equipment Age</span>
                <strong>{selectedAssignedBooking.equipmentAge || "N/A"}</strong>
              </div>

              <div className="isWide">
                <span>Special Instructions</span>
                <strong>
                  {selectedAssignedBooking.specialInstructions || "None"}
                </strong>
              </div>

              <div className="isWide">
                <span>Address</span>
                <strong>{selectedAssignedBooking.serviceAddress || "—"}</strong>
              </div>

              <div>
                <span>District</span>
                <strong>
                  {selectedAssignedBooking.customerSnapshot?.district || "—"}
                </strong>
              </div>

              <div>
                <span>Location</span>
                <strong className="fm-tech-tabs__inlineIcon">
                  <MapPin size={14} />
                  {selectedAssignedBooking.customerSnapshot?.district || "—"}
                </strong>
              </div>
            </div>

            <div className="fm-tech-tabs-modal__actions">
              <button
                type="button"
                className="fm-tech-tabs__btn fm-tech-tabs__btn--success"
                onClick={() => {
                  handleAccept(selectedAssignedBooking._id);
                  setSelectedAssignedBooking(null);
                }}>
                Accept Request
              </button>

              <button
                type="button"
                className="fm-tech-tabs__btn fm-tech-tabs__btn--danger"
                onClick={() => {
                  handleDecline(selectedAssignedBooking._id);
                  setSelectedAssignedBooking(null);
                }}>
                Decline Request
              </button>

              <button
                type="button"
                className="fm-tech-tabs__btn fm-tech-tabs__btn--outline"
                onClick={() => setSelectedAssignedBooking(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
