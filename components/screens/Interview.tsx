"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MASCOTS, Mascot, type MascotId } from "@/components/mascots";
import { getKey } from "@/lib/byo-key";
import { actions, useAppStore } from "@/lib/store";
import type { Turn } from "@/lib/types/session";

function mascotForGuide(guide_id: string | null): MascotId | null {
  if (!guide_id) return null;
  for (const m of Object.values(MASCOTS)) {
    if (m.guide_id === guide_id) return m.id;
  }
  return null;
}

const MAX_GUIDE_QUESTIONS = 8;

function normalizePhrase(phrase: string): string {
  return phrase.replace(/\s+/g, " ").trim();
}

function mergeHeldPhrases(existing: string[], incoming: string[]): string[] {
  const merged: string[] = [];

  for (const raw of [...existing, ...incoming]) {
    const phrase = normalizePhrase(raw);
    if (!phrase || merged.includes(phrase)) continue;
    merged.push(phrase);
  }

  return merged.slice(-3);
}

function heldPhrasesFromTurns(turns: Turn[]): string[] {
  return turns.reduce<string[]>((held, turn) => {
    if (turn.role !== "user") return held;
    return mergeHeldPhrases(held, turn.phrases_held ?? []);
  }, []);
}

function fallbackHeldPhrases(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];

  const clauses = cleaned
    .split(/(?:[.!?;]\s+|,\s+)/)
    .map(normalizePhrase)
    .filter(Boolean);
  const exactClauses = clauses.filter((phrase) => {
    const wc = phrase.split(" ").length;
    return wc >= 3 && wc <= 14;
  });
  if (exactClauses.length >= 3) return exactClauses.slice(0, 3);

  const words = cleaned.split(" ").filter(Boolean);
  const windows: string[] = [];
  for (let i = 0; i < words.length && windows.length < 3; i += 6) {
    const phrase = words.slice(i, i + 6).join(" ");
    if (phrase.split(" ").length >= 3) windows.push(phrase);
  }

  return mergeHeldPhrases(exactClauses, windows);
}

