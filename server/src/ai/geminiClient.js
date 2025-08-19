// src/ai/geminiClient.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- keys & models ----------------------------------------------------------
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY (or GOOGLE_API_KEY) is not set in .env");
}

// Initialize SDK
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Default model
const geminiModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ---- text generation -------------------------------------------------------
export async function gemGenerate(prompt, {
  temperature = 0.2,
  maxOutputTokens = 400
} = {}) {
  const result = await geminiModel.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { temperature, maxOutputTokens }
  });

  return result.response.text();
}

// ---- embeddings ------------------------------------------------------------
export async function gemEmbed(text) {
  const embedModel = genAI.getGenerativeModel({ model: "text-embedding-004" });

  const resp = await embedModel.embedContent(text);

  const emb = resp?.embedding?.values;
  if (!emb || !Array.isArray(emb)) {
    throw new Error("Gemini embed failed: unexpected response shape");
  }
  return emb.map(Number);
}

export { geminiModel };
