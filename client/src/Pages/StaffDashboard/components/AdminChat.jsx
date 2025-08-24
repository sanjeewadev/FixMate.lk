import React, { useEffect, useMemo, useRef, useState } from "react";
import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./AdminChat.css";

function fmtTime(s) {
  try { return new Date(s).toLocaleString(); } catch (s) { return s || ""; }
}
const RIGHT_ROLES = new Set(["admin","super_admin","coordinator"]);

export default function AdminChat() {
  const { role } = useAuth(); // "admin" | "super_admin" | "coordinator"

  // Conversations
  const [convos, setConvos] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errList, setErrList] = useState("");

  // Active conversation + messages
  const [activeId, setActiveId] = useState("");
  const [msgs, setMsgs] = useState([]);
  const [errMsgs, setErrMsgs] = useState("");
  const [showSpinner, setShowSpinner] = useState(false); // spinner only for first load

  // Composer
  const [text, setText] = useState("");

  // Refs
  const listRef = useRef(null);
  const pollRef = useRef(null);
  const initialLoadDoneRef = useRef(false);

  // ---------- Load my conversations ----------
  async function loadConversations() {
    try {
      setLoadingList(true); setErrList("");
      const { data } = await api.get("/api/chat/conversations");
      const arr = Array.isArray(data) ? data : [];
      setConvos(arr);
      if (!activeId && arr.length) setActiveId(arr[0]._id);
    } catch (e) {
      setErrList(e?.response?.data?.message || "Failed to load conversations");
    } finally {
      setLoadingList(false);
    }
  }

  // ---------- Load messages for active ----------
  async function loadMessages(id = activeId, isInitial = false) {
    if (!id) return;
    try {
      if (isInitial && !initialLoadDoneRef.current) setShowSpinner(true);
      setErrMsgs("");
      const { data } = await api.get("/api/chat/messages", { params: { conversationId: id } });
      setMsgs(Array.isArray(data) ? data : []);
      // autoscroll to bottom
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

  // initial conversations
  useEffect(() => { loadConversations(); }, []);

  // when active changes, do a "first" load with spinner once
  useEffect(() => {
    if (!activeId) return;
    initialLoadDoneRef.current = false;
    loadMessages(activeId, true);
  }, [activeId]);

  // polling (silent—no spinner)
  useEffect(() => {
    if (!activeId) return;
    pollRef.current = setInterval(() => loadMessages(activeId, false), 3500);
    return () => clearInterval(pollRef.current);
  }, [activeId]);

  // Active conversation (for quick lookup)
  const activeConvo = useMemo(
    () => (convos || []).find(c => c._id === activeId),
    [convos, activeId]
  );

  // Map (role:userId) -> display name from participants snapshot
  const nameMap = useMemo(() => {
    const map = {};
    (activeConvo?.participants || []).forEach(p => {
      map[`${p.role}:${String(p.userId)}`] = p.name || p.role;
    });
    return map;
  }, [activeConvo]);

  // Build sidebar list with proper names
  const sidebar = useMemo(() => {
    return (convos || []).map(c => {
      const other = (c.participants || []).find(p => !RIGHT_ROLES.has(p.role));
      const labelName =
        other?.name ||                           // ✅ use snapshot
        other?.userId?.full_name ||              // (if you ever populate)
        other?.full_name ||
        (other?.role ? other.role.charAt(0).toUpperCase() + other.role.slice(1) : "Conversation");

      const subtitle =
        c.booking?.problemTitle ||
        c.topic ||
        c.booking?._id ||
        "";

      return {
        id: c._id,
        label: labelName,
        role: other?.role || "",
        sub: subtitle,
        ts: c.updatedAt,
      };
    });
  }, [convos]);

  // Send message
  async function sendMessage(e) {
    e.preventDefault();
    if (!text.trim() || !activeId) return;
    const body = { conversationId: activeId, text: text.trim() };

    // optimistic
    const temp = {
      _id: `temp-${Date.now()}`,
      conversation: activeId,
      senderRole: role,
      senderId: "me", // local-only marker
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
      // polling will sync the real message (with ObjectId senderId)
    } catch (e) {
      setMsgs(prev => prev.filter(m => m._id !== temp._id));
      alert(e?.response?.data?.message || "Failed to send");
    }
  }

  return (
    <div className="admin-chat">
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
                const mine = RIGHT_ROLES.has(m.senderRole);
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
