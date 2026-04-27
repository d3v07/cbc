"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getKey } from "@/lib/byo-key";
import { actions, useAppStore } from "@/lib/store";
import type { CritiqueCard } from "@/lib/types/session";

export function Drafting() {
  const [state, dispatch] = useAppStore();
  const { draft, theme, turns, artifact_text } = state;
  const [draftText, setDraftText] = useState(artifact_text);
  const [cards, setCards] = useState<CritiqueCard[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelRef = useRef<AbortController | null>(null);
  const lastArtifactTextRef = useRef(artifact_text);

  useEffect(() => {
    if (artifact_text === lastArtifactTextRef.current) return;
    lastArtifactTextRef.current = artifact_text;
    setDraftText((current) => (current.trim() ? current : artifact_text));
  }, [artifact_text]);

  // Sync local edits up to the store so Render can pick them up.
  useEffect(() => {
    dispatch(actions.setArtifactText(draftText));
  }, [draftText, dispatch]);

  const goToRender = () => {
    const text = draftText.trim();
    if (!text) return;
    dispatch(actions.setArtifactText(text));
    dispatch(actions.setStep("render"));
  };

  const fetchCritique = useCallback(
    async (text: string) => {
      if (!text.trim() || !draft.guide_id) return;
      // Cancel any in-flight critique
      cancelRef.current?.abort();
      const controller = new AbortController();
      cancelRef.current = controller;
      setIsStreaming(true);
      setCards([]);

      try {
        const byoKey = getKey();
        const res = await fetch("/api/draft/critique", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(byoKey ? { "X-Anthropic-Key": byoKey } : {}),
          },
          body: JSON.stringify({
            draft: text,
            turns: turns.map((t) => ({
              id: t.id,
              role: t.role,
              text: t.text,
            })),
            guide_id: draft.guide_id,
            theme,
          }),
          signal: controller.signal,
        });

        if (!res.ok) return;

        const ct = res.headers.get("Content-Type") ?? "";
        if (!ct.includes("text/event-stream")) {
          // Stub mode JSON
          const json = (await res.json()) as { cards?: CritiqueCard[] };
          setCards(json.cards ?? []);
          return;
        }

        // Real-mode SSE
        const reader = res.body?.getReader();
        if (!reader) return;
        const decoder = new TextDecoder();
        let buffer = "";
        const collected: CritiqueCard[] = [];
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary = buffer.indexOf("\n\n");
          while (boundary !== -1) {
            const frame = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            boundary = buffer.indexOf("\n\n");
            if (!frame.trim()) continue;
            let event = "message";
            let data = "";
            for (const line of frame.split("\n")) {
              if (line.startsWith("event:")) event = line.slice(6).trim();
              else if (line.startsWith("data:")) data = line.slice(5).trim();
            }
            if (event === "card") {
              try {
                const card = JSON.parse(data) as CritiqueCard;
                collected.push(card);
                setCards([...collected]);
              } catch {
                // malformed frame — skip
              }
            }
          }
        }
      } catch (err) {
        // AbortError is expected on debounce; swallow it. Other errors
        // we ignore for now — the right pane just stays empty.
        if ((err as Error).name !== "AbortError") {
          // no-op for v1
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [draft.guide_id, turns, theme],
  );

  // Debounced critique fetch — fire 600ms after the user stops typing.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!draftText.trim()) return;
    debounceRef.current = setTimeout(() => {
      void fetchCritique(draftText);
    }, 600);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [draftText, fetchCritique]);

  if (!draft.guide_id) {
    return (
      <div className="stage">
        <div className="eyebrow">drafting</div>
        <h1 className="h-display tiny" style={{ marginTop: 12 }}>
          Pick a guide first.
        </h1>
        <button
          className="btn primary"
          style={{ marginTop: 16 }}
          onClick={() => dispatch(actions.setStep("guide"))}
        >
          back to guide picker →
        </button>
      </div>
    );
  }

  const wordCount = draftText.split(/\s+/).filter(Boolean).length;
  const canRender = draftText.trim().length > 0;

  return (
    <div className="stage" style={{ maxWidth: 1180 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 22,
        }}
      >
        <div className="eyebrow">drafting · {draft.guide_id}</div>
        <span
          className="muted"
          style={{ fontFamily: "var(--t-mono)", fontSize: 10 }}
        >
          {wordCount} words
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.5fr 1fr",
          gap: 48,
          alignItems: "start",
        }}
      >
        {/* LEFT — editor */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            your draft · take your time
          </div>
          <textarea
            className="textarea-prose"
            value={draftText}
            onChange={(e) => setDraftText(e.target.value)}
            rows={20}
            placeholder="start with one of your phrases. let the rest follow."
            style={{ fontSize: 19, minHeight: 480, lineHeight: 1.7 }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginTop: 14,
            }}
          >
            <button
              className="btn primary"
              onClick={goToRender}
              disabled={!canRender}
              style={{
                opacity: canRender ? 1 : 0.4,
              }}
            >
              render the artifact →
            </button>
          </div>
        </div>

        {/* RIGHT — critique stream */}
        <div>
          <div
            className="eyebrow"
            style={{ marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}
          >
            <span>guide · just notes</span>
            {isStreaming && (
              <span
                className="muted"
                style={{ fontFamily: "var(--t-mono)", fontSize: 10 }}
              >
                · listening
              </span>
            )}
          </div>
          {cards.length === 0 && !isStreaming && (
            <div
              className="muted"
              style={{
                fontFamily: "var(--t-mono)",
                fontSize: 11,
                padding: 12,
              }}
            >
              start writing — the guide will read alongside.
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {cards.map((card, i) => {
              const accent =
                card.kind === "cliche"
                  ? "var(--t-accent)"
                  : card.kind === "verified"
                    ? "var(--t-verified)"
                    : "var(--t-ink-soft)";
              const labelText =
                card.kind === "cliche"
                  ? "⚠ cliché · borrowed phrase"
                  : card.kind === "verified"
                    ? "✓ verified yours"
                    : "? noticing";
              return (
                <div
                  key={i}
                  className="card outlined"
                  style={{
                    padding: "12px 16px",
                    borderLeft: `2px solid ${accent}`,
                    animation: "fadein 400ms ease",
                  }}
                >
                  <div className="eyebrow" style={{ color: accent }}>
                    {labelText}
                  </div>
                  {card.line_ref && (
                    <div
                      className="serif-italic"
                      style={{
                        fontSize: 14,
                        fontStyle: "italic",
                        marginTop: 4,
                        color: "var(--t-ink)",
                      }}
                    >
                      &ldquo;{card.line_ref}&rdquo;
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: "var(--t-body)",
                      fontSize: 14,
                      marginTop: 6,
                      color: "var(--t-ink-soft)",
                      lineHeight: 1.5,
                    }}
                  >
                    {card.body}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
