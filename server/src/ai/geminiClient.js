import { GoogleGenAI } from "@google/genai";

const API_KEY =
  process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

if (!API_KEY) {
  throw new Error(
    "Missing GEMINI_API_KEY (or GOOGLE_API_KEY) in your .env file."
  );
}

const genAI = new GoogleGenAI({
  apiKey: API_KEY,
});

const CHAT_MODELS = (
  process.env.GEMINI_CHAT_MODEL_LIST ||
  "gemini-2.5-flash,gemini-2.0-flash,gemini-1.5-flash"
)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const EMBED_MODEL =
  process.env.GEMINI_EMBED_MODEL || "text-embedding-004";

const DEFAULT_TEMP = Number(
  process.env.GEMINI_TEMPERATURE || 0.2
);

const DEFAULT_MAX_TOKENS = Number(
  process.env.GEMINI_MAX_OUTPUT_TOKENS || 400
);



async function generateWithFallback(prompt, config = {}) {
  let lastError;

  for (const model of CHAT_MODELS) {
    try {
      console.log(`Trying model: ${model}`);

      const response = await genAI.models.generateContent({
        model,
        contents: prompt,
        config,
      });

      return response;
    } catch (err) {
      lastError = err;
      console.warn(`Model ${model} failed`);
      console.warn(err.message);
    }
  }

  throw lastError;
}

export async function gemGenerate(
  prompt,
  {
    temperature = DEFAULT_TEMP,
    maxOutputTokens = DEFAULT_MAX_TOKENS,
  } = {}
) {
  try {
    const response = await generateWithFallback(prompt, {
      temperature,
      maxOutputTokens,
    });

    return response.text;
  } catch (err) {
    console.error(err);

    if (err.status === 429)
      throw new Error("Gemini free quota exceeded.");

    if (err.status === 403)
      throw new Error("Invalid API key.");

    throw new Error(err.message);
  }
}

export async function gemEmbed(text) {
  try {
    const response = await genAI.models.embedContent({
      model: `models/${process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001"}`,
      contents: text,
    });

    const embedding =
      response?.embeddings?.[0]?.values;

    if (!embedding) {
      throw new Error("Embedding failed - no vector returned");
    }

    return embedding;
  } catch (err) {
    console.error("Embedding Error:");
    console.error(err);

    throw new Error(
      err?.message || "Embedding generation failed"
    );
  }
}