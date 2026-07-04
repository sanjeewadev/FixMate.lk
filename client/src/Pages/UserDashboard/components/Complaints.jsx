import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Eye,
  Headphones,
  MessageSquareText,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { listMyComplaints } from "../../../services/complaints";
import "./Complaints.css";

function formatDateTime(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function formatStatus(value) {
  return String(value || "open").replaceAll("_", " ");
}

function getStatusClass(value) {
  const status = String(value || "").toLowerCase();

  if (status.includes("resolved")) return "isResolved";
  if (status.includes("closed")) return "isClosed";
  if (status.includes("progress")) return "isProgress";

  return "isOpen";
}

function formatRole(value) {
  if (!value) return "Staff";

  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Complaints() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const pollRef = useRef(null);
  const navigate = useNavigate();

  const loadComplaints = useCallback(async () => {
    try {
      const list = await listMyComplaints();
      setItems(Array.isArray(list) ? list : []);
      setMsg(null);
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message ||
          error.message ||
          "Failed to load complaints.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let dead = false;

    async function run() {
      if (dead) return;
      await loadComplaints();
    }

    run();
    pollRef.current = setInterval(run, 8000);

    return () => {
      dead = true;

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [loadComplaints]);

  return (
    <section className="fm-user-complaints">
      <div className="fm-user-complaints__header">
        <div>
          <span className="fm-user-complaints__eyebrow">Customer Care</span>

          <h1>My Complaints</h1>

          <p>
            Review complaints you submitted, check staff responses, and continue
            the discussion through support chat when needed.
          </p>
        </div>

        <button
          type="button"
          className="fm-user-complaints__btn fm-user-complaints__btn--outline"
          onClick={loadComplaints}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {msg?.text ? (
        <div
          className={`fm-user-complaints__notice fm-user-complaints__notice--${msg.type}`}>
          <AlertCircle size={16} />
          <span>{msg.text}</span>
        </div>
      ) : null}

      <section className="fm-user-complaints__card">
        <div className="fm-user-complaints__cardHeader">
          <div>
            <span>Complaint records</span>
            <h2>Submitted Complaints</h2>
          </div>
        </div>

        {loading ? (
          <div className="fm-user-complaints__empty">
            <RefreshCw size={24} />
            <strong>Loading complaints</strong>
            <span>Please wait while your complaints are loaded.</span>
          </div>
        ) : items.length === 0 ? (
          <div className="fm-user-complaints__empty">
            <TriangleAlert size={24} />
            <strong>No complaints yet</strong>
            <span>Your submitted complaints will appear here.</span>
          </div>
        ) : (
          <div className="fm-user-complaints__list">
            {items.map((complaint) => (
              <article className="fm-user-complaints__item" key={complaint._id}>
                <header className="fm-user-complaints__itemHeader">
                  <div>
                    <div className="fm-user-complaints__titleRow">
                      <h3>{complaint.title || "Complaint"}</h3>

                      <span
                        className={`fm-user-complaints__status ${getStatusClass(
                          complaint.status,
                        )}`}>
                        {formatStatus(complaint.status)}
                      </span>
                    </div>

                    {complaint.details ? <p>{complaint.details}</p> : null}
                  </div>

                  {complaint.booking ? (
                    <button
                      type="button"
                      className="fm-user-complaints__linkBtn"
                      onClick={() =>
                        navigate(`/UserDashboard/booking/${complaint.booking}`)
                      }>
                      <Eye size={14} />
                      View booking
                    </button>
                  ) : null}
                </header>

                <div className="fm-user-complaints__thread">
                  {(complaint.responses || []).length === 0 ? (
                    <div className="fm-user-complaints__threadEmpty">
                      <MessageSquareText size={18} />
                      <span>No responses yet.</span>
                    </div>
                  ) : (
                    (complaint.responses || []).map((response, index) => {
                      const mine = response.byRole === "customer";

                      return (
                        <div
                          className={`fm-user-complaints__bubble ${
                            mine ? "isMine" : "isThem"
                          }`}
                          key={`${complaint._id}-${index}`}>
                          <div className="fm-user-complaints__by">
                            {mine ? "You" : formatRole(response.byRole)}
                            {response.byName ? ` (${response.byName})` : ""}
                            {response.at
                              ? ` · ${formatDateTime(response.at)}`
                              : ""}
                          </div>

                          <div className="fm-user-complaints__text">
                            {response.text}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                <footer className="fm-user-complaints__footer">
                  <button
                    type="button"
                    className="fm-user-complaints__btn fm-user-complaints__btn--outline"
                    onClick={() => navigate("/UserDashboard/support")}>
                    <Headphones size={15} />
                    Discuss in Support chat
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