export function Interview() {
  const [state, dispatch] = useAppStore();
  const { draft, theme, session_id, turns, emotion } = state;
  const mascotId = mascotForGuide(draft.guide_id);
  const persistedHeldPhrases = useMemo(
    () => heldPhrasesFromTurns(turns),
    [turns],
  );

  const [streamingText, setStreamingText] = useState("");
  const [phrasesHeld, setPhrasesHeld] = useState<string[]>(
    () => persistedHeldPhrases,
  );
  const [userInput, setUserInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const runTurn = useCallback(
    async (extraUserTurn?: Turn) => {
      if (
        !draft.guide_id ||
        !draft.recipient ||
        !draft.occasion ||
        !draft.form
      ) {
        setError("Pick the moment + a guide before continuing.");
        return;
      }
      const guideTurnsSoFar = turns.filter((t) => t.role === "guide").length;
      if (guideTurnsSoFar >= MAX_GUIDE_QUESTIONS) {
        setError("8 questions reached. Move to the spine when you're ready.");
        return;
      }

      const sid = session_id || extraUserTurn?.session_id || crypto.randomUUID();
      if (!session_id) dispatch(actions.setSessionId(sid));
      const normalizedUserTurn = extraUserTurn
        ? { ...extraUserTurn, session_id: sid }
        : undefined;

      setIsStreaming(true);
      setStreamingText("");
      let nextHeldPhrases = mergeHeldPhrases(
        heldPhrasesFromTurns(turns),
        normalizedUserTurn ? fallbackHeldPhrases(normalizedUserTurn.text) : [],
      );
      setPhrasesHeld(nextHeldPhrases);
      setError(null);

      const turnsToSend = normalizedUserTurn
        ? [...turns, normalizedUserTurn]
        : turns;
      let assistantText = "";

      try {
        const byoKey = getKey();
        const res = await fetch("/api/interview/turn", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(byoKey ? { "X-Anthropic-Key": byoKey } : {}),
          },
          body: JSON.stringify({
            session: {
              recipient: draft.recipient,
              occasion: draft.occasion,
              form: draft.form,
            },
            guide_id: draft.guide_id,
            turns: turnsToSend,
            theme,
          }),
        });

        if (!res.ok) {
          const errJson = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(errJson.error ?? `request failed (${res.status})`);
          setIsStreaming(false);
          return;
        }

        const ct = res.headers.get("Content-Type") ?? "";
        if (!ct.includes("text/event-stream")) {
          // Stub fallback — JSON shape from no-key path
          const json = (await res.json()) as {
            question?: string;
            meta?: string | null;
            phrases_held?: string[];
          };
          assistantText = json.question ?? "";
          if (json.meta) assistantText += `\n\n— ${json.meta}`;
          nextHeldPhrases = mergeHeldPhrases(
            nextHeldPhrases,
            json.phrases_held ?? [],
          );
          setStreamingText(assistantText);
          setPhrasesHeld(nextHeldPhrases);
        } else {
          // Real SSE path
          const reader = res.body?.getReader();
          if (!reader) {
            setError("response had no body");
            setIsStreaming(false);
            return;
          }
          const decoder = new TextDecoder();
          let buffer = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            // Split on the SSE frame boundary (blank line). The trailing
            // partial frame stays in `buffer` until the next chunk fills it.
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
              try {
                if (event === "delta") {
                  const { text } = JSON.parse(data) as { text: string };
                  assistantText += text;
                  setStreamingText(assistantText);
                } else if (event === "phrases_held") {
                  const { phrases } = JSON.parse(data) as { phrases: string[] };
                  nextHeldPhrases = mergeHeldPhrases(nextHeldPhrases, phrases);
                  setPhrasesHeld(nextHeldPhrases);
                } else if (event === "error") {
                  const { message } = JSON.parse(data) as { message: string };
                  setError(message);
                }
                // 'done' frame ends the stream — reader.read() will report done next
              } catch {
                // malformed frame — drop silently rather than break the stream
              }
            }
          }
        }

        // Persist the turn pair on success.
        const ts = Date.now();
        if (normalizedUserTurn) {
          dispatch(
            actions.appendTurn({
              ...normalizedUserTurn,
              phrases_held: nextHeldPhrases,
            }),
          );
        }
        dispatch(
          actions.appendTurn({
            id: `g-${ts}`,
            session_id: sid,
            role: "guide",
            text: assistantText.trim(),
            ts,
          }),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "request failed");
      } finally {
        setIsStreaming(false);
      }
    },
    [draft, theme, turns, session_id, dispatch],
  );

  // First-load: if no turns yet, fetch the opening question. If we already
  // have turns (resuming), show the most recent guide turn.
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (turns.length === 0 && draft.guide_id) {
      void runTurn();
    } else if (turns.length > 0) {
      const lastGuide = [...turns].reverse().find((t) => t.role === "guide");
      if (lastGuide) setStreamingText(lastGuide.text);
    }
  }, [turns, draft.guide_id, runTurn]);

  useEffect(() => {
    if (!isStreaming) setPhrasesHeld(persistedHeldPhrases);
  }, [persistedHeldPhrases, isStreaming]);

  const guideTurnCount = turns.filter((t) => t.role === "guide").length;
  const userTurnCount = turns.filter((t) => t.role === "user").length;
  const atQuestionLimit = guideTurnCount >= MAX_GUIDE_QUESTIONS;

  const onSubmit = () => {
    const text = userInput.trim();
    if (!text || isStreaming) return;
    if (atQuestionLimit) {
      setError("8 questions reached. Move to the spine when you're ready.");
      return;
    }
    const sid = session_id || crypto.randomUUID();
    const userTurn: Turn = {
      id: `u-${Date.now()}`,
      session_id: sid,
      role: "user",
      text,
      ts: Date.now(),
    };
    setUserInput("");
    void runTurn(userTurn);
  };

  if (!draft.guide_id) {
    return (
      <div className="stage">
        <div className="eyebrow">interview</div>
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
  const sendDisabled = !userInput.trim() || isStreaming || atQuestionLimit;
  const visibleHeldPhrases =
    phrasesHeld.length > 0 ? phrasesHeld : persistedHeldPhrases;
  const canFindSpine = turns.length >= 2 || visibleHeldPhrases.length > 0;

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
        <div className="eyebrow">interview · {draft.guide_id}</div>
        <span
          className="muted"
          style={{ fontFamily: "var(--t-mono)", fontSize: 10 }}
        >
          {guideTurnCount}/{MAX_GUIDE_QUESTIONS} questions · {userTurnCount} answers
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 56,
          alignItems: "start",
        }}
      >
        {/* LEFT — guide + question + holding pane */}
        <div style={{ paddingTop: 8 }}>
          {mascotId && (
            <div style={{ marginBottom: 22 }}>
              <Mascot id={mascotId} emotion={emotion} size={84} />
            </div>
          )}
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            the guide is asking
          </div>
          <div
            className="serif-italic"
            style={{ fontSize: 32, lineHeight: 1.25, color: "var(--t-ink)" }}
          >
            {streamingText || (
              <span className="muted" style={{ fontStyle: "italic" }}>
                listening…
              </span>
            )}
            {isStreaming && (
              <span
                style={{
                  display: "inline-block",
                  width: 1.5,
                  height: 22,
                  background: "var(--t-ink)",
                  marginLeft: 4,
                  verticalAlign: "middle",
                  animation: "blink 1s infinite",
                }}
              />
            )}
          </div>

          {visibleHeldPhrases.length > 0 && (
            <div
              className="card"
              style={{
                marginTop: 28,
                padding: "14px 18px",
                borderLeft: "2px solid var(--t-accent)",
                animation: "fadein 600ms ease",
              }}
            >
              <div className="eyebrow" style={{ color: "var(--t-accent)" }}>
                holding · {visibleHeldPhrases.length}/3 from your turn
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "8px 0 0",
                }}
              >
                {visibleHeldPhrases.map((p) => (
                  <li
                    key={p}
                    className="serif-italic"
                    style={{
                      fontSize: 17,
                      fontStyle: "italic",
                      color: "var(--t-ink)",
                      marginTop: 4,
                    }}
                  >
                    &ldquo;<span className="hl">{p}</span>&rdquo;
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* RIGHT — user input */}
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            your turn · take your time
          </div>
          <textarea
            className="textarea-prose"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={7}
            placeholder="something specific. one detail is enough."
            style={{ fontSize: 19, minHeight: 200 }}
            disabled={isStreaming || atQuestionLimit}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 14,
              alignItems: "center",
            }}
          >
            <span
              className="muted"
              style={{ fontFamily: "var(--t-mono)", fontSize: 10 }}
            >
              {atQuestionLimit
                ? "8 questions reached · ready for spine"
                : `${userInput.split(/\s+/).filter(Boolean).length} words · all yours`}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn ghost sm"
                onClick={() => dispatch(actions.setStep("spine"))}
                disabled={!canFindSpine}
                style={{ opacity: canFindSpine ? 1 : 0.4 }}
              >
                find the spine →
              </button>
              <button
                className="btn primary"
                onClick={onSubmit}
                disabled={sendDisabled}
                style={{
                  opacity: sendDisabled ? 0.4 : 1,
                }}
              >
                {atQuestionLimit ? "limit reached" : isStreaming ? "listening…" : "send →"}
              </button>
            </div>
          </div>
          {error && (
            <div
              style={{
                marginTop: 12,
                color: "var(--t-accent)",
                fontFamily: "var(--t-mono)",
                fontSize: 11,
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
