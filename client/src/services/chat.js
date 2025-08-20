// src/services/chat.js
import api from "../lib/api";

/**
 * Create or reuse a conversation.
 * - General support: call with { withRole, withUserId, topic }  (no bookingId)
 * - Booking chat   : call with { bookingId, withRole, withUserId, topic }
 */
export async function ensureConversation({
  bookingId = null,
  withRole,
  withUserId,
  topic = "General support",
}) {
  const payload = { withRole, withUserId, topic };
  if (bookingId) payload.bookingId = bookingId;

  const { data } = await api.post("/api/chat/conversations", payload);
  return data; // conversation doc
}

export async function listMessages(conversationId) {
  const { data } = await api.get("/api/chat/messages", {
    params: { conversationId },
  });
  return Array.isArray(data) ? data : [];
}

export async function postMessage(conversationId, text) {
  const { data } = await api.post("/api/chat/messages", { conversationId, text });
  return data; // message doc
}

/* Optional convenience wrappers (use these names if you like)
export const ensureGeneralConversation = (opts) =>
  ensureConversation({ ...opts, bookingId: null });

export const ensureBookingConversation = (opts) =>
  ensureConversation(opts);
*/
