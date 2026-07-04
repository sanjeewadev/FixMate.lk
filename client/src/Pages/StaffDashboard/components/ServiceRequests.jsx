import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ClipboardList,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";

import api from "../../../lib/api.js";
import DistrictTechSelect from "./DistrictTechSelect.jsx";
import "./ServiceRequests.css";

function formatDate(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return value || "—";
  }
}

const getTechId = (tech) =>
  tech?.id || tech?._id || tech?.technicianId || tech?.technician_id || "";

export default function ServiceRequests() {
  const [unclaimed, setUnclaimed] = useState([]);
  const [awaiting, setAwaiting] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({
    type: "",
    text: "",
  });

  const [query, setQuery] = useState("");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTech, setSelectedTech] = useState("");

  const hasData = useMemo(
    () => unclaimed.length + awaiting.length > 0,
    [unclaimed, awaiting],
  );

  const stats = useMemo(() => {
    const accepted = [...unclaimed, ...awaiting].reduce(
      (total, booking) => total + Number(booking.acceptedCount || 0),
      0,
    );

    return {
      total: unclaimed.length + awaiting.length,
      unclaimed: unclaimed.length,
      awaiting: awaiting.length,
      accepted,
    };
  }, [awaiting, unclaimed]);

  const filteredUnclaimed = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) return unclaimed;

    return unclaimed.filter((booking) =>
      [
        booking.problemTitle,
        booking.service?.name,
        booking.customerSnapshot?.district,
        booking.customerSnapshot?.full_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text)),
    );
  }, [query, unclaimed]);

  const filteredAwaiting = useMemo(() => {
    const text = query.trim().toLowerCase();

    if (!text) return awaiting;

    return awaiting.filter((booking) =>
      [
        booking.problemTitle,
        booking.service?.name,
        booking.customerSnapshot?.district,
        booking.customerSnapshot?.full_name,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(text)),
    );
  }, [awaiting, query]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/api/coordinator/bookings/dashboard");

      setUnclaimed(data?.unclaimed || []);
      setAwaiting(data?.awaitingCoordinator || []);

      setMsg({
        type: "",
        text: "",
      });
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Failed to load requests.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    const id = setInterval(fetchRequests, 15000);

    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!selectedBooking) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedBooking(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedBooking]);

  const openPicker = (booking) => {
    setSelectedBooking(booking);

    const first =
      Array.isArray(booking?.acceptedTechs) && booking.acceptedTechs.length > 0
        ? getTechId(booking.acceptedTechs[0])
        : "";

    setSelectedTech(first || "");
  };

  const assignTech = async (bookingId, technicianId) => {
    if (!technicianId) {
      setMsg({
        type: "error",
        text: "Please select a technician.",
      });
      return;
    }

    try {
      await api.post(`/api/coordinator/bookings/${bookingId}/assign`, {
        technicianId,
      });

      setMsg({
        type: "success",
        text: "Technician assigned successfully.",
      });

      setSelectedBooking(null);
      setSelectedTech("");
      fetchRequests();
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error assigning technician.",
      });
    }
  };

  const reassignTech = async (bookingId, technicianId) => {
    if (!technicianId) {
      setMsg({
        type: "error",
        text: "Please select a technician.",
      });
      return;
    }

    try {
      await api.post(`/api/coordinator/bookings/${bookingId}/reassign`, {
        technicianId,
      });

      setMsg({
        type: "success",
        text: "Technician changed successfully.",
      });

      setSelectedBooking(null);
      setSelectedTech("");
      fetchRequests();
    } catch (error) {
      setMsg({
        type: "error",
        text: error?.response?.data?.message || "Error changing technician.",
      });
    }
  };

  const renderRequestTable = (items, type) => {
    const isAwaiting = type === "awaiting";

    return (
      <section className="fm-staff-requests__card">
        <div className="fm-staff-requests__listHeader">
          <div>
            <span>{isAwaiting ? "Coordinator approval" : "New requests"}</span>
            <h2>{isAwaiting ? "Awaiting Approval" : "Unclaimed Requests"}</h2>
          </div>

          <button
            type="button"
            className="fm-staff-requests__btn fm-staff-requests__btn--outline"
            onClick={fetchRequests}
            disabled={loading}>
            <RefreshCw size={16} />
            {loading ? "Refreshing" : "Refresh"}
          </button>
        </div>

        <div className="fm-staff-requests__tableWrap">
          <table className="fm-staff-requests__table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Service</th>
                {!isAwaiting ? <th>District</th> : null}
                <th>Accepted Techs</th>
                <th>Created</th>
                <th className="fm-staff-requests__actionsCol">Action</th>
              </tr>
            </thead>

            <tbody>
              {items.map((booking) => (
                <tr key={booking._id}>
                  <td>
                    <div className="fm-staff-requests__requestTitle">
                      <strong>
                        {booking.problemTitle || "Untitled request"}
                      </strong>
                      <small>{booking._id}</small>
                    </div>
                  </td>

                  <td>{booking.service?.name || "—"}</td>

                  {!isAwaiting ? (
                    <td>
                      <div className="fm-staff-requests__cellIcon">
                        <MapPin size={14} />
                        <span>{booking.customerSnapshot?.district || "—"}</span>
                      </div>
                    </td>
                  ) : null}

                  <td>
                    <span className="fm-staff-requests__countBadge">
                      {booking.acceptedCount ?? 0}
                    </span>
                  </td>

                  <td>{formatDate(booking.createdAt)}</td>

                  <td>
                    <button
                      type="button"
                      onClick={() => openPicker(booking)}
                      className="fm-staff-requests__btn fm-staff-requests__btn--primary fm-staff-requests__btn--small">
                      <UserCheck size={14} />
                      {isAwaiting ? "Approve & Assign" : "Assign"}
                    </button>
                  </td>
                </tr>
              ))}

              {!items.length ? (
                <tr>
                  <td colSpan={isAwaiting ? 5 : 6}>
                    <div className="fm-staff-requests__empty">
                      <ClipboardList size={24} />
                      <strong>No records found</strong>
                      <span>
                        {query
                          ? "Try a different search keyword."
                          : "There are no matching requests in this section."}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <section className="fm-staff-requests">
      <div className="fm-staff-requests__header">
        <div>
          <span className="fm-staff-requests__eyebrow">Request Operations</span>

          <h1>Service Requests</h1>

          <p>
            Assign new service requests, approve technician responses, and
            manage technician allocation from one operational view.
          </p>
        </div>

        <button
          type="button"
          className="fm-staff-requests__btn fm-staff-requests__btn--outline"
          onClick={fetchRequests}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      <div className="fm-staff-requests__summaryGrid">
        <article className="fm-staff-requests__summaryCard">
          <span>
            <ClipboardList size={17} />
          </span>
          <div>
            <strong>{stats.total}</strong>
            <p>Total pending</p>
          </div>
        </article>

        <article className="fm-staff-requests__summaryCard">
          <span>
            <AlertCircle size={17} />
          </span>
          <div>
            <strong>{stats.unclaimed}</strong>
            <p>Unclaimed</p>
          </div>
        </article>

        <article className="fm-staff-requests__summaryCard">
          <span>
            <Clock3 size={17} />
          </span>
          <div>
            <strong>{stats.awaiting}</strong>
            <p>Awaiting approval</p>
          </div>
        </article>

        <article className="fm-staff-requests__summaryCard">
          <span>
            <UsersRound size={17} />
          </span>
          <div>
            <strong>{stats.accepted}</strong>
            <p>Accepted techs</p>
          </div>
        </article>
      </div>

      {msg.text ? (
        <div
          className={`fm-staff-requests__notice fm-staff-requests__notice--${msg.type}`}
          role="status"
          aria-live="polite">
          {msg.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <section className="fm-staff-requests__card">
        <div className="fm-staff-requests__toolbar">
          <div>
            <span>Live request queue</span>
            <h2>Pending Work</h2>
          </div>

          <label className="fm-staff-requests__search">
            <Search size={16} />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search request, service, district"
            />
          </label>
        </div>
      </section>

      {!loading && !hasData ? (
        <div className="fm-staff-requests__card">
          <div className="fm-staff-requests__empty">
            <ClipboardList size={24} />
            <strong>No pending requests</strong>
            <span>No pending requests are available right now.</span>
            <button
              type="button"
              className="fm-staff-requests__btn fm-staff-requests__btn--outline"
              onClick={fetchRequests}>
              Refresh
            </button>
          </div>
        </div>
      ) : null}

      {hasData ? (
        <>
          {renderRequestTable(filteredUnclaimed, "unclaimed")}
          {renderRequestTable(filteredAwaiting, "awaiting")}
        </>
      ) : null}

      {selectedBooking ? (
        <div
          className="fm-staff-requests-modal"
          onClick={() => setSelectedBooking(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Choose technician">
          <div
            className="fm-staff-requests-modal__card"
            onClick={(event) => event.stopPropagation()}>
            <div className="fm-staff-requests-modal__header">
              <div>
                <span>Technician assignment</span>
                <h2>Choose Technician</h2>
              </div>

              <button
                type="button"
                className="fm-staff-requests__iconAction"
                onClick={() => setSelectedBooking(null)}
                aria-label="Close">
                <X size={16} />
              </button>
            </div>

            <div className="fm-staff-requests-modal__context">
              <strong>{selectedBooking.service?.name || "Service"}</strong>
              <span>{selectedBooking.customerSnapshot?.district || "—"}</span>
            </div>

            {selectedBooking?.status === "awaiting_coordinator" &&
            Array.isArray(selectedBooking?.acceptedTechs) &&
            selectedBooking.acceptedTechs.length > 0 ? (
              <div className="fm-staff-requests__fifo">
                <div className="fm-staff-requests__fifoHeader">
                  <div>
                    <strong>Accepted technicians</strong>
                    <span>First responders are listed first.</span>
                  </div>
                </div>

                <ol className="fm-staff-requests__fifoList">
                  {selectedBooking.acceptedTechs.map((tech, index) => {
                    const techId = getTechId(tech);

                    return (
                      <li
                        key={techId || index}
                        className={`fm-staff-requests__fifoItem ${
                          selectedTech === techId ? "isSelected" : ""
                        }`}>
                        <div className="fm-staff-requests__fifoMain">
                          <span className="fm-staff-requests__fifoRank">
                            #{index + 1}
                          </span>

                          <div>
                            <strong>{tech.full_name || "Technician"}</strong>

                            <small>
                              {tech.district || "No district"}
                              {tech.respondedAt
                                ? ` • ${formatDate(tech.respondedAt)}`
                                : ""}
                            </small>
                          </div>
                        </div>

                        <div className="fm-staff-requests__fifoActions">
                          <button
                            type="button"
                            className="fm-staff-requests__btn fm-staff-requests__btn--outline fm-staff-requests__btn--small"
                            onClick={() => setSelectedTech(techId)}>
                            Select
                          </button>

                          <button
                            type="button"
                            className="fm-staff-requests__btn fm-staff-requests__btn--primary fm-staff-requests__btn--small"
                            onClick={() =>
                              assignTech(selectedBooking._id, techId)
                            }>
                            Assign #{index + 1}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ) : null}

            <div className="fm-staff-requests__selectBlock">
              <DistrictTechSelect
                booking={selectedBooking}
                value={selectedTech}
                onChange={setSelectedTech}
              />
            </div>

            <div className="fm-staff-requests-modal__actions">
              {!selectedBooking.assignedTechnician ? (
                <button
                  type="button"
                  className="fm-staff-requests__btn fm-staff-requests__btn--primary"
                  onClick={() => assignTech(selectedBooking._id, selectedTech)}>
                  Assign Technician
                </button>
              ) : (
                <button
                  type="button"
                  className="fm-staff-requests__btn fm-staff-requests__btn--primary"
                  onClick={() =>
                    reassignTech(selectedBooking._id, selectedTech)
                  }>
                  Change Technician
                </button>
              )}

              <button
                type="button"
                className="fm-staff-requests__btn fm-staff-requests__btn--outline"
                onClick={() => setSelectedBooking(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
