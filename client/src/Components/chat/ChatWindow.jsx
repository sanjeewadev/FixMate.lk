import React, { useEffect, useMemo, useRef, useState } from "react";
import useChat from "../../hooks/useChat.js";
import { useAuth } from "../../context/AuthContext.jsx";
import "./chat.css";

export default function ChatWindow({ conversation, peer, onClose }) {
  const { user } = useAuth();
  const { messages, loading, error, send } = useChat(conversation?._id, 2000);
  const [text, setText] = useState("");
  const endRef = useRef(null);

  const myId = useMemo(() => String(user?.id || user?._id || ""), [user]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const title = peer?.full_name || peer?.email || "Support";
  const subtitle = (peer?.role || "").replace("_", " ");

  const onSubmit = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    try {
      await send(t);
      setText("");
    } catch (e2) {
      alert(e2?.response?.data?.message || "Send failed");
    }
  };

  return (
    <div className="chatBox fontBody">
      <div className="chatHead">
        <div className="chatPeer">
          <div className="avatar">
            {peer?.profile_image_url ? (
              <img src={peer.profile_image_url} alt={title} />
            ) : (
              <span>{(peer?.full_name?.[0] || "S").toUpperCase()}</span>
            )}
          </div>
          <div className="peerMeta">
            <div className="chatTitle fontHeading">{title}</div>
            <div className="chatSub">{subtitle}</div>
          </div>
        </div>
        {onClose && (
          <button className="closeBtn" onClick={onClose} aria-label="Close">×</button>
        )}
      </div>

      <div className="chatBody">
        {loading && <div className="chatInfo">Loading…</div>}
        {error && <div className="chatError">{error}</div>}

        {messages.map((m) => {
          const mine = m.senderId ? String(m.senderId) === myId : false;
          return (
            <div key={m._id} className={`msgRow ${mine ? "mine" : ""}`}>
              <div className="bubble">
                <div className="msgText">{m.text}</div>
                <div className="msgMeta">
                  {mine ? "You" : (m.senderRole || "staff")} • {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                  {m.pending && <em> • sending…</em>}
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
        <button type="submit" className="sendButton">Send</button>
      </form>
    </div>
  );
}
