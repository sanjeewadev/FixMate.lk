import React, { useEffect, useMemo, useRef, useState } from "react";
import { ensureConversation, listMessages, postMessage } from "../../services/chat";
import { listSupportStaff } from "../../services/support";
import { useAuth } from "../../context/AuthContext.jsx";
import "./chat.css"; // reuse your existing chat styles

const POLL_MS = 4000;

export default function TeamChatWindow() {
  const { user } = useAuth();
  const myId = useMemo(() => String(user?.id || user?._id || ""), [user]);

  const [staff, setStaff] = useState([]);       // { _id, full_name, role, ... } (coordinators/admins)
  const [convos, setConvos] = useState({});     // staffId -> conversationId
  const [messages, setMessages] = useState([]); // merged stream
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const pollRef = useRef(null);
  const endRef = useRef(null);
  const sentCache = useRef(new Set()); // collapse our own fan-out echoes

  /* 1) fetch staff directory */
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const all = await listSupportStaff();
        const filtered = (all || []).filter(s => s.role === "coordinator" || s.role === "admin");
        if (!dead) setStaff(filtered);
      } catch (e) {
        if (!dead) console.error("load staff failed:", e);
      }
    })();
    return () => { dead = true; };
  }, []);

  /* 2) ensure/reuse a 1:1 conversation for each staff member */
  useEffect(() => {
    if (!staff.length) { setLoading(false); return; }
    let dead = false;
    (async () => {
      try {
        const pairs = await Promise.all(
          staff.map(async (s) => {
            const c = await ensureConversation({ withRole: s.role, withUserId: s._id, topic: "Support Team" });
            return [String(s._id), c?._id || c?.id];
          })
        );
        if (!dead) setConvos(Object.fromEntries(pairs.filter(([, id]) => !!id)));
      } catch (e) {
        if (!dead) console.error("ensure conversations failed:", e);
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => { dead = true; };
  }, [staff]);

  /* 3) poll every convo and MERGE messages */
  useEffect(() => {
    if (!Object.keys(convos).length) return;
    let abort = false;

    const fetchAll = async () => {
      try {
        const all = await Promise.all(
          Object.entries(convos).map(async ([staffId, convoId]) => {
            const msgs = await listMessages(convoId);
            return msgs.map(m => ({ ...m, __staffId: staffId, __convoId: convoId }));
          })
        );
        const flat = all.flat();
        const merged = mergeAndDedupe(flat, myId, sentCache.current);
        if (!abort) setMessages(merged);
      } catch (e) {
        if (!abort) console.error(e);
      }
    };

    fetchAll();
    pollRef.current = setInterval(fetchAll, POLL_MS);
    return () => { abort = true; if (pollRef.current) clearInterval(pollRef.current); };
  }, [convos, myId]);

  /* 4) autoscroll */
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const labelFor = (m) => {
    if (String(m.senderId) === myId) return "You";
    const s = staff.find(x => String(x._id) === String(m.__staffId));
    return s?.full_name || m.senderRole || "staff";
    // if you want role too: `${s?.full_name || "staff"} (${m.senderRole})`
  };

  const onSubmit = async (e) => {
    e?.preventDefault();
    const t = text.trim();
    if (!t || !Object.keys(convos).length) return;

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      senderRole: "customer",
      senderId: myId,
      text: t,
      createdAt: new Date().toISOString(),
      optimistic: true
    };
    setMessages((prev) => [...prev, optimistic]);
    sentCache.current.add(keyMe(myId, t, optimistic.createdAt));

    setSending(true);
    try {
      await Promise.all(Object.values(convos).map((cid) => postMessage(cid, t))); // fan-out
      setText("");
    } catch (e) {
      setMessages((prev) => prev.filter(x => x._id !== optimistic._id));
      console.error("send failed:", e);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="chatBox fontBody">
      <div className="chatHead">
        <div className="chatPeer">
          <div className="avatar"><span>S</span></div>
          <div className="peerMeta">
            <div className="chatTitle fontHeading">Support Team</div>
            <div className="chatSub">coordinators & admins</div>
          </div>
        </div>
      </div>

      <div className="chatBody">
        {loading && <div className="chatInfo">Connecting to support…</div>}
        {!loading && !staff.length && (
          <div className="chatInfo">Support is currently offline. Please try again later.</div>
        )}

        {messages.map((m) => {
          const mine = String(m.senderId) === myId;
          return (
            <div key={m._id} className={`msgRow ${mine ? "mine" : ""}`}>
              <div className="bubble">
                <div className="msgText">{m.text}</div>
                <div className="msgMeta">
                  {labelFor(m)} • {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                  {m.optimistic && <em> • sending…</em>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message…"
          aria-label="Message"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSubmit(e)}
        />
        <button type="submit" className="sendButton" disabled={sending || !text.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}

/* ----- helpers to collapse our fan-out duplicates ----- */
function roundToBucket(iso, bucketSec = 30) {
  const t = new Date(iso).getTime();
  const b = Math.floor(t / (bucketSec * 1000)) * (bucketSec * 1000);
  return new Date(b).toISOString();
}
function keyMe(myId, text, createdAt) {
  return `${myId}::${text.trim()}::${roundToBucket(createdAt)}`;
}
function mergeAndDedupe(flatMsgs, myId, sentCache) {
  const out = [];
  const keptMine = new Set();
  for (const m of flatMsgs) {
    const mine = String(m.senderId) === myId;
    if (mine) {
      const k = keyMe(myId, m.text || "", m.createdAt);
      if (sentCache.has(k)) {
        if (keptMine.has(k)) continue;
        keptMine.add(k);
      }
    }
    out.push(m);
  }
  out.sort((a,b) => new Date(a.createdAt) - new Date(b.createdAt));
  return out;
}
