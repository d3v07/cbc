"use client";

import { useState } from "react";
import { ModalShell } from "./shared";
import { useAppStore, actions } from "@/lib/store";

export type DownloadFormat = "mp4" | "webm" | "poster";

export interface AvailableFormats {
  mp4?: boolean;
  webm?: boolean;
  poster?: boolean;
}

export interface DownloadOpts {
  includeCaptions: boolean;
  includeByline: boolean;
}

export interface DownloadProps {
  availableFormats?: AvailableFormats;
}

// Stub — wired when ReelRenderer (feat-27-1x) ships and emits real artifact
// blobs. Until then this is a no-op so the modal can be exercised without
// pulling in ffmpeg.wasm.
function downloadArtifact(_format: DownloadFormat, _opts: DownloadOpts): void {
  // TODO(feat-27-render): hand off to ReelRenderer artifact pipeline.
}

interface FormatOption {
  id: DownloadFormat;
  label: string;
  sub: string;
}

const FORMAT_OPTIONS: readonly FormatOption[] = [
  { id: "mp4", label: "MP4", sub: "h.264 · widest compatibility" },
  { id: "webm", label: "WebM", sub: "vp9 · smaller file" },
  { id: "poster", label: "Poster image", sub: "single still · png" },
] as const;

export function Download({ availableFormats }: DownloadProps) {
  const [state, dispatch] = useAppStore();
  const [format, setFormat] = useState<DownloadFormat | null>(null);
  const [includeCaptions, setIncludeCaptions] = useState<boolean>(false);
  const [includeByline, setIncludeByline] = useState<boolean>(false);

  const open = state.modal === "download";
  const close = () => dispatch(actions.setModal(null));

  const visible = FORMAT_OPTIONS.filter((opt) => availableFormats?.[opt.id] === true);

  const onDownload = () => {
    if (!format) return;
    downloadArtifact(format, { includeCaptions, includeByline });
    close();
  };

  return (
    <ModalShell open={open} onClose={close} title="Download">
      <div
        className="body-prose"
        style={{ fontSize: 14, marginBottom: 16, color: "var(--t-ink-soft)" }}
      >
        Pick a format and what to include. Stays on this device.
      </div>

      <fieldset
        style={{
          border: "none",
          padding: 0,
          margin: 0,
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <legend
          className="eyebrow"
          style={{ marginBottom: 6, fontFamily: "var(--t-mono)", fontSize: 10 }}
        >
          format
        </legend>
        {visible.length === 0 ? (
          <div
            style={{
              fontFamily: "var(--t-mono)",
              fontSize: 11,
              color: "var(--t-ink-faint)",
              padding: "8px 0",
            }}
          >
            no formats available yet
          </div>
        ) : (
          visible.map((opt) => (
            <label
              key={opt.id}
              data-testid={`fmt-${opt.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "8px 10px",
                border: "1px solid var(--t-ink-ghost)",
                borderRadius: 3,
                cursor: "pointer",
                background:
                  format === opt.id ? "var(--t-accent-soft)" : "transparent",
              }}
            >
              <input
                type="radio"
                name="download-format"
                value={opt.id}
                checked={format === opt.id}
                onChange={() => setFormat(opt.id)}
              />
              <span
                className="serif-italic"
                style={{ fontSize: 15, color: "var(--t-ink)" }}
              >
                {opt.label}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "var(--t-mono)",
                  fontSize: 9,
                  color: "var(--t-ink-faint)",
                }}
              >
                {opt.sub}
              </span>
            </label>
          ))
        )}
      </fieldset>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          marginBottom: 20,
          padding: "10px 12px",
          border: "1px solid var(--t-ink-ghost)",
          borderRadius: 3,
        }}
      >
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={includeCaptions}
            onChange={(e) => setIncludeCaptions(e.target.checked)}
          />
          <span style={{ fontFamily: "var(--t-body)", fontSize: 14 }}>
            Include captions
          </span>
        </label>
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <input
            type="checkbox"
            checked={includeByline}
            onChange={(e) => setIncludeByline(e.target.checked)}
          />
          <span style={{ fontFamily: "var(--t-body)", fontSize: 14 }}>
            Include byline
          </span>
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
        <button type="button" onClick={close} className="btn ghost sm">
          cancel
        </button>
        <button
          type="button"
          onClick={onDownload}
          disabled={!format}
          className="btn primary"
        >
          download
        </button>
      </div>
    </ModalShell>
  );
}

export default Download;
