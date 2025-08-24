// src/Components/AIChat/AIChatWidget.jsx
import { useEffect, useRef, useState } from "react";
import { aiChat } from "../../services/ai";
import "./AIChat.css";

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the FixMate Assistant. Ask me about our services, bookings, or troubleshooting tips. I’ll answer using our official knowledge only.",
      sources: [],
    },
  ]);

  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages.length, open]);

  const send = async (e) => {
    e?.preventDefault();
    const msg = input.trim();
    if (!msg || busy) return;
    setErr(null);

    // optimistic append
    const nextHistory = [...messages, { role: "user", content: msg }];
    setMessages(nextHistory);
    setInput("");
    setBusy(true);

    try {
      const { answer, sources } = await aiChat({
        message: msg,
        history: nextHistory.map(({ role, content }) => ({ role, content })),
      });

      setMessages((m) => [
        ...m,
        { role: "assistant", content: answer || "…", sources: sources || [] },
      ]);
    } catch (e) {
      setErr(e?.response?.data?.message || "Failed to reach AI service.");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: "Sorry—something went wrong. Please try again in a moment.",
          sources: [],
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        className="ai-fab"
        aria-label="Open AI assistant"
        onClick={() => setOpen((o) => !o)}
        type="button"
      >
        {open ? "×" : "AI"}
      </button>

      {open && (
        <div className="ai-panel" role="dialog" aria-modal="true">
          <header className="ai-head">
            <div className="ai-title">
              <span className="dot online" />
              FixMate Assistant
            </div>
            <button className="x" onClick={() => setOpen(false)} aria-label="Close" type="button">
              ×
            </button>
          </header>

          <div className="ai-body" ref={listRef}>
            {messages.map((m, i) => (
              <Message key={i} {...m} />
            ))}
            {err && <div className="ai-msg error">{err}</div>}
          </div>

          <form className="ai-input" onSubmit={send}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={busy ? "Thinking…" : "Ask about services, bookings…"}
              disabled={busy}
            />
            <button type="submit" disabled={busy || !input.trim()}>
              {busy ? "…" : "Send"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function Message({ role, content, sources = [] }) {
  const mine = role === "user";
  return (
    <div className={`ai-bubble ${mine ? "me" : "bot"}`}>
      <div className="tx">{content}</div>
      {!mine && sources?.length > 0 && (
        <div className="ai-sources">
          {sources.map((s) => (
            <span key={s.id} className="badge" title={`${s.source} • score ${s.score}`}>
              [{s.n}]
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
