// src/components/Chat/ChatPanel.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ensureConversation, listMessages, postMessage } from "../../services/chat.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./ChatPanel.css";

/**
 * Props:
 *  - booking   : booking object (must contain _id and assignedTechnician(_id))
 *  - onClose   : () => void (optional)
 *  - mode      : "inline" | "floating" (default "inline")
 *
 * Booking requirements:
 *  - technician id read from:
 *      booking.assignedTechnician?._id || booking.assignedTechnician
 *  - allowed statuses: coordinator_approved, in_progress (add "completed" if you want)
 */
const ALLOWED = new Set(["coordinator_approved"]); // add "completed" if desired

export default function ChatPanel({ booking, onClose, mode = "inline" }) {
  const { user } = useAuth();
  const myId = useMemo(() => String(user?.id || user?._id || ""), [user]);

  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [text, setText]         = useState("");

  const listRef = useRef(null);
  const pollRef = useRef(null);

  const techId =
    booking?.assignedTechnician?._id ||
    booking?.assignedTechnician || null;

  const status = String(booking?.status || "").toLowerCase();
  const allowed = !!techId && ALLOWED.has(status);

  // 1) Ensure (or reuse) a conversation scoped to this booking
  useEffect(() => {
    let dead = false;
    (async () => {
      if (!allowed) { setLoading(false); return; }
      try {
        const convo = await ensureConversation({
          bookingId: booking._id,
          withRole: "technician",
          withUserId: techId,
          topic: booking?.problemTitle || booking?.service?.name || "Booking chat",
        });
        if (!dead) setConversationId(convo?._id || convo?.id || null);
      } catch (e) {
        console.error(e);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [allowed, booking?._id, techId, booking?.problemTitle, booking?.service?.name]);

  // 2) Load messages + poll
  useEffect(() => {
    if (!conversationId) return;
    let abort = false;

    async function load() {
      try {
        const data = await listMessages(conversationId);
        if (!abort) setMessages(data);
      } catch { /* ignore softly */ }
    }
    load();
    pollRef.current = setInterval(load, 4000);

    return () => {
      abort = true;
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversationId]);

  // 3) Auto-scroll to last message
  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length]);

  async function send(e) {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !conversationId) return;
    setSending(true);
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      senderRole: "customer",
      senderId: myId,
      text: t,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((m) => [...m, optimistic]);

    try {
      const saved = await postMessage(conversationId, t);
      setMessages((m) => m.map(x => x._id === optimistic._id ? saved : x));
      setText("");
    } catch (e) {
      setMessages((m) => m.filter(x => x._id !== optimistic._id));
    } finally {
      setSending(false);
    }
  }

  const title =
    booking?.assignedTechnician?.full_name ||
    booking?.assignedTechnician?.name ||
    "Technician";

  const containerClass = `chat-wrap ${mode === "inline" ? "inline" : ""}`;

  return (
    <div className={containerClass} role={mode === "floating" ? "dialog" : undefined} aria-modal={mode === "floating" ? "true" : undefined}>
      <header className="chat-head">
        <div className="chat-head__title">
          <div className="dot online" />
          <div>
            <div className="t1">{title}</div>
            <div className="t2">
              {booking?.problemTitle || booking?.service?.name || "Service"}
            </div>
          </div>
        </div>
        {onClose && <button className="x" onClick={onClose} aria-label="Close">×</button>}
      </header>

      {!allowed ? (
        <div className="chat-empty">
          You can message your technician only while the booking is <b>approved</b>
        </div>
      ) : loading ? (
        <div className="chat-empty">Loading chat…</div>
      ) : (
        <>
          <div className="chat-list" ref={listRef}>
            {messages.map((m) => {
              const mine = String(m.senderId || "") === myId;
              return (
                <div key={m._id} className={`bubble ${mine ? "me" : "them"} ${m.optimistic ? "ghost" : ""}`}>
                  <div className="tx">{m.text}</div>
                  <div className="tm">
                    {(mine ? "You" : (m.senderRole || "tech"))}
                    {" • "}
                    {m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                    {m.optimistic ? " • sending…" : ""}
                  </div>
                </div>
              );
            })}
          </div>

          <form className="chat-input" onSubmit={send}>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a message…"
            />
            <button type="submit" disabled={sending || !text.trim()}>Send</button>
          </form>
        </>
      )}
    </div>
  );
}
