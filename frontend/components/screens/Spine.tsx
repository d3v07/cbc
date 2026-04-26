"use client";

import { useEffect, useState } from "react";
import type {
  DemoSpineCandidate,
  DemoStructureMovement,
} from "@/lib/demo";
import { actions, useAppStore } from "@/lib/store";

interface SpineResponse {
  candidates: DemoSpineCandidate[];
  structure: DemoStructureMovement[];
}

export function Spine() {
  const [, dispatch] = useAppStore();
  const [data, setData] = useState<SpineResponse | null>(null);
  const [pickIdx, setPickIdx] = useState(0);

  useEffect(() => {
    dispatch(actions.setEmotion("moved"));
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/spine", { method: "POST" })
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
  }, []);

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
            key={c.source_turn_id}
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
        structure the guide proposes — three movements
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}
      >
        {structure.map((s) => (
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
                fontFamily: "var(--t-mono)",
                fontSize: 10,
                color: "var(--t-ink-faint)",
                textAlign: "center",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              your words · go here
            </div>
          </div>
        ))}
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
          onClick={() => dispatch(actions.nextStep())}
        >
          start writing →
        </button>
      </div>
    </div>
  );
}
