"use client";

import { useEffect, useState } from "react";
import { SCRIPT } from "@/lib/demo";
import { actions, useAppStore } from "@/lib/store";

interface HoveredLine {
  text: string;
  src: string;
  q: string;
  a: string;
}

export function Render() {
  const [, dispatch] = useAppStore();
  const [hovered, setHovered] = useState<HoveredLine | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    dispatch(actions.setEmotion("hopeful"));
  }, [dispatch]);

  // Final lines: the cliché was cut during drafting.
  const finalLines = SCRIPT.draft.filter((d) => d.verified);

  // Map "q3" -> SCRIPT.interview[2].
  const lineToQA = (src: string | null) => {
    if (!src) return null;
    const idx = parseInt(src.replace(/^q/, ""), 10) - 1;
    return SCRIPT.interview[idx] ?? null;
  };

  return (
    <div
      className="stage"
      style={{ maxWidth: 760, paddingTop: 64, position: "relative" }}
    >
      <div className="corner-stamp">
        <div className="postmark">
          <div className="pm-top">verified · yours</div>
          <div className="pm-mid">100%</div>
          <div className="pm-bot">mean it · 2025</div>
        </div>
      </div>

      <div style={{ textAlign: "center", marginBottom: 36 }}>
        <div className="eyebrow">for tomas · read aloud, saturday</div>
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
          const qa = lineToQA(ln.src);
          return (
            <div
              key={i}
              className="trace-line"
              style={{
                marginBottom: i === finalLines.length - 2 ? 18 : 4,
              }}
              onMouseEnter={(e) => {
                if (qa && ln.src) {
                  setHovered({
                    text: ln.text,
                    src: ln.src,
                    q: qa.q,
                    a: qa.a,
                  });
                  setPos({ x: e.clientX, y: e.clientY });
                }
              }}
              onMouseMove={(e) => setPos({ x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHovered(null)}
            >
              {ln.text}
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
          gap: 14,
          marginBottom: 8,
        }}
      >
        <div className="seal" style={{ width: 44, height: 44 }}>
          <span className="seal-glyph" style={{ fontSize: 18 }}>
            M
          </span>
        </div>
        <div
          className="serif-italic"
          style={{ fontSize: 22, color: "var(--t-ink)" }}
        >
          One hundred percent your words.
        </div>
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
          className="btn primary sm"
          onClick={() => dispatch(actions.setStep("reel"))}
        >
          make it move
        </button>
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
          style={{
            left: Math.min(
              pos.x + 16,
              (typeof window !== "undefined" ? window.innerWidth : 1024) - 340,
            ),
            top: Math.max(pos.y - 100, 20),
          }}
        >
          <div className="eyebrow" style={{ color: "var(--t-accent)" }}>
            trace · {hovered.src}
          </div>
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
            style={{ fontSize: 14, marginTop: 2, color: "var(--t-ink)" }}
          >
            &ldquo;{hovered.q}&rdquo;
          </div>
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
            &ldquo;{hovered.a}&rdquo;
          </div>
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
            ✓ exact substring · verified yours
          </div>
        </div>
      )}
    </div>
  );
}
