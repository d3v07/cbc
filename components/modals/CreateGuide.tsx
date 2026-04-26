"use client";

import { useState } from "react";
import { CopyLine, ModalShell, StampMark } from "@/components/modals/shared";
import { getKey } from "@/lib/byo-key";
import type { Guide } from "@/lib/guides/schema";
import { actions, useAppStore } from "@/lib/store";

interface CreateForm {
  name: string;
  pulls_for: string;
  voice: string;
  sample_q: string;
  never: string;
}

const INITIAL_FORM: CreateForm = {
  name: "",
  pulls_for: "",
  voice: "",
  sample_q: "",
  never: "",
};

const FIELDS: Array<{
  k: keyof CreateForm;
  label: string;
  placeholder: string;
  multi?: boolean;
}> = [
  {
    k: "name",
    label: "name",
    placeholder: "e.g. The Noticer",
  },
  {
    k: "pulls_for",
    label: "pulls for",
    placeholder: "what does this guide listen for?",
    multi: true,
  },
  {
    k: "voice",
    label: "voice",
    placeholder: "patient · low-key · takes ordinary things seriously",
    multi: true,
  },
  {
    k: "sample_q",
    label: "a question they'd ask",
    placeholder: "What did her hands actually do?",
    multi: true,
  },
  {
    k: "never",
    label: "they would never",
    placeholder: "finish your sentences",
  },
];

export default function CreateGuide() {
  const [state, dispatch] = useAppStore();
  const open = state.modal === "createguide";

  const [form, setForm] = useState<CreateForm>(INITIAL_FORM);
  const [synthesized, setSynthesized] = useState<Guide | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"none" | "synthesize" | "finalize">("none");

  const dismiss = () => {
    dispatch(actions.setModal(null));
    setForm(INITIAL_FORM);
    setSynthesized(null);
    setShareUrl(null);
    setError(null);
    setBusy("none");
  };

  const update = (k: keyof CreateForm, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  const allFilled = Object.values(form).every((v) => v.trim().length > 0);

  const synthesize = async () => {
    setBusy("synthesize");
    setError(null);
    try {
      const byoKey = getKey();
      const res = await fetch("/api/guide/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(byoKey ? { "X-Anthropic-Key": byoKey } : {}),
        },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { guide?: Guide; error?: string };
      if (!res.ok) {
        setError(json.error ?? `request failed (${res.status})`);
        return;
      }
      if (json.guide) setSynthesized(json.guide);
    } catch (err) {
      setError(err instanceof Error ? err.message : "request failed");
    } finally {
      setBusy("none");
    }
  };

  const finalize = async () => {
    if (!synthesized) return;
    setBusy("finalize");
    setError(null);
    try {
      const res = await fetch("/api/guide/finalize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guide: synthesized }),
      });
      const json = (await res.json()) as {
        share_payload?: string;
        error?: string;
      };
      if (!res.ok || !json.share_payload) {
        setError(json.error ?? `finalize failed (${res.status})`);
        return;
      }
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${origin}/?guide=${json.share_payload}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "request failed");
    } finally {
      setBusy("none");
    }
  };

  let title = "Create your own guide";
  if (synthesized && !shareUrl) title = "Preview · stamp it?";
  if (shareUrl) title = "Sealed · share away";

  return (
    <ModalShell open={open} onClose={dismiss} title={title} maxWidth={560}>
      {!synthesized && !shareUrl && (
        <>
          <p
            className="body-prose"
            style={{
              fontSize: 14,
              marginTop: -4,
              marginBottom: 18,
              color: "var(--t-ink-soft)",
            }}
          >
            Five answers shape your guide&apos;s voice. Specifics over
            abstractions.
          </p>
          {FIELDS.map((f) => (
            <Field
              key={f.k}
              label={f.label}
              placeholder={f.placeholder}
              value={form[f.k]}
              onChange={(v) => update(f.k, v)}
              multi={f.multi}
            />
          ))}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 22,
            }}
          >
            <button type="button" className="btn ghost" onClick={dismiss}>
              cancel
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={synthesize}
              disabled={!allFilled || busy !== "none"}
              style={{
                opacity: !allFilled || busy !== "none" ? 0.4 : 1,
              }}
            >
              {busy === "synthesize" ? "synthesizing…" : "synthesize →"}
            </button>
          </div>
        </>
      )}

      {synthesized && !shareUrl && (
        <>
          <p
            className="body-prose"
            style={{
              fontSize: 14,
              marginTop: -4,
              marginBottom: 16,
              color: "var(--t-ink-soft)",
            }}
          >
            Review what was synthesized. Stamp to seal it; share-link can
            be sent to anyone.
          </p>

          <PreviewBlock guide={synthesized} />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              marginTop: 22,
            }}
          >
            <button
              type="button"
              className="btn ghost"
              onClick={() => setSynthesized(null)}
              disabled={busy !== "none"}
            >
              ← edit inputs
            </button>
            <button
              type="button"
              className="btn primary"
              onClick={finalize}
              disabled={busy !== "none"}
              style={{ opacity: busy !== "none" ? 0.6 : 1 }}
            >
              {busy === "finalize" ? "stamping…" : "stamp & save →"}
            </button>
          </div>
        </>
      )}

      {shareUrl && (
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginTop: -4,
              marginBottom: 18,
            }}
            aria-hidden="true"
          >
            <StampMark label="sealed" size={48} />
          </div>
          <p
            className="body-prose"
            style={{
              fontSize: 14,
              textAlign: "center",
              marginBottom: 18,
              color: "var(--t-ink)",
            }}
          >
            Anyone with this link can import {synthesized?.name ?? "your guide"}
            into their picker.
          </p>
          <CopyLine value={shareUrl} label="share link" />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 10,
              marginTop: 22,
            }}
          >
            <button
              type="button"
              className="btn primary"
              onClick={dismiss}
            >
              done
            </button>
          </div>
        </>
      )}

      {error && (
        <div
          role="alert"
          style={{
            marginTop: 14,
            color: "var(--t-accent)",
            fontFamily: "var(--t-mono)",
            fontSize: 11,
          }}
        >
          {error}
        </div>
      )}
    </ModalShell>
  );
}

