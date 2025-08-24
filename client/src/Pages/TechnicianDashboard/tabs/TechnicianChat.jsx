import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../../lib/api";
import "./TechnicianChat.css";

const MINE = "technician"; // align right if senderRole === 'technician'
const fmtTime = (s) => { try { return new Date(s).toLocaleString(); } catch { return s || ""; } };

export default function TechnicianChat() {
  const [search] = useSearchParams();
  const convoIdParam = search.get("convoId") || "";
  const bookingIdParam = search.get("bookingId") || "";

  // conversations
  const [convos, setConvos] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errList, setErrList] = useState("");

  // active conversation/messages
  const [activeId, setActiveId] = useState(convoIdParam);
  const [msgs, setMsgs] = useState([]);
  const [errMsgs, setErrMsgs] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);

  // composer
  const [text, setText] = useState("");

  // refs
  const listRef = useRef(null);
  const pollRef = useRef(null);
  const initialLoadDoneRef = useRef(false);

  // ---- Load my conversations ----
  async function loadConversations(opts = {}) {
    try {
      setLoadingList(true); setErrList("");
      const params = {};
      if (opts.bookingOnly && bookingIdParam) params.bookingId = bookingIdParam;
      const { data } = await api.get("/api/chat/conversations", { params });
      const arr = Array.isArray(data) ? data : [];
      setConvos(arr);
      if (!activeId && arr.length) setActiveId(arr[0]._id);
    } catch (e) {
      setErrList(e?.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoadingList(false);
    }
  }

  // If we have a bookingId but no convoId, ensure the convo with the customer and then select it
  async function ensureFromBooking() {
    if (!bookingIdParam || activeId) return;
    try {
      const { data: b } = await api.get(`/api/bookings/${bookingIdParam}`); // allowed for assigned tech
      const customerId = b?.customer;
      if (customerId) {
        const { data: convo } = await api.post("/api/chat/conversations", {
          bookingId: bookingIdParam,
          withRole: "customer",
          withUserId: customerId,
        });
        setActiveId(convo._id);
      }
    } catch {
      // silently ignore – user can still pick a convo from the list
    }
  }

  // ---- Load messages for active ----
  async function loadMessages(id = activeId, isInitial = false) {
    if (!id) return;
    try {
      if (isInitial && !initialLoadDoneRef.current) setShowSpinner(true);
      setErrMsgs("");
      const { data } = await api.get("/api/chat/messages", { params: { conversationId: id } });
      setMsgs(Array.isArray(data) ? data : []);
      requestAnimationFrame(() => {
        if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
      });
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to load messages";
      setErrMsgs(msg);
      setMsgs([]);
      if (msg === "Forbidden" && pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    } finally {
      if (isInitial) {
        initialLoadDoneRef.current = true;
        setShowSpinner(false);
      }
    }
  }

  // initial: create/select convo if bookingId provided, then load all convos
  useEffect(() => {
    (async () => {
      if (!convoIdParam && bookingIdParam) await ensureFromBooking();
      await loadConversations(); // list all my convos
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // when active changes, run first-load with spinner
  useEffect(() => {
    if (!activeId) return;
    initialLoadDoneRef.current = false;
    loadMessages(activeId, true);
  }, [activeId]);

  // polling
  useEffect(() => {
    if (!activeId) return;
    pollRef.current = setInterval(() => loadMessages(activeId, false), 3500);
    return () => clearInterval(pollRef.current);
  }, [activeId]);

  // active convo lookup
  const activeConvo = useMemo(
    () => (convos || []).find(c => c._id === activeId),
    [convos, activeId]
  );

  // role:name map for participants
  const nameMap = useMemo(() => {
    const map = {};
    (activeConvo?.participants || []).forEach(p => {
      map[`${p.role}:${String(p.userId)}`] = p.name || p.role;
    });
    return map;
  }, [activeConvo]);

  // sidebar list: show the "other" participant (non-technician)
  const sidebar = useMemo(() => {
    return (convos || []).map(c => {
      const other = (c.participants || []).find(p => p.role !== MINE) || {};
      const label =
        other?.name ||
        other?.userId?.full_name ||
        other?.full_name ||
        (other?.role ? other.role.charAt(0).toUpperCase() + other.role.slice(1) : "Conversation");

      const subtitle =
        c.booking?.problemTitle ||
        c.topic ||
        c.booking?._id ||
        "";

      return { id: c._id, label, role: other?.role || "", sub: subtitle, ts: c.updatedAt };
    });
  }, [convos]);

  // send message
  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    const body = { conversationId: activeId, text: text.trim() };

    // optimistic
    const temp = {
      _id: `temp-${Date.now()}`,
      conversation: activeId,
      senderRole: MINE,
      senderId: "me",
      text: text.trim(),
      createdAt: new Date().toISOString()
    };
    setMsgs(prev => [...prev, temp]);
    setText("");
    requestAnimationFrame(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    });

    try {
      await api.post("/api/chat/messages", body);
      // polling will sync real message
    } catch (e) {
      setMsgs(prev => prev.filter(m => m._id !== temp._id));
      alert(e?.response?.data?.message || "Failed to send");
    }
  }

  return (
    <div className="tech-chat">
      {/* Sidebar */}
      <aside className="ac-sidebar">
        <div className="ac-head">Conversations</div>
        <div className="ac-list">
          {loadingList && <div className="muted small pad">Loading…</div>}
          {errList && <div className="err pad">{errList}</div>}
          {!loadingList && !errList && sidebar.length === 0 && (
            <div className="muted small pad">No conversations yet.</div>
          )}

          {sidebar.map(item => (
            <button
              key={item.id}
              className={`ac-item ${activeId === item.id ? "active" : ""}`}
              onClick={() => setActiveId(item.id)}
              title={item.sub}
            >
              <div className="ac-row">
                <div className="ac-title">
                  {item.label}
                  {item.role ? <span className="ac-role"> · {item.role}</span> : null}
                </div>
                <div className="ac-time tiny muted">{fmtTime(item.ts)}</div>
              </div>
              {item.sub ? <div className="ac-sub">{item.sub}</div> : null}
            </button>
          ))}
        </div>
      </aside>

      {/* Chat body */}
      <section className="ac-body">
        {!activeId ? (
          <div className="ac-empty">Select a conversation</div>
        ) : (
          <>
            <div className="ac-messages" ref={listRef}>
              {showSpinner && <div className="muted small pad">Loading…</div>}
              {!showSpinner && errMsgs && <div className="err pad">{errMsgs}</div>}
              {!showSpinner && !errMsgs && msgs.length === 0 && (
                <div className="muted small pad">No messages yet.</div>
              )}

              {msgs.map(m => {
                const mine = m.senderRole === MINE;
                const key = `${m.senderRole}:${String(m.senderId)}`;
                const senderName =
                  m.senderId === "me"
                    ? "You"
                    : (nameMap[key] || (mine ? "You" : m.senderRole));
                return (
                  <div key={m._id} className={`bubble-row ${mine ? "right" : "left"}`}>
                    {!mine && <div className="role-tag">{senderName}</div>}
                    <div className={`bubble ${mine ? "mine" : ""}`}>
                      <div className="text">{m.text}</div>
                      <div className="meta tiny muted">
                        {senderName} • {fmtTime(m.createdAt)}
                      </div>
                    </div>
                    {mine && <div className="role-tag">{senderName}</div>}
                  </div>
                );
              })}
            </div>

            <form className="ac-input" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Type your message…"
                value={text}
                onChange={e => setText(e.target.value)}
              />
              <button className="btn send" disabled={!text.trim()}>Send</button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
