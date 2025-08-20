// src/components/Chat/ChatLauncher.jsx
import React, { useState } from "react";
import { ensureConversation } from "../../services/chat";
import ChatWindow from "ChatWindow.jsx";

export default function ChatLauncher({ withRole, withUserId, topic = "General support", label = "Chat" }) {
  const [convo, setConvo] = useState(null);
  const [peer, setPeer] = useState(null);
  const [err, setErr] = useState(null);

  const startChat = async () => {
    try {
      const c = await ensureConversation({ withRole, withUserId, topic });
      setConvo(c);
      setPeer({ _id: withUserId, role: withRole, full_name: "Support" });
      setErr(null);
    } catch (e) {
      setErr(e?.response?.data?.message || "Unable to start chat");
    }
  };

  return (
    <>
      <button className="pill-btn" onClick={startChat}>{label}</button>
      {err && <div className="msg error">{err}</div>}
      {convo && <ChatWindow conversation={convo} peer={peer} onClose={() => setConvo(null)} />}
    </>
  );
}