import React, { useEffect, useRef, useState } from "react";
import api from "../../lib/api";
import "./ChatPanel.css";

/**
 * Props:
 *  - booking   : booking object (must contain _id and a technician id somewhere)
 *  - onClose   : () => void
 *
 * Requirements on booking:
 *  - technician id will be read from:
 *      booking.technician?._id || booking.technicianId || booking.assignedTechnicianId
 *  - allowed statuses are checked by the parent (we also guard inside)
 */
export default function ChatPanel({ booking, onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [text, setText]         = useState("");

  const listRef = useRef(null);
  const pollRef = useRef(null);

  const techId =
    booking?.technician?._id ||
    booking?.technicianId ||
    booking?.assignedTechnicianId;

  // guard
  const status = String(booking?.status || "").toLowerCase();
  const allowed =
    ["approved", "assigned", "scheduled", "in_progress"].some(s =>
      status.includes(s)
    ) && !!techId;

  // 1) Ensure (or reuse) a conversation
  useEffect(() => {
    let dead = false;

    async function ensure() {
      if (!allowed) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.post("/api/chat/ensure", {
          bookingId: booking._id,
          withRole: "technician",
          withUserId: techId,
          topic: booking?.service?.name || booking?.serviceName || "Service chat",
        });
        if (!dead) setConversationId(data._id || data.id);
      } catch (e) {
        console.error(e);
      } finally {
        if (!dead) setLoading(false);
      }
    }

    ensure();
    return () => { dead = true; };
  }, [booking?._id]);

  // 2) Load messages + poll every 6s
  useEffect(() => {
    if (!conversationId) return;

    let abort = false;

    const load = async () => {
      try {
        const { data } = await api.get("/api/chat/messages", {
          params: { conversationId },
        });
        if (!abort) setMessages(Array.isArray(data) ? data : []);
      } catch (e) {
        /* ignore softly */
      }
    };

    load();
    pollRef.current = setInterval(load, 6000);

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

  const send = async (e) => {
    e?.preventDefault();
    if (!text.trim() || !conversationId) return;
    setSending(true);
    try {
      // optimistic UI
      const optimistic = {
        _id: `tmp-${Date.now()}`,
        senderRole: "customer",
        senderId: "me",
        text,
        createdAt: new Date().toISOString(),
        optimistic: true,
      };
      setMessages((m) => [...m, optimistic]);

      await api.post("/api/chat/message", {
        conversationId,
        text: text.trim(),
      });

      setText("");
      // next poll will replace optimistic with real one; we could also manual-refresh
    } catch (e) {
      // drop optimistic on error
      setMessages((m) => m.filter((x) => !x.optimistic));
    } finally {
      setSending(false);
    }
  };

  const title =
    booking?.technician?.full_name ||
    booking?.technician?.name ||
    "Technician";

  return (
    <div className="chat-wrap" role="dialog" aria-modal="true">
      <header className="chat-head">
        <div className="chat-head__title">
          <div className="dot online" />
          <div>
            <div className="t1">{title}</div>
            <div className="t2">
              {booking?.service?.name || booking?.serviceName || "Service"}
            </div>
          </div>
        </div>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
      </header>

      {!allowed ? (
        <div className="chat-empty">
          You can message the technician after your request is **approved**
          and until the job is **completed**.
        </div>
      ) : loading ? (
        <div className="chat-empty">Loading chat…</div>
      ) : (
        <>
          <div className="chat-list" ref={listRef}>
            {messages.map((m) => {
              const mine = String(m.senderRole).toLowerCase() === "customer";
              return (
                <div key={m._id} className={`bubble ${mine ? "me" : "them"} ${m.optimistic ? "ghost" : ""}`}>
                  <div className="tx">{m.text}</div>
                  <div className="tm">
                    {new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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