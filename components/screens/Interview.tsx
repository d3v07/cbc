"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export function Interview() {
  const [state, dispatch] = useAppStore();
  const { draft, theme, session_id, turns, emotion } = state;
  const mascotId = mascotForGuide(draft.guide_id);

  const [streamingText, setStreamingText] = useState("");
  const [phrasesHeld, setPhrasesHeld] = useState<string[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  // Ensure a session_id exists before any turn is recorded — Turn.session_id
  // is required by the canonical schema.
  useEffect(() => {
    if (!session_id) {
      dispatch(actions.setSessionId(crypto.randomUUID()));
    }
  }, [session_id, dispatch]);

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
      setIsStreaming(true);
      setStreamingText("");
      setPhrasesHeld([]);
      setError(null);

      const turnsToSend = extraUserTurn ? [...turns, extraUserTurn] : turns;
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
          setStreamingText(assistantText);
          setPhrasesHeld(json.phrases_held ?? []);
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
                  setPhrasesHeld(phrases);
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
        const sid = session_id || crypto.randomUUID();
        if (extraUserTurn) {
          dispatch(actions.appendTurn(extraUserTurn));
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

  const onSubmit = () => {
    const text = userInput.trim();
    if (!text || isStreaming) return;
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

  const guideTurnCount = turns.filter((t) => t.role === "guide").length;
  const userTurnCount = turns.filter((t) => t.role === "user").length;

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
          {guideTurnCount} questions · {userTurnCount} answers
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

          {phrasesHeld.length > 0 && (
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
                holding · from your turn
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: "8px 0 0",
                }}
              >
                {phrasesHeld.map((p) => (
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
            disabled={isStreaming}
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
              {userInput.split(/\s+/).filter(Boolean).length} words · all yours
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn ghost sm"
                onClick={() => dispatch(actions.setStep("spine"))}
                disabled={turns.length < 2}
                style={{ opacity: turns.length < 2 ? 0.4 : 1 }}
              >
                find the spine →
              </button>
              <button
                className="btn primary"
                onClick={onSubmit}
                disabled={!userInput.trim() || isStreaming}
                style={{
                  opacity: !userInput.trim() || isStreaming ? 0.4 : 1,
                }}
              >
                {isStreaming ? "listening…" : "send →"}
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
