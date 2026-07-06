// src/controllers/aiController.js
const KnowledgeChunk = require('../models/KnowledgeChunk');
const { gemGenerate, gemEmbed } = require('../ai/geminiClient');



// ---- helpers ----
function chunkText(txt, maxChars = 1200) {
  const paras = String(txt).split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = '';
  for (const p of paras) {
    if ((buf + '\n\n' + p).length > maxChars) { if (buf) chunks.push(buf); buf = p; }
    else { buf = buf ? buf + '\n\n' + p : p; }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
function cosineSim(a, b) {
  let dot = 0, na = 0, nb = 0;
  if (!a?.length || !b?.length)
    return 0;

const L = Math.min(a.length, b.length);
  for (let i = 0; i < L; i++) { dot += a[i]*b[i]; na += a[i]*a[i]; nb += b[i]*b[i]; }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// ---- POST /api/ai/ingest  (admin/super_admin only) ----
// body: { docs: [{ text, source?, tags? }], upsert?: true }
exports.ingest = async (req, res) => {
  try {
    const { docs = [], upsert = true } = req.body || {};
    if (!Array.isArray(docs) || docs.length === 0)
      return res.status(400).json({ message: 'docs[] required' });

    let written = 0;
    for (const d of docs) {
      const src  = String(d.source || '').trim();
      const tags = Array.isArray(d.tags) ? d.tags.slice(0, 10) : [];
      const chunks = chunkText(d.text || '');
      for (const ch of chunks) {
        if (upsert && src) {
          const exists = await KnowledgeChunk.findOne({ source: src, text: ch }).lean();
          if (exists) continue;
        }
        const emb = await gemEmbed(ch);
        if (!emb || !emb.length) continue;
        await KnowledgeChunk.create({ text: ch, source: src, tags, embedding: emb });
        written++;
      }
    }
    res.status(201).json({ message: 'Ingested', chunks: written });
  } catch (e) {

    console.error("AI Ingest Error");

    console.error(e);

    return res.status(500).json({

        success:false,

        message:e.message || "Knowledge ingestion failed."

    });

}
};

// ---- POST /api/ai/chat  (public or auth — your choice) ----
// body: { message: string, topK?: number, history?: [{ role, content }] }
exports.chat = async (req, res) => {
  try {
    const { message, topK = 4, history = [] } = req.body || {};
    if (
    !message ||
    !message.trim()
) {
    return res.status(400).json({
        message:"Message is required."
    });
}

    // 1) embed query
    const qEmb = await gemEmbed(message);

    // 2) retrieve top chunks (scan ≤500, score in Node)
    const candidates = await KnowledgeChunk.find({}, null, { limit: 500 }).lean();
    if (!candidates.length) {

    return res.json({

        answer:
            "I don't have any knowledge yet. Please upload documents first.",

        sources:[]

    });

}
    const withScore = candidates.map(c => ({ ...c, _score: cosineSim(qEmb, c.embedding || []) }));
    withScore.sort((a,b) => b._score - a._score);
    const hits = withScore.slice(0, Math.max(1, Math.min(8, topK)));

    // 3) compose a grounded prompt
    const ctx = hits.map((h,i)=>`[${i+1}] Source: ${h.source||'KB'}\n${h.text}`).join('\n\n');

    const system = `You are FixMate.LK's maintenance assistant.
Answer ONLY using the provided context. If not in the context, say you don't know.
Be concise, safe, and Sri Lanka–aware. Add citations like [1],[2] referring to the numbered context blocks.`;

    const userPrompt =
`User Question: "${message}"

Context:
${ctx}

Instructions:
- Use context facts only.
- Include [1],[2],... citations where applicable.`;

    const prompt = `${system}\n\n${userPrompt}`;

    // 4) generate with Gemini
    const answer = await gemGenerate(prompt, { temperature: 0.1, maxOutputTokens: 350 });

    const sources = hits.map((h,i)=>({ n: i+1, source: h.source || 'KB', id: String(h._id), score: Number(h._score.toFixed(4)) }));
    res.json({ answer, sources });
  } catch (e) {

    console.error("AI Chat Error");

    console.error(e);

    return res.status(500).json({

        success:false,

        message:e.message || "AI service unavailable."

    });

}
};
