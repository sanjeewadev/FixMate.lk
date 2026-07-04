import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  MessageSquare,
  RefreshCw,
  Search,
  Send,
  UserRound,
  Wrench,
} from "lucide-react";

import { getMyBookingsForCustomer } from "../../../services/booking.js";
import {
  ensureConversation,
  listMessages,
  postMessage,
} from "../../../services/chat.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./ChatTech.css";

const ALLOWED = new Set(["coordinator_approved"]);
const POLL_MS = 4000;

function getTechId(booking) {
  return (
    booking?.assignedTechnician?._id || booking?.assignedTechnician || null
  );
}

function getTechName(booking) {
  return (
    booking?.assignedTechnician?.full_name ||
    booking?.assignedTechnician?.name ||
    "Technician"
  );
}

function getServiceName(booking) {
  return booking?.service?.name || booking?.serviceName || "Service";
}

function formatStatus(value) {
  return String(value || "").replaceAll("_", " ");
}

function formatTime(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function getInitial(name = "T") {
  return String(name || "T")
    .charAt(0)
    .toUpperCase();
}

export default function ChatTech() {
  const { user } = useAuth();

  const myId = useMemo(() => String(user?.id || user?._id || ""), [user]);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState(null);

  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const listRef = useRef(null);
  const pollRef = useRef(null);

  async function loadBookings() {
    try {
      setLoading(true);
      setMsg(null);

      const mine = await getMyBookingsForCustomer();

      const eligible = (mine || []).filter((booking) => {
        const hasTechnician = Boolean(getTechId(booking));
        const status = String(booking.status || "").toLowerCase();

        return hasTechnician && ALLOWED.has(status);
      });

      setBookings(eligible);

      if (!activeId && eligible[0]) {
        setActiveId(eligible[0]._id);
      }
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message ||
          error.message ||
          "Failed to load technician chats.",
      });
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let dead = false;

    async function run() {
      if (dead) return;
      await loadBookings();
    }

    run();

    return () => {
      dead = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (!value) return true;

      const service = booking?.service?.name || booking?.serviceName || "";
      const title = booking?.problemTitle || "";
      const tech = getTechName(booking);

      return [service, title, tech].some((item) =>
        String(item).toLowerCase().includes(value),
      );
    });
  }, [bookings, query]);

  const active = useMemo(() => {
    return (
      filtered.find((booking) => String(booking._id) === String(activeId)) ||
      null
    );
  }, [activeId, filtered]);

  const activeTechId = useMemo(() => getTechId(active), [active]);

  useEffect(() => {
    setConversationId(null);
    setMessages([]);
    setChatError("");
    setText("");

    if (!active || !activeTechId) return undefined;

    let dead = false;

    async function prepareConversation() {
      try {
        setChatLoading(true);
        setChatError("");

        const conversation = await ensureConversation({
          bookingId: active._id,
          withRole: "technician",
          withUserId: activeTechId,
          topic:
            active?.problemTitle || getServiceName(active) || "Booking chat",
        });

        if (!dead) {
          setConversationId(conversation?._id || conversation?.id || null);
        }
      } catch (error) {
        if (!dead) {
          setChatError(
            error?.response?.data?.message || "Failed to open technician chat.",
          );
        }
      } finally {
        if (!dead) {
          setChatLoading(false);
        }
      }
    }

    prepareConversation();

    return () => {
      dead = true;
    };
  }, [active, activeTechId]);

  useEffect(() => {
    if (!conversationId) return undefined;

    let abort = false;

    async function loadMessages() {
      try {
        const data = await listMessages(conversationId);

        if (!abort) {
          setMessages(Array.isArray(data) ? data : []);
          setChatError("");
        }
      } catch (error) {
        if (!abort) {
          setChatError(
            error?.response?.data?.message || "Failed to load chat messages.",
          );
        }
      }
    }

    loadMessages();
    pollRef.current = setInterval(loadMessages, POLL_MS);

    return () => {
      abort = true;

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [conversationId]);

  useEffect(() => {
    if (!listRef.current) return;

    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  async function sendMessage(event) {
    event?.preventDefault();

    const trimmed = text.trim();

    if (!trimmed || !conversationId) return;

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      senderRole: "customer",
      senderId: myId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((current) => [...current, optimistic]);
    setText("");
    setSending(true);

    try {
      const saved = await postMessage(conversationId, trimmed);

      setMessages((current) =>
        current.map((message) =>
          message._id === optimistic._id ? saved : message,
        ),
      );
    } catch (error) {
      setMessages((current) =>
        current.filter((message) => message._id !== optimistic._id),
      );

      setChatError(
        error?.response?.data?.message ||
          "Failed to send message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="fm-user-tech-chat">
      <div className="fm-user-tech-chat__header">
        <div>
          <span className="fm-user-tech-chat__eyebrow">Booking Chat</span>

          <h1>Chat with Technician</h1>

          <p>
            Chat with the technician assigned to your approved booking. Only
            approved bookings with an assigned technician are shown here.
          </p>
        </div>

        <button
          type="button"
          className="fm-user-tech-chat__btn fm-user-tech-chat__btn--outline"
          onClick={loadBookings}
          disabled={loading}>
          <RefreshCw size={16} />
          {loading ? "Refreshing" : "Refresh"}
        </button>
      </div>

      {msg?.text ? (
        <div
          className={`fm-user-tech-chat__notice fm-user-tech-chat__notice--${msg.type}`}>
          <AlertCircle size={16} />
          <span>{msg.text}</span>
        </div>
      ) : null}

      <div className="fm-user-tech-chat__layout">
        <aside className="fm-user-tech-chat__left">
          <div className="fm-user-tech-chat__leftHeader">
            <div>
              <span>Approved bookings</span>
              <h2>Technician Chats</h2>
            </div>
          </div>

          <div className="fm-user-tech-chat__search">
            <Search size={16} />

            <input
              placeholder="Search service, problem, or technician"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>

          {loading ? (
            <div className="fm-user-tech-chat__state">
              <RefreshCw size={22} />
              <strong>Loading chats</strong>
              <span>Please wait while your approved bookings are loaded.</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="fm-user-tech-chat__state">
              <MessageSquare size={22} />
              <strong>No active technician chats</strong>
              <span>No approved bookings with assigned technicians yet.</span>
            </div>
          ) : (
            <ul className="fm-user-tech-chat__list">
              {filtered.map((booking) => {
                const techName = getTechName(booking);
                const activeItem = String(booking._id) === String(activeId);

                return (
                  <li key={booking._id}>
                    <button
                      type="button"
                      className={`fm-user-tech-chat__item ${
                        activeItem ? "isActive" : ""
                      }`}
                      onClick={() => setActiveId(booking._id)}>
                      <span className="fm-user-tech-chat__itemIcon">
                        <Wrench size={16} />
                      </span>

                      <span className="fm-user-tech-chat__itemMain">
                        <strong>
                          {booking.problemTitle || getServiceName(booking)}
                        </strong>

                        <small>
                          <em>{formatStatus(booking.status)}</em>
                          {getServiceName(booking)
                            ? ` · ${getServiceName(booking)}`
                            : ""}
                        </small>
                      </span>

                      <span className="fm-user-tech-chat__tech">
                        {booking.assignedTechnician?.profile_image_url ? (
                          <img
                            src={booking.assignedTechnician.profile_image_url}
                            alt={techName}
                            onError={(event) => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        ) : (
                          <span>{getInitial(techName)}</span>
                        )}

                        <small>{techName}</small>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        <main className="fm-user-tech-chat__right">
          {!active ? (
            <div className="fm-user-tech-chat__emptyPanel">
              <MessageSquare size={26} />
              <strong>Select a booking</strong>
              <span>
                Select a booking to chat with your assigned technician.
              </span>
            </div>
          ) : (
            <section className="fm-user-tech-chat__chatBox">
              <header className="fm-user-tech-chat__chatHead">
                <div className="fm-user-tech-chat__peer">
                  <span className="fm-user-tech-chat__peerAvatar">
                    {active?.assignedTechnician?.profile_image_url ? (
                      <img
                        src={active.assignedTechnician.profile_image_url}
                        alt={getTechName(active)}
                      />
                    ) : (
                      <UserRound size={17} />
                    )}
                  </span>

                  <div>
                    <h2>{getTechName(active)}</h2>
                    <p>{active.problemTitle || getServiceName(active)}</p>
                  </div>
                </div>
              </header>

              {chatError ? (
                <div className="fm-user-tech-chat__notice fm-user-tech-chat__notice--error">
                  <AlertCircle size={16} />
                  <span>{chatError}</span>
                </div>
              ) : null}

              <div className="fm-user-tech-chat__messages" ref={listRef}>
                {chatLoading ? (
                  <div className="fm-user-tech-chat__state">
                    <RefreshCw size={22} />
                    <strong>Opening chat</strong>
                    <span>Please wait while the conversation is prepared.</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="fm-user-tech-chat__state">
                    <MessageSquare size={22} />
                    <strong>No messages yet</strong>
                    <span>Send a message to start the conversation.</span>
                  </div>
                ) : (
                  messages.map((message) => {
                    const mine = String(message.senderId || "") === myId;

                    return (
                      <div
                        key={message._id}
                        className={`fm-user-tech-chat__message ${
                          mine ? "isMine" : ""
                        } ${message.optimistic ? "isSending" : ""}`}>
                        <div className="fm-user-tech-chat__bubble">
                          <p>{message.text}</p>

                          <span>
                            {mine ? "You" : message.senderRole || "Technician"}
                            {" · "}
                            {formatTime(message.createdAt)}
                            {message.optimistic ? " · sending..." : ""}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <form
                className="fm-user-tech-chat__composer"
                onSubmit={sendMessage}>
                <input
                  type="text"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="Write a message"
                  disabled={!conversationId || chatLoading}
                />

                <button
                  type="submit"
                  disabled={
                    sending || !text.trim() || !conversationId || chatLoading
                  }>
                  <Send size={16} />
                  {sending ? "Sending" : "Send"}
                </button>
              </form>
            </section>
          )}
        </main>
      </div>
    </section>
  );
}