function Field({
  label,
  placeholder,
  value,
  onChange,
  multi,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  multi?: boolean;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label
        className="eyebrow"
        style={{ display: "block", marginBottom: 4 }}
      >
        {label}
      </label>
      {multi ? (
        <textarea
          className="textarea-prose"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={2}
          style={{ fontSize: 14, lineHeight: 1.5, minHeight: 56 }}
        />
      ) : (
        <input
          type="text"
          className="textarea-prose"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            fontSize: 14,
            padding: "8px 12px",
            width: "100%",
          }}
        />
      )}
    </div>
  );
}

function PreviewBlock({ guide }: { guide: Guide }) {
  return (
    <div
      className="card outlined"
      style={{
        padding: "14px 18px",
        background: "var(--t-paper-warm)",
      }}
    >
      <div className="serif-italic" style={{ fontSize: 22, color: "var(--t-ink)" }}>
        {guide.name}
      </div>
      <div
        className="body-prose"
        style={{
          fontSize: 13,
          marginTop: 6,
          color: "var(--t-ink-soft)",
        }}
      >
        {guide.sensibility}
      </div>
      <div
        className="eyebrow"
        style={{ marginTop: 12, marginBottom: 4 }}
      >
        voice
      </div>
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          fontFamily: "var(--t-body)",
          fontSize: 13,
          color: "var(--t-ink-soft)",
        }}
      >
        {guide.voice_rules.slice(0, 4).map((r) => (
          <li key={r}>· {r}</li>
        ))}
      </ul>
      <div
        className="eyebrow"
        style={{ marginTop: 12, marginBottom: 4 }}
      >
        sample question
      </div>
      <div
        className="serif-italic"
        style={{
          fontStyle: "italic",
          fontSize: 14,
          color: "var(--t-ink)",
        }}
      >
        &ldquo;{guide.question_bank[0] ?? "—"}&rdquo;
      </div>
    </div>
  );
}
