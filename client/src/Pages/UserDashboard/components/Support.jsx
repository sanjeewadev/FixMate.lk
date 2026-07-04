import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Headphones,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import {
  ensureConversation,
  listMessages,
  postMessage,
} from "../../../services/chat.js";
import { listSupportStaff } from "../../../services/support.js";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./Support.css";

const POLL_MS = 4000;

const SUPPORT_ROLES = new Set(["coordinator", "admin", "super_admin"]);

function formatDateTime(value) {
  if (!value) return "";

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "";
  }
}

function formatRole(value) {
  if (!value) return "Support";

  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getInitial(name = "S") {
  return String(name || "S")
    .charAt(0)
    .toUpperCase();
}

function roundToBucket(iso, bucketSec = 30) {
  const time = new Date(iso).getTime();
  const bucket = Math.floor(time / (bucketSec * 1000)) * (bucketSec * 1000);

  return new Date(bucket).toISOString();
}

function keyMe(myId, text, createdAt) {
  return `${myId}::${String(text || "").trim()}::${roundToBucket(createdAt)}`;
}

function mergeAndDedupe(flatMessages, myId, sentCache) {
  const output = [];
  const keptMine = new Set();

  for (const message of flatMessages) {
    const mine = String(message.senderId) === myId;

    if (mine) {
      const key = keyMe(myId, message.text || "", message.createdAt);

      if (sentCache.has(key)) {
        if (keptMine.has(key)) continue;
        keptMine.add(key);
      }
    }

    output.push(message);
  }

  output.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  return output;
}

export default function Support() {
  const { user } = useAuth();

  const myId = useMemo(() => String(user?.id || user?._id || ""), [user]);

  const [staff, setStaff] = useState([]);
  const [conversations, setConversations] = useState({});
  const [messages, setMessages] = useState([]);

  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingChat, setLoadingChat] = useState(true);
  const [sending, setSending] = useState(false);

  const [error, setError] = useState("");
  const [text, setText] = useState("");

  const pollRef = useRef(null);
  const endRef = useRef(null);
  const sentCache = useRef(new Set());

  useEffect(() => {
    let dead = false;

    async function loadStaff() {
      try {
        setLoadingStaff(true);
        setError("");

        const allStaff = await listSupportStaff();

        const filtered = (allStaff || []).filter((item) =>
          SUPPORT_ROLES.has(item.role),
        );

        if (!dead) {
          setStaff(filtered);
        }
      } catch (err) {
        if (!dead) {
          setError(
            err?.response?.data?.message ||
              "Failed to load support team. Please try again.",
          );
          setStaff([]);
        }
      } finally {
        if (!dead) {
          setLoadingStaff(false);
        }
      }
    }

    loadStaff();

    return () => {
      dead = true;
    };
  }, []);

  useEffect(() => {
    if (loadingStaff) return undefined;

    if (!staff.length) {
      setLoadingChat(false);
      return undefined;
    }

    let dead = false;

    async function ensureSupportConversations() {
      try {
        setLoadingChat(true);
        setError("");

        const pairs = await Promise.all(
          staff.map(async (member) => {
            const conversation = await ensureConversation({
              withRole: member.role,
              withUserId: member._id,
              topic: "Support Team",
            });

            return [String(member._id), conversation?._id || conversation?.id];
          }),
        );

        if (!dead) {
          setConversations(
            Object.fromEntries(
              pairs.filter(([, conversationId]) => Boolean(conversationId)),
            ),
          );
        }
      } catch (err) {
        if (!dead) {
          setError(
            err?.response?.data?.message ||
              "Failed to connect to support conversations.",
          );
          setConversations({});
        }
      } finally {
        if (!dead) {
          setLoadingChat(false);
        }
      }
    }

    ensureSupportConversations();

    return () => {
      dead = true;
    };
  }, [loadingStaff, staff]);

  useEffect(() => {
    if (!Object.keys(conversations).length) return undefined;

    let abort = false;

    async function fetchMessages() {
      try {
        const all = await Promise.all(
          Object.entries(conversations).map(
            async ([staffId, conversationId]) => {
              const data = await listMessages(conversationId);

              return (data || []).map((message) => ({
                ...message,
                __staffId: staffId,
                __conversationId: conversationId,
              }));
            },
          ),
        );

        const flat = all.flat();
        const merged = mergeAndDedupe(flat, myId, sentCache.current);

        if (!abort) {
          setMessages(merged);
        }
      } catch (err) {
        if (!abort) {
          setError(
            err?.response?.data?.message || "Failed to load support messages.",
          );
        }
      }
    }

    fetchMessages();
    pollRef.current = setInterval(fetchMessages, POLL_MS);

    return () => {
      abort = true;

      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [conversations, myId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages.length]);

  const labelFor = (message) => {
    if (String(message.senderId) === myId) return "You";

    const member = staff.find(
      (item) => String(item._id) === String(message.__staffId),
    );

    return (
      member?.full_name ||
      member?.name ||
      formatRole(message.senderRole) ||
      "Support"
    );
  };

  const handleSubmit = async (event) => {
    event?.preventDefault();

    const trimmed = text.trim();
    const conversationIds = Object.values(conversations);

    if (!trimmed || !conversationIds.length) return;

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      senderRole: "customer",
      senderId: myId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setMessages((current) => [...current, optimistic]);
    sentCache.current.add(keyMe(myId, trimmed, optimistic.createdAt));
    setSending(true);

    try {
      await Promise.all(
        conversationIds.map((conversationId) =>
          postMessage(conversationId, trimmed),
        ),
      );

      setText("");
    } catch (err) {
      setMessages((current) =>
        current.filter((message) => message._id !== optimistic._id),
      );

      setError(
        err?.response?.data?.message ||
          "Failed to send your message. Please try again.",
      );
    } finally {
      setSending(false);
    }
  };

  const supportOnline = staff.length > 0;
  const connecting = loadingStaff || loadingChat;

  return (
    <section className="fm-user-support">
      <div className="fm-user-support__header">
        <div>
          <span className="fm-user-support__eyebrow">Customer Support</span>

          <h1>Support</h1>

          <p>
            Send a message to the FixMate.lk support team. Your message is
            shared with available coordinators and admins.
          </p>
        </div>

        <div className="fm-user-support__status">
          <span className={supportOnline ? "isOnline" : "isOffline"} />
          {supportOnline ? "Support available" : "Support offline"}
        </div>
      </div>

      {error ? (
        <div className="fm-user-support__notice" role="status">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="fm-user-support__layout">
        <aside className="fm-user-support__teamCard">
          <div className="fm-user-support__teamHeader">
            <span>
              <ShieldCheck size={17} />
            </span>

            <div>
              <h2>Support Team</h2>
              <p>Coordinators and admins</p>
            </div>
          </div>

          <div className="fm-user-support__teamList">
            {loadingStaff ? (
              <div className="fm-user-support__teamState">
                <RefreshCw size={18} />
                <span>Loading support team...</span>
              </div>
            ) : staff.length === 0 ? (
              <div className="fm-user-support__teamState">
                <Headphones size={18} />
                <span>No support staff available right now.</span>
              </div>
            ) : (
              staff.map((member) => (
                <article className="fm-user-support__member" key={member._id}>
                  {member.profile_image_url ? (
                    <img
                      src={member.profile_image_url}
                      alt={member.full_name || "Support member"}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span>{getInitial(member.full_name || member.role)}</span>
                  )}

                  <div>
                    <strong>{member.full_name || "Support member"}</strong>
                    <small>{formatRole(member.role)}</small>
                  </div>
                </article>
              ))
            )}
          </div>
        </aside>

        <section className="fm-user-support__chatCard">
          <header className="fm-user-support__chatHead">
            <div className="fm-user-support__chatPeer">
              <span className="fm-user-support__chatAvatar">
                <Headphones size={18} />
              </span>

              <div>
                <h2>Support Team</h2>
                <p>Coordinators and admins</p>
              </div>
            </div>
          </header>

          <div className="fm-user-support__chatBody">
            {connecting ? (
              <div className="fm-user-support__chatState">
                <RefreshCw size={22} />
                <strong>Connecting to support</strong>
                <span>Please wait while we prepare your support chat.</span>
              </div>
            ) : !supportOnline ? (
              <div className="fm-user-support__chatState">
                <Headphones size={22} />
                <strong>Support is currently offline</strong>
                <span>Please try again later.</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="fm-user-support__chatState">
                <UserRound size={22} />
                <strong>No messages yet</strong>
                <span>Type your message below to contact support.</span>
              </div>
            ) : (
              messages.map((message) => {
                const mine = String(message.senderId) === myId;
                const senderName = labelFor(message);

                return (
                  <div
                    key={message._id}
                    className={`fm-user-support__messageRow ${
                      mine ? "isMine" : ""
                    }`}>
                    <div className="fm-user-support__bubble">
                      <p>{message.text}</p>

                      <span>
                        {senderName} · {formatDateTime(message.createdAt)}
                        {message.optimistic ? " · sending..." : ""}
                      </span>
                    </div>
                  </div>
                );
              })
            )}

            <div ref={endRef} />
          </div>

          <form className="fm-user-support__composer" onSubmit={handleSubmit}>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type your message"
              aria-label="Message"
              disabled={!supportOnline || connecting}
            />

            <button
              type="submit"
              disabled={
                sending || !text.trim() || !supportOnline || connecting
              }>
              <Send size={16} />
              {sending ? "Sending" : "Send"}
            </button>
          </form>
        </section>
      </div>
    </section>
  );
}
