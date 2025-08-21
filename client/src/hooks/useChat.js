// src/hooks/useChat.js
import { useEffect, useRef, useState } from "react";
import { listMessages, postMessage } from "../services/chat";

export default function useChat(conversationId, pollMs = 2000) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const timerRef = useRef(null);

  async function load() {
    try {
      const data = await listMessages(conversationId);
      setMessages(data);
      setError(null);
    } catch (e) {
      setError(e?.response?.data?.message || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    load();
    timerRef.current = setInterval(load, pollMs);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function send(text) {
    if (!text?.trim()) return;
    const optimistic = {
      _id: `tmp-${Date.now()}`,
      text,
      createdAt: new Date().toISOString(),
      pending: true
    };
    setMessages((m) => [...m, optimistic]);
    try {
      const saved = await postMessage(conversationId, text);
      setMessages((m) => m.map(x => x._id === optimistic._id ? saved : x));
    } catch (e) {
      setMessages((m) => m.filter(x => x._id !== optimistic._id));
      throw e;
    }
  }

  return { messages, loading, error, send };
}
