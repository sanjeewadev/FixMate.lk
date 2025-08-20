// src/services/ai.js
import api from "../lib/api";

/**
 * Chat with AI KB
 * @param {string} message
 * @param {Array<{role:'user'|'assistant', content:string}>} history
 * @param {number} topK
 */
export async function aiChat({ message, history = [], topK = 4 }) {
  const { data } = await api.post("/api/ai/chat", { message, history, topK });
  // data: { answer: string, sources: [{n, source, id, score}] }
  return data;
}

/**
 * Admin-only (optional): ingest docs into KB
 * @param {{docs: Array<{text:string, source?:string, tags?:string[]}>, upsert?: boolean}} payload
 */
export async function aiIngest(payload) {
  const { data } = await api.post("/api/ai/ingest", payload);
  return data;
}