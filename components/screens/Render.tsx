"use client";

import { useEffect, useState } from "react";
import { BylineMeter } from "@/components/BylineMeter";
import { SCRIPT } from "@/lib/demo";
import { actions, useAppStore } from "@/lib/store";
import type { ProvenanceLine } from "@/lib/types/session";

interface ProvenanceResponse {
  provenance: ProvenanceLine[];
  byline_pct: number;
}

interface RenderLine {
  line: string;
  src_id: string;
  question: string | null;
  answer: string | null;
  match: "exact" | "fuzzy" | "none";
}

export function Render() {
  const [state, dispatch] = useAppStore();
  const { artifact_text, turns } = state;
  const [hovered, setHovered] = useState<RenderLine | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [real, setReal] = useState<ProvenanceResponse | null>(null);

  useEffect(() => {
    dispatch(actions.setEmotion("hopeful"));
  }, [dispatch]);

  // Fetch real provenance when we have a drafted artifact + turns.
  useEffect(() => {
    if (!artifact_text.trim() || turns.length === 0) {
      setReal(null);
      return;
    }
    let cancelled = false;
    fetch("/api/provenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        artifact: artifact_text,
        turns: turns.map((t) => ({ id: t.id, role: t.role, text: t.text })),
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: ProvenanceResponse | null) => {
        if (!cancelled && data) setReal(data);
      })
      .catch(() => {
        // swallow — falls through to the SCRIPT-driven demo trace.
      });
    return () => {
      cancelled = true;
    };
  }, [artifact_text, turns]);

  const useReal = real !== null && artifact_text.trim().length > 0;

  const finalLines: RenderLine[] = useReal
    ? real!.provenance
        .filter((p) => p.line.trim().length > 0)
        .map((p) => {
          const turn = turns.find((t) => t.id === p.source_turn_id);
          const turnIdx = turn ? turns.indexOf(turn) : -1;
          const guideTurn = turnIdx > 0 ? turns[turnIdx - 1] : null;
          return {
            line: p.line.trim(),
            src_id: p.source_turn_id,
            question:
              guideTurn?.role === "guide" ? guideTurn.text : null,
            answer: turn?.text ?? p.source_text,
            match: p.match,
          };
        })
    : SCRIPT.draft
        .filter((d) => d.verified)
        .map((d) => {
          const idx = d.src ? parseInt(d.src.replace(/^q/, ""), 10) - 1 : -1;
          const qa = idx >= 0 ? SCRIPT.interview[idx] : null;
          return {
            line: d.text,
            src_id: d.src ?? "",
            question: qa?.q ?? null,
            answer: qa?.a ?? null,
            match: "exact" as const,
          };
        });

  const bylinePct = useReal ? real!.byline_pct : 100;

  return (
    <div
      className="stage"
      style={{ maxWidth: 760, paddingTop: 64, position: "relative" }}
    >
      <div className="corner-stamp">
        <div className="postmark">
          <div className="pm-top">verified · yours</div>
          <div className="pm-mid">{bylinePct}%</div>
          <div className="pm-bot">mean it · 2026</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div className="eyebrow">
          {useReal
            ? "your artifact · read it aloud"
            : "for tomas · read aloud, saturday"}
        </div>
        <div className="ornament" style={{ marginTop: 12 }}>
          <svg
            width={120}
            height={14}
            viewBox="0 0 120 14"
            style={{ display: "inline" }}
          >
            <path
              d="M 4 7 Q 30 2, 60 7 T 116 7"
              stroke="currentColor"
              strokeWidth={1}
              fill="none"
            />
            <circle cx={60} cy={7} r={2} fill="currentColor" />
          </svg>
        </div>
      </div>

      <article
        style={{
          fontFamily: "var(--t-body)",
          fontSize: 24,
          lineHeight: 1.75,
          textAlign: "center",
          color: "var(--t-ink)",
        }}
      >
        {finalLines.map((ln, i) => {
          const interactive =
            ln.match !== "none" && (ln.question !== null || ln.answer !== null);
          return (
            <div
              key={i}
              className="trace-line"
              tabIndex={interactive ? 0 : -1}
              style={{
                marginBottom: i === finalLines.length - 2 ? 18 : 4,
                cursor: interactive ? "help" : "default",
                opacity: ln.match === "none" ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (interactive) {
                  setHovered(ln);
                  setPos({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHovered(null)}
              onFocus={(e) => {
                if (interactive) {
                  setHovered(ln);
                  const rect = (
                    e.target as HTMLElement
                  ).getBoundingClientRect();
                  setPos({ x: rect.right, y: rect.top + rect.height / 2 });
                }
              }}
              onBlur={() => setHovered(null)}
            >
              {ln.line}
            </div>
          );
        })}
      </article>

      <div className="divider-flourish" style={{ marginTop: 64 }}>
        <span className="ornament-glyph">❦</span>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 18,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <div className="seal" style={{ width: 44, height: 44 }}>
          <span className="seal-glyph" style={{ fontSize: 18 }}>
            M
          </span>
        </div>
        <BylineMeter pct={bylinePct} lines={finalLines.length} />
      </div>
      <div
        className="muted"
        style={{
          fontFamily: "var(--t-mono)",
          fontSize: 10,
          textAlign: "center",
          letterSpacing: "0.14em",
        }}
      >
        every line · hover · see the question that prompted it
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          marginTop: 28,
          flexWrap: "wrap",
        }}
      >
        <button
          className="btn ghost sm"
          onClick={() => dispatch(actions.setModal("download"))}
        >
          ↓ download
        </button>
        <button
          className="btn ghost sm"
          onClick={() => dispatch(actions.setModal("save"))}
        >
          ♡ save
        </button>
        <button
          className="btn ghost sm"
          onClick={() => dispatch(actions.setModal("share"))}
        >
          ↗ share trace
        </button>
        <button
          className="btn sm"
          onClick={() => dispatch(actions.setModal("startover"))}
        >
          start over
        </button>
      </div>

      {hovered && (
        <div
          className="trace-pop"
          role="tooltip"
          style={{
            left: Math.min(
              pos.x + 16,
              (typeof window !== "undefined" ? window.innerWidth : 1024) - 340,
            ),
            top: Math.max(pos.y - 100, 20),
          }}
        >
          <div className="eyebrow" style={{ color: "var(--t-accent)" }}>
            trace · {hovered.match}
          </div>
          {hovered.question && (
            <>
              <div
                className="muted"
                style={{
                  fontFamily: "var(--t-mono)",
                  fontSize: 9,
                  marginTop: 8,
                }}
              >
                question
              </div>
              <div
                className="serif-italic"
                style={{
                  fontSize: 14,
                  marginTop: 2,
                  color: "var(--t-ink)",
                }}
              >
                &ldquo;{hovered.question}&rdquo;
              </div>
            </>
          )}
          {hovered.answer && (
            <>
              <div
                className="muted"
                style={{
                  fontFamily: "var(--t-mono)",
                  fontSize: 9,
                  marginTop: 10,
                }}
              >
                your verbatim answer
              </div>
              <div
                style={{
                  fontSize: 13,
                  marginTop: 4,
                  color: "var(--t-ink-soft)",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{hovered.answer}&rdquo;
              </div>
            </>
          )}
          <div
            style={{
              marginTop: 12,
              paddingTop: 10,
              borderTop: "1px solid var(--t-ink-ghost)",
              fontFamily: "var(--t-mono)",
              fontSize: 9,
              color: "var(--t-verified)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            {hovered.match === "exact"
              ? "✓ exact substring · verified yours"
              : hovered.match === "fuzzy"
                ? "◐ close paraphrase · within 2 edits"
                : "⚠ no source match"}
          </div>
        </div>
      )}
    </div>
  );
}
