"use client";

import { useEffect, useMemo, useState } from "react";
import { getKey } from "@/lib/byo-key";
import type {
  DemoSpineCandidate,
  DemoStructureMovement,
} from "@/lib/demo";
import { SCRIPT } from "@/lib/demo";
import { actions, useAppStore } from "@/lib/store";
import type { Turn } from "@/lib/types/session";

interface SpineResponse {
  candidates: DemoSpineCandidate[];
  structure: DemoStructureMovement[];
}

function normalizePhrase(phrase: string): string {
  return phrase.replace(/\s+/g, " ").trim();
}

function heldPhrasesFromTurns(turns: Turn[]): string[] {
  const held: string[] = [];

  for (const turn of turns) {
    if (turn.role !== "user") continue;
    for (const raw of turn.phrases_held ?? []) {
      const phrase = normalizePhrase(raw);
      if (!phrase || held.includes(phrase)) continue;
      held.push(phrase);
    }
  }

  return held.slice(-3);
}

function candidatesFromHeldPhrases(turns: Turn[]): DemoSpineCandidate[] {
  const userTurns = turns.filter((turn) => turn.role === "user");
  return heldPhrasesFromTurns(turns).map((phrase, index) => {
    const source =
      userTurns.find((turn) => turn.text.includes(phrase)) ??
      userTurns.find((turn) => turn.phrases_held?.includes(phrase));
    const answerIndex = source
      ? userTurns.findIndex((turn) => turn.id === source.id) + 1
      : index + 1;

    return {
      text: phrase,
      source_turn_id: source?.id ?? `held-${index}`,
      source_label: `answer ${String(answerIndex).padStart(2, "0")}`,
    };
  });
}

export function Spine() {
  const [state, dispatch] = useAppStore();
  const { draft, theme, turns } = state;
  const heldCandidates = useMemo(
    () => candidatesFromHeldPhrases(turns),
    [turns],
  );
  const [data, setData] = useState<SpineResponse | null>(() =>
    heldCandidates.length > 0
      ? { candidates: heldCandidates, structure: SCRIPT.structure }
      : null,
  );
  const [pickIdx, setPickIdx] = useState(0);
  const [addedWords, setAddedWords] = useState("");

  useEffect(() => {
    dispatch(actions.setEmotion("moved"));
  }, [dispatch]);

  useEffect(() => {
    if (heldCandidates.length === 0) return;
    setData({ candidates: heldCandidates, structure: SCRIPT.structure });
    setPickIdx((idx) => Math.min(idx, heldCandidates.length - 1));
  }, [heldCandidates]);

  useEffect(() => {
    if (heldCandidates.length > 0) return;
    let cancelled = false;
    const byoKey = getKey();
    fetch("/api/spine", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(byoKey ? { "X-Anthropic-Key": byoKey } : {}),
      },
      body: JSON.stringify({
        guide_id: draft.guide_id ?? undefined,
        form: draft.form ?? undefined,
        turns,
        theme,
      }),
    })
      .then((r) => r.json())
      .then((d: SpineResponse) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        // Stub mode — silently fall through; UI shows the loading state.
      });
    return () => {
      cancelled = true;
    };
  }, [draft.form, draft.guide_id, heldCandidates.length, theme, turns]);

  if (!data) {
    return (
      <div className="stage">
        <div
          className="muted"
          style={{ fontFamily: "var(--t-mono)", fontSize: 11 }}
        >
          listening for the spine…
        </div>
      </div>
    );
  }

  const { candidates, structure } = data;
  const selectedPhrase = candidates[pickIdx]?.text ?? "";
  const draftSeed = [selectedPhrase, addedWords.trim()]
    .filter(Boolean)
    .join("\n\n");
  const startWriting = () => {
    if (draftSeed) dispatch(actions.setArtifactText(draftSeed));
    dispatch(actions.nextStep());
  };

  return (
    <div className="stage">
      <div className="eyebrow">spine · the line everything else hangs from</div>
      <h1
        className="h-display smaller"
        style={{ marginTop: 8, marginBottom: 8 }}
      >
        Three of your phrases.
        <br />
        One of them is the heart.
      </h1>
      <div className="body-prose" style={{ maxWidth: 580, marginBottom: 28 }}>
        Every phrase below is your verbatim text. Pick the one this letter is
        built around.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 14,
        }}
      >
        {candidates.map((c, i) => (
          <button
            key={`${c.source_turn_id}-${c.text}`}
            onClick={() => setPickIdx(i)}
            className={"card " + (pickIdx === i ? "selected" : "outlined")}
            style={{
              textAlign: "left",
              cursor: "pointer",
              padding: "20px 22px",
              fontFamily: "inherit",
              color: "inherit",
              minHeight: 200,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div className="eyebrow">
                phrase {String(i + 1).padStart(2, "0")}
              </div>
              <div
                className="serif-italic"
                style={{
                  fontSize: 22,
                  lineHeight: 1.3,
                  marginTop: 10,
                  color: "var(--t-ink)",
                }}
              >
                &ldquo;{c.text}&rdquo;
              </div>
            </div>
            <div
              className="muted"
              style={{
                fontFamily: "var(--t-mono)",
                fontSize: 10,
                marginTop: 16,
              }}
            >
              {pickIdx === i
                ? "● this is the spine"
                : "from · " + c.source_label}
            </div>
          </button>
        ))}
      </div>

      <div className="divider-flourish" />

      <div className="eyebrow" style={{ marginBottom: 12 }}>
        add your words around the spine
      </div>
      <textarea
        className="textarea-prose ruled"
        rows={5}
        value={addedWords}
        onChange={(event) => setAddedWords(event.target.value)}
        placeholder="add the words you want to carry into drafting."
        style={{ fontSize: 18, minHeight: 150, marginBottom: 28 }}
      />

      <div className="eyebrow" style={{ marginBottom: 12 }}>
        structure the guide proposes — three movements
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {structure.map((s, index) => {
          const phrase = candidates[index]?.text;
          return (
          <div
            key={s.label}
            className="card outlined"
            style={{ padding: "18px 22px" }}
          >
            <div className="eyebrow" style={{ color: "var(--t-accent)" }}>
              movement
            </div>
            <div
              className="serif-italic"
              style={{ fontSize: 22, marginTop: 6, color: "var(--t-ink)" }}
            >
              {s.label}
            </div>
            <div
              className="muted"
              style={{
                fontFamily: "var(--t-mono)",
                fontSize: 10,
                marginTop: 4,
              }}
            >
              {s.sub}
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "14px 12px",
                border: "1px dashed var(--t-ink-faint)",
                borderRadius: "var(--t-radius)",
                fontFamily: phrase ? "var(--t-display)" : "var(--t-mono)",
                fontSize: phrase ? 18 : 10,
                color: phrase ? "var(--t-ink)" : "var(--t-ink-faint)",
                textAlign: phrase ? "left" : "center",
                letterSpacing: phrase ? 0 : "0.1em",
                textTransform: phrase ? "none" : "uppercase",
                fontStyle: phrase ? "italic" : "normal",
                lineHeight: 1.25,
              }}
            >
              {phrase ? `“${phrase}”` : "your words · go here"}
            </div>
          </div>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 36,
        }}
      >
        <span
          className="muted"
          style={{ fontFamily: "var(--t-mono)", fontSize: 11 }}
        >
          swap or drop any movement · this is yours
        </span>
        <button
          className="btn primary"
          onClick={startWriting}
        >
          start writing →
        </button>
      </div>
    </div>
  );
}
