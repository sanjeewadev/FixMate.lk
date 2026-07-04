import React, { useMemo, useRef, useState } from "react";
import {
  Check,
  DatabaseZap,
  FileText,
  Plus,
  RotateCcw,
  Tags,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { useAuth } from "../../../context/AuthContext.jsx";
import api from "../../../lib/api";
import "./AIIngest.css";

function chunkText(text, maxChars = 1200) {
  const paragraphs = String(text)
    .split(/\n{2,}/g)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const chunks = [];
  let buffer = "";

  for (const paragraph of paragraphs) {
    const next = buffer ? `${buffer}\n\n${paragraph}` : paragraph;

    if (next.length > maxChars) {
      if (buffer) chunks.push(buffer);
      buffer = paragraph;
    } else {
      buffer = next;
    }
  }

  if (buffer) chunks.push(buffer);

  return chunks;
}

const parseTags = (value) =>
  Array.from(
    new Set(
      String(value || "")
        .split(/[,\n]/g)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).slice(0, 10);

const makeId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function AIIngest() {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "super_admin";

  const [form, setForm] = useState({
    source: "",
    tagsInput: "",
    text: "",
  });

  const [docs, setDocs] = useState([]);
  const [upsert, setUpsert] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const fileRef = useRef(null);

  const totals = useMemo(() => {
    const docCount = docs.length;
    const chunkCount = docs.reduce(
      (sum, doc) => sum + chunkText(doc.text).length,
      0,
    );
    const charCount = docs.reduce(
      (sum, doc) => sum + (doc.text?.length || 0),
      0,
    );

    return {
      docs: docCount,
      chunks: chunkCount,
      chars: charCount,
    };
  }, [docs]);

  function addDocFromForm() {
    const text = form.text?.trim();

    if (!text) {
      setMsg({
        type: "error",
        text: "Please enter some text to ingest.",
      });
      return;
    }

    const doc = {
      id: makeId(),
      source: form.source?.trim(),
      tags: parseTags(form.tagsInput),
      text,
    };

    setDocs((current) => [doc, ...current]);

    setForm((current) => ({
      ...current,
      text: "",
    }));

    setMsg({
      type: "success",
      text: "Document staged. You can add more or ingest the batch.",
    });
  }

  function removeDoc(id) {
    setDocs((current) => current.filter((doc) => doc.id !== id));
  }

  function clearAll() {
    setDocs([]);
  }

  async function onIngest() {
    if (!docs.length) {
      setMsg({
        type: "error",
        text: "Nothing to ingest. Add at least one document.",
      });
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      const payload = {
        upsert,
        docs: docs.map(({ source, tags, text }) => ({
          source,
          tags,
          text,
        })),
      };

      const { data } = await api.post("/api/ai/ingest", payload);
      const written = data?.chunks ?? 0;

      setMsg({
        type: "success",
        text: `Ingested ${written} chunk${
          written === 1 ? "" : "s"
        } successfully.`,
      });
    } catch (error) {
      setMsg({
        type: "error",
        text:
          error?.response?.data?.message || error?.message || "Ingest failed.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function addFiles(files) {
    const accepted = files.filter(
      (file) =>
        /text|markdown|plain/.test(file.type) || /\.(txt|md)$/i.test(file.name),
    );

    if (!accepted.length) {
      setMsg({
        type: "error",
        text: "Only .txt or .md files are supported.",
      });
      return;
    }

    const nextDocs = [];

    for (const file of accepted) {
      const text = await file.text();

      nextDocs.push({
        id: makeId(),
        source: form.source?.trim() || file.name,
        tags: parseTags(form.tagsInput),
        text,
      });
    }

    setDocs((current) => [...nextDocs, ...current]);

    setMsg({
      type: "success",
      text: `Added ${accepted.length} file${
        accepted.length === 1 ? "" : "s"
      } to the batch.`,
    });
  }

  const onDrop = async (event) => {
    event.preventDefault();

    const files = Array.from(event.dataTransfer.files || []);
    await addFiles(files);
  };

  const onDragOver = (event) => {
    event.preventDefault();
  };

  if (!isAdmin) {
    return (
      <div className="fm-admin-aii__notice fm-admin-aii__notice--error">
        You are not authorized to access AI Ingest.
      </div>
    );
  }

  return (
    <section className="fm-admin-aii">
      <div className="fm-admin-aii__header">
        <div>
          <span className="fm-admin-aii__eyebrow">AI Knowledge Base</span>

          <h1>AI Knowledge Ingest</h1>

          <p>
            Add internal knowledge so the AI can answer using your business
            facts, source labels, and tags.
          </p>
        </div>

        <button
          type="button"
          className="fm-admin-aii__btn fm-admin-aii__btn--outline"
          onClick={clearAll}
          disabled={!docs.length || busy}>
          <RotateCcw size={16} />
          Clear Batch
        </button>
      </div>

      <div className="fm-admin-aii__summaryGrid">
        <article className="fm-admin-aii__summaryCard">
          <span>
            <FileText size={17} />
          </span>
          <div>
            <strong>{totals.docs}</strong>
            <p>Documents staged</p>
          </div>
        </article>

        <article className="fm-admin-aii__summaryCard">
          <span>
            <DatabaseZap size={17} />
          </span>
          <div>
            <strong>{totals.chunks}</strong>
            <p>Estimated chunks</p>
          </div>
        </article>

        <article className="fm-admin-aii__summaryCard">
          <span>
            <Tags size={17} />
          </span>
          <div>
            <strong>{totals.chars.toLocaleString()}</strong>
            <p>Characters</p>
          </div>
        </article>
      </div>

      {msg?.text ? (
        <div
          className={`fm-admin-aii__notice fm-admin-aii__notice--${
            msg.type || "info"
          }`}
          role="status"
          aria-live="polite">
          {msg.type === "success" ? <Check size={16} /> : <X size={16} />}
          <span>{msg.text}</span>
        </div>
      ) : null}

      <section className="fm-admin-aii__card">
        <div className="fm-admin-aii__cardHeader">
          <div>
            <span>Knowledge composer</span>
            <h2>Add Source Content</h2>
          </div>
        </div>

        <div className="fm-admin-aii__formGrid">
          <div className="fm-admin-aii__field">
            <label htmlFor="fm-aii-source">Source</label>
            <input
              id="fm-aii-source"
              type="text"
              placeholder="e.g., SOP-AC-123, GoogleDoc URL, or KB label"
              value={form.source}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  source: event.target.value,
                }))
              }
            />
            <small>
              Recommended for upsert. Same source helps avoid duplicates.
            </small>
          </div>

          <div className="fm-admin-aii__field">
            <label htmlFor="fm-aii-tags">Tags</label>
            <input
              id="fm-aii-tags"
              type="text"
              placeholder="comma, separated, tags"
              value={form.tagsInput}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tagsInput: event.target.value,
                }))
              }
            />
            <small>Up to 10 tags. Tags are stored per chunk.</small>
          </div>
        </div>

        <div
          className="fm-admin-aii__dropzone"
          onDrop={onDrop}
          onDragOver={onDragOver}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              fileRef.current?.click();
            }
          }}>
          <input
            ref={fileRef}
            type="file"
            accept=".txt,.md,text/plain"
            hidden
            onChange={async (event) => {
              const files = Array.from(event.target.files || []);
              await addFiles(files);
              event.target.value = "";
            }}
          />

          <span>
            <UploadCloud size={22} />
          </span>

          <div>
            <strong>Drop .txt or .md files here</strong>
            <p>
              Click to upload. Current source and tags are applied to files.
            </p>
          </div>
        </div>

        <div className="fm-admin-aii__field">
          <label htmlFor="fm-aii-text">Text</label>
          <textarea
            id="fm-aii-text"
            placeholder="Paste content here. Paragraphs separated by a blank line will be chunked automatically."
            value={form.text}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                text: event.target.value,
              }))
            }
          />
        </div>

        <div className="fm-admin-aii__actions">
          <label className="fm-admin-aii__switch">
            <input
              type="checkbox"
              checked={upsert}
              onChange={(event) => setUpsert(event.target.checked)}
            />
            <span>Upsert duplicate source and text</span>
          </label>

          <button
            type="button"
            className="fm-admin-aii__btn fm-admin-aii__btn--outline"
            onClick={addDocFromForm}>
            <Plus size={16} />
            Add to Batch
          </button>
        </div>
      </section>

      <section className="fm-admin-aii__card">
        <div className="fm-admin-aii__batchHeader">
          <div>
            <span>Batch queue</span>
            <h2>Staged Documents</h2>
            <p>
              {totals.docs} doc{totals.docs === 1 ? "" : "s"} · ~{totals.chunks}{" "}
              chunk{totals.chunks === 1 ? "" : "s"} ·{" "}
              {totals.chars.toLocaleString()} chars
            </p>
          </div>

          <button
            type="button"
            className="fm-admin-aii__btn fm-admin-aii__btn--dangerLight"
            disabled={!docs.length || busy}
            onClick={clearAll}>
            <Trash2 size={15} />
            Clear
          </button>
        </div>

        <div className="fm-admin-aii__list">
          {docs.length === 0 ? (
            <div className="fm-admin-aii__empty">
              <FileText size={24} />
              <strong>Nothing staged yet</strong>
              <span>Add a document above to prepare an ingest batch.</span>
            </div>
          ) : (
            docs.map((doc, index) => {
              const estChunks = chunkText(doc.text).length;
              const tags = doc.tags || [];

              return (
                <article className="fm-admin-aii__doc" key={doc.id}>
                  <div className="fm-admin-aii__docTop">
                    <div className="fm-admin-aii__docTitle">
                      <span>#{docs.length - index}</span>
                      <strong>{doc.source || "KB"}</strong>
                      <small>
                        ~{estChunks} chunk{estChunks === 1 ? "" : "s"}
                      </small>
                    </div>

                    <button
                      type="button"
                      className="fm-admin-aii__iconAction"
                      onClick={() => removeDoc(doc.id)}
                      aria-label="Remove document">
                      <X size={16} />
                    </button>
                  </div>

                  {tags.length > 0 ? (
                    <div className="fm-admin-aii__tags">
                      {tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  ) : null}

                  <pre className="fm-admin-aii__preview">
                    {doc.text.slice(0, 600)}
                    {doc.text.length > 600 ? "..." : ""}
                  </pre>
                </article>
              );
            })
          )}
        </div>

        <div className="fm-admin-aii__footerActions">
          <button
            type="button"
            className="fm-admin-aii__btn fm-admin-aii__btn--primary"
            disabled={!docs.length || busy}
            onClick={onIngest}>
            <DatabaseZap size={16} />
            {busy ? "Ingesting..." : "Ingest Now"}
          </button>
        </div>
      </section>
    </section>
  );
}
