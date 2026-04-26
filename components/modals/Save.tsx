"use client";

import { useEffect, useMemo, useState } from "react";
import { SCRIPT } from "@/lib/demo";
import { actions, useAppStore } from "@/lib/store";
import { SessionSchema, type Session } from "@/lib/types/session";
import { CopyLine, ModalShell, StampMark } from "@/components/modals/shared";

export const SAVED_SESSIONS_KEY = "mean_it_sessions_v1";

type Visibility = "private" | "unlisted";

interface SavedSessionRecord {
  title: string;
  privacy: Visibility;
  share_url: string;
  saved_at: number;
  session: Session;
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}`;
}

function shareUrlFor(id: string): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "https://meanit.app";
  return `${origin}/?session=${encodeURIComponent(id)}`;
}

function readSavedSessions(): SavedSessionRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SAVED_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedSessionRecord[]) : [];
  } catch {
    return [];
  }
}

function writeSavedSession(record: SavedSessionRecord): void {
  if (typeof window === "undefined") return;
  const saved = readSavedSessions();
  window.localStorage.setItem(SAVED_SESSIONS_KEY, JSON.stringify([...saved, record]));
}

export default function Save() {
  const [state, dispatch] = useAppStore();
  const [title, setTitle] = useState("For Tomas · Saturday");
  const [privacy, setPrivacy] = useState<Visibility>("private");
  const [record, setRecord] = useState<SavedSessionRecord | null>(null);

  const open = state.modal === "save";
  const dismiss = () => dispatch(actions.setModal(null));

  useEffect(() => {
    if (!open) return;
    setRecord(null);
    setTitle(state.draft.recipient ? `For ${state.draft.recipient}` : "For Tomas · Saturday");
    setPrivacy("private");
  }, [open, state.draft.recipient]);

  const summary = useMemo(() => {
    const guide = state.draft.guide_id ?? SCRIPT.guide_id;
    return {
      guide,
      theme: state.theme,
      verifiedLines: SCRIPT.draft.filter((line) => line.verified).length,
      questions: SCRIPT.interview.length,
    };
  }, [state.draft.guide_id, state.theme]);

  const save = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const id = makeId();
    const session = SessionSchema.parse({
      id,
      recipient: state.draft.recipient || SCRIPT.recipient,
      occasion: state.draft.occasion || SCRIPT.occasion,
      form: state.draft.form ?? SCRIPT.form,
      guide_id: state.draft.guide_id ?? SCRIPT.guide_id,
      theme: state.theme,
      photos: [],
      audit: [],
      created_at: Date.now(),
    });
    const next: SavedSessionRecord = {
      title: cleanTitle,
      privacy,
      share_url: shareUrlFor(id),
      saved_at: Date.now(),
      session,
    };
    writeSavedSession(next);
    setRecord(next);
  };

  return (
    <ModalShell open={open} onClose={dismiss} title="Save" maxWidth={560}>
      <div className="eyebrow accent">save · personal</div>
      {!record ? (
        <>
          <p
            className="body-prose"
            style={{ fontSize: 15, marginTop: 8, marginBottom: 18, color: "var(--t-ink)" }}
          >
            Keep this letter in your local library and choose who can open the link.
          </p>

          <label className="eyebrow" htmlFor="save-title" style={{ display: "block", marginBottom: 6 }}>
            title
          </label>
          <input
            id="save-title"
            className="input-stroke"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            style={{ marginBottom: 20, fontSize: 22 }}
          />

          <div className="plate" style={{ padding: "14px 16px", marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                fontFamily: "var(--t-mono)",
                fontSize: 11,
                color: "var(--t-ink-soft)",
              }}
            >
              <span>guide · {summary.guide}</span>
              <span>theme · {summary.theme}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 14,
                fontFamily: "var(--t-mono)",
                fontSize: 11,
                color: "var(--t-ink-soft)",
                marginTop: 6,
              }}
            >
              <span>{summary.verifiedLines} verified lines</span>
              <span>{summary.questions} questions answered</span>
            </div>
          </div>

          <fieldset style={{ border: "none", padding: 0, margin: "0 0 22px" }}>
            <legend className="eyebrow" style={{ marginBottom: 8 }}>
              link access
            </legend>
            {(["private", "unlisted"] as const).map((value) => (
              <label
                key={value}
                style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: 8 }}
              >
                <input
                  type="radio"
                  name="save-privacy"
                  value={value}
                  checked={privacy === value}
                  onChange={() => setPrivacy(value)}
                />
                <span className="serif-italic" style={{ fontSize: 16, color: "var(--t-ink)" }}>
                  {value === "private" ? "private · only this device" : "unlisted · anyone with the link"}
                </span>
              </label>
            ))}
          </fieldset>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <button type="button" className="btn ghost sm" onClick={dismiss}>
              not now
            </button>
            <button
              type="button"
              className="btn primary"
              disabled={title.trim().length === 0}
              onClick={save}
            >
              save to library
            </button>
          </div>
        </>
      ) : (
        <div style={{ animation: "fadein 360ms ease" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 22 }}>
            <StampMark label="saved" size={64} />
          </div>
          <div
            className="serif-italic"
            style={{ fontSize: 24, color: "var(--t-ink)", textAlign: "center", marginBottom: 6 }}
          >
            {record.title}
          </div>
          <div
            className="muted"
            style={{
              fontFamily: "var(--t-mono)",
              fontSize: 10,
              textAlign: "center",
              letterSpacing: "0.14em",
              marginBottom: 20,
            }}
          >
            saved · {record.privacy}
          </div>

          <div className="eyebrow" style={{ marginBottom: 8 }}>
            share-back link
          </div>
          <CopyLine value={record.share_url} label="share-back link" />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
            <button type="button" className="btn sm" onClick={dismiss}>
              back to letter
            </button>
          </div>
        </div>
      )}
    </ModalShell>
  );
}
