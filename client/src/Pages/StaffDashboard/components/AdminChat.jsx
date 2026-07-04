import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  MessageSquareText,
  RefreshCw,
  Send,
  UserRound,
} from "lucide-react";

import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext.jsx";
import "./AdminChat.css";

const RIGHT_ROLES = new Set(["admin", "super_admin", "coordinator"]);

function formatTime(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value || "";
  }
}

function formatRole(value) {
  if (!value) return "User";

  return String(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function AdminChat({ conversationId = "" }) {
  const { role } = useAuth();

  const [convos, setConvos] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [errList, setErrList] = useState("");

  const [activeId, setActiveId] = useState(conversationId || "");
  const [msgs, setMsgs] = useState([]);
  const [errMsgs, setErrMsgs] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);

  const [text, setText] = useState("");

  const listRef = useRef(null);
  const pollRef = useRef(null);
  const initialLoadDoneRef = useRef(false);

  async function loadConversations() {
    try {
      setLoadingList(true);
      setErrList("");

      const { data } = await api.get("/api/chat/conversations");
      const conversations = Array.isArray(data) ? data : [];

      setConvos(conversations);

      if (!activeId && conversations.length) {
        setActiveId(conversationId || conversations[0]._id);
      }
    } catch (error) {
      setErrList(
        error?.response?.data?.message || "Failed to load conversations.",
      );
    } finally {
      setLoadingList(false);
    }
  }

  async function loadMessages(id = activeId, isInitial = false) {
    if (!id) return;

    try {
      if (isInitial && !initialLoadDoneRef.current) {
        setShowSpinner(true);
      }

      setErrMsgs("");

      const { data } = await api.get("/api/chat/messages", {
        params: {
          conversationId: id,
        },
      });

      setMsgs(Array.isArray(data) ? data : []);

      requestAnimationFrame(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight;
        }
      });
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to load messages.";

      setErrMsgs(message);
      setMsgs([]);

      if (message === "Forbidden" && pollRef.current) {
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

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (conversationId) {
      setActiveId(conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!activeId) return;

    initialLoadDoneRef.current = false;
    loadMessages(activeId, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  useEffect(() => {
    if (!activeId) return undefined;

    pollRef.current = setInterval(() => loadMessages(activeId, false), 3500);

    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const activeConvo = useMemo(
    () => (convos || []).find((conversation) => conversation._id === activeId),
    [activeId, convos],
  );

  const nameMap = useMemo(() => {
    const map = {};

    (activeConvo?.participants || []).forEach((participant) => {
      map[`${participant.role}:${String(participant.userId)}`] =
        participant.name || formatRole(participant.role);
    });

    return map;
  }, [activeConvo]);

  const sidebar = useMemo(() => {
    return (convos || []).map((conversation) => {
      const other = (conversation.participants || []).find(
        (participant) => !RIGHT_ROLES.has(participant.role),
      );

      const labelName =
        other?.name ||
        other?.userId?.full_name ||
        other?.full_name ||
        formatRole(other?.role) ||
        "Conversation";

      const subtitle =
        conversation.booking?.problemTitle ||
        conversation.topic ||
        conversation.booking?._id ||
        "";

      return {
        id: conversation._id,
        label: labelName,
        role: other?.role || "",
        sub: subtitle,
        ts: conversation.updatedAt,
      };
    });
  }, [convos]);

  async function sendMessage(event) {
    event.preventDefault();

    if (!text.trim() || !activeId) return;

    const body = {
      conversationId: activeId,
      text: text.trim(),
    };

    const temp = {
      _id: `temp-${Date.now()}`,
      conversation: activeId,
      senderRole: role,
      senderId: "me",
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMsgs((current) => [...current, temp]);
    setText("");

    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    });

    try {
      await api.post("/api/chat/messages", body);
    } catch (error) {
      setMsgs((current) =>
        current.filter((message) => message._id !== temp._id),
      );

      alert(error?.response?.data?.message || "Failed to send message.");
    }
  }

  return (
    <section className="fm-staff-chat">
      <aside className="fm-staff-chat__sidebar">
        <div className="fm-staff-chat__sidebarHeader">
          <div>
            <span>Inbox</span>
            <h2>Conversations</h2>
          </div>

          <button
            type="button"
            className="fm-staff-chat__iconButton"
            onClick={loadConversations}
            disabled={loadingList}
            aria-label="Refresh conversations">
            <RefreshCw size={16} />
          </button>
        </div>

        <div className="fm-staff-chat__conversationList">
          {loadingList ? (
            <div className="fm-staff-chat__state">
              <RefreshCw size={18} />
              <span>Loading conversations...</span>
            </div>
          ) : null}

          {errList ? (
            <div className="fm-staff-chat__error">
              <AlertCircle size={16} />
              <span>{errList}</span>
            </div>
          ) : null}

          {!loadingList && !errList && sidebar.length === 0 ? (
            <div className="fm-staff-chat__state">
              <MessageSquareText size={18} />
              <span>No conversations yet.</span>
            </div>
          ) : null}

          {sidebar.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`fm-staff-chat__conversation ${
                activeId === item.id ? "isActive" : ""
              }`}
              onClick={() => setActiveId(item.id)}
              title={item.sub}>
              <span className="fm-staff-chat__avatar">
                <UserRound size={16} />
              </span>

              <span className="fm-staff-chat__conversationBody">
                <span className="fm-staff-chat__conversationTop">
                  <strong>
                    {item.label}
                    {item.role ? (
                      <small> · {formatRole(item.role)}</small>
                    ) : null}
                  </strong>

                  <em>{formatTime(item.ts)}</em>
                </span>

                {item.sub ? (
                  <span className="fm-staff-chat__conversationSub">
                    {item.sub}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <section className="fm-staff-chat__body">
        {!activeId ? (
          <div className="fm-staff-chat__empty">
            <MessageSquareText size={26} />
            <strong>Select a conversation</strong>
            <span>
              Choose a conversation from the left side to view messages.
            </span>
          </div>
        ) : (
          <>
            <div className="fm-staff-chat__bodyHeader">
              <div>
                <span>Active conversation</span>
                <h2>
                  {sidebar.find((item) => item.id === activeId)?.label ||
                    "Conversation"}
                </h2>
              </div>

              <button
                type="button"
                className="fm-staff-chat__iconButton"
                onClick={() => loadMessages(activeId, true)}
                aria-label="Refresh messages">
                <RefreshCw size={16} />
              </button>
            </div>

            <div className="fm-staff-chat__messages" ref={listRef}>
              {showSpinner ? (
                <div className="fm-staff-chat__state">
                  <RefreshCw size={18} />
                  <span>Loading messages...</span>
                </div>
              ) : null}

              {!showSpinner && errMsgs ? (
                <div className="fm-staff-chat__error">
                  <AlertCircle size={16} />
                  <span>{errMsgs}</span>
                </div>
              ) : null}

              {!showSpinner && !errMsgs && msgs.length === 0 ? (
                <div className="fm-staff-chat__state">
                  <MessageSquareText size={18} />
                  <span>No messages yet.</span>
                </div>
              ) : null}

              {msgs.map((message) => {
                const mine = RIGHT_ROLES.has(message.senderRole);
                const key = `${message.senderRole}:${String(message.senderId)}`;

                const senderName =
                  message.senderId === "me"
                    ? "You"
                    : nameMap[key] ||
                      (mine ? "You" : formatRole(message.senderRole));

                return (
                  <div
                    key={message._id}
                    className={`fm-staff-chat__messageRow ${
                      mine ? "isRight" : "isLeft"
                    }`}>
                    {!mine ? (
                      <div className="fm-staff-chat__sender">{senderName}</div>
                    ) : null}

                    <div
                      className={`fm-staff-chat__bubble ${
                        mine ? "isMine" : ""
                      }`}>
                      <p>{message.text}</p>

                      <span>
                        {senderName} · {formatTime(message.createdAt)}
                      </span>
                    </div>

                    {mine ? (
                      <div className="fm-staff-chat__sender">{senderName}</div>
                    ) : null}
                  </div>
                );
              })}
            </div>

            <form className="fm-staff-chat__input" onSubmit={sendMessage}>
              <input
                type="text"
                placeholder="Type your message"
                value={text}
                onChange={(event) => setText(event.target.value)}
              />

              <button
                type="submit"
                className="fm-staff-chat__sendButton"
                disabled={!text.trim()}>
                <Send size={16} />
                Send
              </button>
            </form>
          </>
        )}
      </section>
    </section>
  );
}
