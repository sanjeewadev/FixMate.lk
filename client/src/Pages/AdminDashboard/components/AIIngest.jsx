// src/Pages/AdminDashboard/components/AIIngest.jsx
import React, { useMemo, useRef, useState } from "react";
import "./AIIngest.css";
import api from "../../../lib/api";
import { useAuth } from "../../../context/AuthContext.jsx";

/** mirror server-side helper (1200 chars, split on blank lines) */
function chunkText(txt, maxChars = 1200) {
  const paras = String(txt).split(/\n{2,}/g).map(p => p.trim()).filter(Boolean);
  const chunks = [];
  let buf = "";
  for (const p of paras) {
    const next = buf ? buf + "\n\n" + p : p;
    if (next.length > maxChars) {
      if (buf) chunks.push(buf);
      buf = p;
    } else {
      buf = next;
    }
  }
  if (buf) chunks.push(buf);
  return chunks;
}
const parseTags = (s) =>
  Array.from(
    new Set(
      String(s || "")
        .split(/[,\n]/g)
        .map(t => t.trim())
        .filter(Boolean)
    )
  ).slice(0, 10);

export default function AIIngest() {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";

  const [form, setForm] = useState({
    source: "",
    tagsInput: "",
    text: "",
  });
  const [docs, setDocs] = useState([]); // {id, source, tags[], text}
  const [upsert, setUpsert] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const fileRef = useRef(null);

  const totals = useMemo(() => {
    const d = docs.length;
    const c = docs.reduce((sum, doc) => sum + chunkText(doc.text).length, 0);
    const ch = docs.reduce((sum, doc) => sum + (doc.text?.length || 0), 0);
    return { docs: d, chunks: c, chars: ch };
  }, [docs]);

  function addDocFromForm() {
    const text = form.text?.trim();
    if (!text) {
      setMsg({ type: "error", text: "Please enter some text to ingest." });
      return;
    }
    const doc = {
      id: crypto.randomUUID(),
      source: form.source?.trim(),
      tags: parseTags(form.tagsInput),
      text,
    };
    setDocs((prev) => [doc, ...prev]);
    setForm({ source: form.source, tagsInput: form.tagsInput, text: "" });
    setMsg({ type: "success", text: "Document staged. You can add more or click Ingest." });
  }

  function removeDoc(id) {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  }
  function clearAll() {
    setDocs([]);
  }

  async function onIngest() {
    if (!docs.length) {
      setMsg({ type: "error", text: "Nothing to ingest. Add at least one document." });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const payload = {
        upsert,
        docs: docs.map(({ source, tags, text }) => ({ source, tags, text })),
      };
      const { data } = await api.post("/api/ai/ingest", payload);
      const written = data?.chunks ?? 0;
      setMsg({
        type: "success",
        text: `Ingested ${written} chunk${written === 1 ? "" : "s"} successfully.`,
      });
      // Optionally keep staged docs for more ingest; or clear:
      // setDocs([]);
    } catch (e) {
      const t = e?.response?.data?.message || e?.message || "Ingest failed";
      setMsg({ type: "error", text: t });
    } finally {
      setBusy(false);
    }
  }

  // ---- drag & drop plain text/markdown ----
  const onDrop = async (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    const accepted = files.filter((f) => /text|markdown|plain/.test(f.type) || /\.(txt|md)$/i.test(f.name));
    if (!accepted.length) {
      setMsg({ type: "error", text: "Only .txt or .md files are supported for drag & drop." });
      return;
    }
    for (const f of accepted) {
      const text = await f.text();
      setDocs((prev) => [
        {
          id: crypto.randomUUID(),
          source: form.source?.trim() || f.name,
          tags: parseTags(form.tagsInput),
          text,
        },
        ...prev,
      ]);
    }
    setMsg({ type: "success", text: `Added ${accepted.length} file(s) to the batch.` });
  };
  const onDragOver = (e) => e.preventDefault();

  if (!isAdmin) {
    return <div className="msg error" style={{ marginTop: 12 }}>You are not authorized to access AI Ingest.</div>;
  }

  return (
    <div className="ai-ingest-page">
      <div className="ingest-header">
        <h2>AI Knowledge Ingest</h2>
        <div className="muted tiny">Add internal knowledge so AI answers with your facts (with citations).</div>
      </div>

      {msg?.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}

      {/* Composer */}
      <section className="ingest-composer">
        <div className="row">
          <div className="field">
            <label>Source (optional)</label>
            <input
              type="text"
              placeholder="e.g., SOP-AC-123, GoogleDoc URL, or KB label"
              value={form.source}
              onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
            />
            <div className="hint tiny">Recommended for upsert: same source avoids duplicates.</div>
          </div>
          <div className="field">
            <label>Tags (optional)</label>
            <input
              type="text"
              placeholder="comma, separated, tags"
              value={form.tagsInput}
              onChange={(e) => setForm((p) => ({ ...p, tagsInput: e.target.value }))}
            />
            <div className="hint tiny">Up to 10 tags. They’ll be stored per chunk.</div>
          </div>
        </div>

        <div
          className="dropzone"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => (e.key === "Enter" ? fileRef.current?.click() : null)}
        >
          <input ref={fileRef} type="file" accept=".txt,.md,text/plain" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) f.text().then((text) => {
              setDocs((prev) => [
                { id: crypto.randomUUID(), source: form.source?.trim() || f.name, tags: parseTags(form.tagsInput), text },
                ...prev,
              ]);
              setMsg({ type: "success", text: `Added ${f.name} to the batch.` });
            });
            e.target.value = "";
          }} />
          <div className="dz-icon">📎</div>
          <div className="dz-text">
            <strong>Drop .txt / .md</strong> or click to upload
            <div className="muted tiny">We’ll keep your current Source/Tags for uploaded files.</div>
          </div>
        </div>

        <div className="field">
          <label>Text</label>
          <textarea
            placeholder="Paste content here. Paragraphs separated by a blank line will be chunked automatically (~1200 chars/chunk)."
            value={form.text}
            onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
          />
        </div>

        <div className="composer-actions">
          <label className="switch">
            <input type="checkbox" checked={upsert} onChange={(e) => setUpsert(e.target.checked)} />
            <span>Upsert (skip if same source + text already exists)</span>
          </label>

          <div className="spacer" />
          <button type="button" className="btn outline" onClick={addDocFromForm}>Add to Batch</button>
        </div>
      </section>

      {/* Batch list */}
      <section className="ingest-batch">
        <div className="batch-head">
          <h3>Staged Documents</h3>
          <div className="muted tiny">
            {totals.docs} doc{totals.docs === 1 ? "" : "s"} · ~{totals.chunks} chunk{totals.chunks === 1 ? "" : "s"} · {totals.chars.toLocaleString()} chars
          </div>
          <div className="spacer" />
          <button className="btn danger" disabled={!docs.length || busy} onClick={clearAll}>Clear</button>
        </div>

        <div className="batch-list">
          {docs.length === 0 ? (
            <div className="empty muted">Nothing staged yet. Add a document above.</div>
          ) : (
            docs.map((d, idx) => {
              const estChunks = chunkText(d.text).length;
              const tags = d.tags || [];
              return (
                <div key={d.id} className="doc-card">
                  <div className="doc-top">
                    <div className="doc-title">
                      <span className="badge">#{docs.length - idx}</span>
                      <strong>{d.source || "KB"}</strong>
                      <span className="muted tiny"> · ~{estChunks} chunk{estChunks === 1 ? "" : "s"}</span>
                    </div>
                    <button className="btn ghost" onClick={() => removeDoc(d.id)}>Remove</button>
                  </div>

                  {tags.length > 0 && (
                    <div className="tags">
                      {tags.map((t) => (
                        <span className="tag" key={t}>{t}</span>
                      ))}
                    </div>
                  )}

                  <pre className="doc-preview">{d.text.slice(0, 600)}{d.text.length > 600 ? "…" : ""}</pre>
                </div>
              );
            })
          )}
        </div>

        <div className="ingest-actions">
          <button className="btn btn-primary" disabled={!docs.length || busy} onClick={onIngest}>
            {busy ? "Ingesting..." : "Ingest Now"}
          </button>
        </div>
      </section>
    </div>
  );
}
