"use client";

import { useState } from "react";
import { useAppStore, actions } from "@/lib/store";
import { ModalShell, StampMark, CopyLine } from "@/components/modals/shared";

type ShareMode = "verified" | "partial" | "full";

interface ModeOption {
  id: ShareMode;
  label: string;
  helper: string;
}

const MODES: readonly ModeOption[] = [
  {
    id: "verified",
    label: "verified-only",
    helper: "only the lines marked verified",
  },
  {
    id: "partial",
    label: "partial",
    helper: "your draft and provenance, no interview turns",
  },
  {
    id: "full",
    label: "full",
    helper: "everything",
  },
];

// Stub — Frex22's `lib/share/encode` (issue #26) will replace this.
function buildShareUrl(mode: ShareMode): string {
  return `https://meanit.app/?trace=stub-${mode}`;
}

export default function ShareTrace() {
  const [state, dispatch] = useAppStore();
  const [mode, setMode] = useState<ShareMode>("verified");
  const dismiss = () => dispatch(actions.setModal(null));

  return (
    <ModalShell
      open={state.modal === "share"}
      onClose={dismiss}
      title="Share the trace"
    >
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: -4, marginBottom: 8 }}
        aria-hidden="true"
      >
        <StampMark label="trace" size={40} />
      </div>
      <p
        className="body-prose"
        style={{ fontSize: 15, marginTop: 0, marginBottom: 18, color: "var(--t-ink)" }}
      >
        Pick what travels with the link. The trace becomes the receipt.
      </p>

      <fieldset
        style={{ border: "none", padding: 0, margin: 0, marginBottom: 18 }}
      >
        <legend
          className="eyebrow"
          style={{ marginBottom: 10, padding: 0 }}
        >
          audience
        </legend>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {MODES.map((m) => {
            const id = `share-mode-${m.id}`;
            const helperId = `${id}-helper`;
            const checked = mode === m.id;
            return (
              <label
                key={m.id}
                htmlFor={id}
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "flex-start",
                  padding: "10px 12px",
                  border: `1px solid ${checked ? "var(--t-ink)" : "var(--t-ink-faint)"}`,
                  borderRadius: 3,
                  cursor: "pointer",
                  background: checked ? "var(--t-paper-deep)" : "transparent",
                }}
              >
                <input
                  id={id}
                  type="radio"
                  name="share-mode"
                  value={m.id}
                  checked={checked}
                  onChange={() => setMode(m.id)}
                  aria-describedby={helperId}
                  style={{ marginTop: 3 }}
                />
                <span style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span
                    className="serif-italic"
                    style={{ fontSize: 16, color: "var(--t-ink)" }}
                  >
                    {m.label}
                  </span>
                  <span
                    id={helperId}
                    className="muted"
                    style={{
                      fontFamily: "var(--t-mono)",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                    }}
                  >
                    {m.helper}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="eyebrow" style={{ marginBottom: 8 }}>
        share-trace link
      </div>
      <CopyLine value={buildShareUrl(mode)} label="share-trace link" />

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
        <button type="button" className="btn ghost" onClick={dismiss}>
          cancel
        </button>
      </div>
    </ModalShell>
  );
}
