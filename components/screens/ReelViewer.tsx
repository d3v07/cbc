"use client";

import { useMemo, useState } from "react";
import { ReelRenderer } from "@/components/ReelRenderer";
import { SCRIPT } from "@/lib/demo";
import { actions, useAppStore } from "@/lib/store";
import type { Storyboard } from "@/lib/types/media";
import type { DownloadArtifact } from "@/components/modals/Download";

interface PhotoInput {
  file_id: string;
  url: string;
  label: string;
}

interface ReelPackage {
  storyboard: Storyboard;
  photos: PhotoInput[];
  audio: Blob;
  durationSec: number;
}

export interface ReelViewerProps {
  onMp4Ready?: (artifact: DownloadArtifact) => void;
  audioDurationSec?: number;
}

function svgPhoto(label: string, colorA: string, colorB: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${colorA}"/><stop offset="1" stop-color="${colorB}"/></linearGradient></defs><rect width="1080" height="1920" fill="url(#g)"/><rect x="96" y="1260" width="888" height="220" fill="rgba(0,0,0,0.28)"/><text x="540" y="1388" text-anchor="middle" font-family="serif" font-size="58" fill="#f5ecd9">${label}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function silentWav(durationSec: number): Blob {
  const sampleRate = 8000;
  const samples = Math.max(1, Math.floor(durationSec * sampleRate));
  const bytesPerSample = 2;
  const buffer = new ArrayBuffer(44 + samples * bytesPerSample);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i += 1) view.setUint8(offset + i, value.charCodeAt(i));
  };
  write(0, "RIFF");
  view.setUint32(4, 36 + samples * bytesPerSample, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  write(36, "data");
  view.setUint32(40, samples * bytesPerSample, true);
  return new Blob([buffer], { type: "audio/wav" });
}

function buildReelPackage(durationSec: number, theme: Storyboard["theme"]): ReelPackage {
  const verified = SCRIPT.draft.filter((line) => line.verified);
  const photos: PhotoInput[] = [
    {
      file_id: "photo_radio",
      label: "radio dial",
      url: svgPhoto("radio dial", "#33251b", "#8b6f46"),
    },
    {
      file_id: "photo_kitchen",
      label: "kitchen light",
      url: svgPhoto("kitchen light", "#5e1810", "#d4a85a"),
    },
    {
      file_id: "photo_notebook",
      label: "notebook",
      url: svgPhoto("notebook", "#26321f", "#f5ecd9"),
    },
  ];
  const totalMs = Math.round(durationSec * 1000);
  const clipMs = Math.floor(totalMs / verified.length);
  const ids = photos.map((photo) => photo.file_id);
  const clips = verified.map((line, index) => ({
    file_id: ids[index % ids.length] ?? ids[0] ?? "photo_radio",
    start_ms: index * clipMs,
    duration_ms: index === verified.length - 1 ? totalMs - index * clipMs : clipMs,
    caption: line.text,
    ken_burns: {
      start: { x: 0.5, y: 0.5, scale: 1.02 },
      end: { x: index % 2 === 0 ? 0.46 : 0.54, y: 0.5, scale: theme === "cute" ? 1.28 : 1.08 },
    },
  }));

  return {
    storyboard: {
      theme,
      total_duration_ms: totalMs,
      caption_preset: theme === "cute" ? "hand" : theme === "quiet" ? "mono" : "serif-italic",
      clips,
    },
    photos,
    audio: silentWav(durationSec),
    durationSec,
  };
}

export function ReelViewer({ onMp4Ready, audioDurationSec = 30 }: ReelViewerProps) {
  const [state, dispatch] = useAppStore();
  const [rendering, setRendering] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [download, setDownload] = useState<DownloadArtifact | null>(null);
  const reel = useMemo(() => buildReelPackage(audioDurationSec, state.theme), [audioDurationSec, state.theme]);

  const start = () => {
    if (reel.durationSec < 5) {
      setError("Couldn't generate reel: your voice clip is shorter than 5s. Re-record?");
      return;
    }
    setError(null);
    setDownload(null);
    setRendering(true);
    setAttempt((value) => value + 1);
  };

  const complete = (mp4: Blob) => {
    if (mp4.type && mp4.type !== "video/mp4") {
      setError("Couldn't generate reel: the renderer returned a file the browser cannot download.");
      setRendering(false);
      return;
    }
    const artifact = {
      url: URL.createObjectURL(mp4),
      filename: "mean-it-reel.mp4",
    };
    setDownload(artifact);
    onMp4Ready?.(artifact);
    setRendering(false);
  };

  const fail = (err: Error) => {
    setError(`Couldn't generate reel: ${err.message}`);
    setRendering(false);
  };

  return (
    <div className="stage animate-fade-in" style={{ maxWidth: 1040, paddingTop: 48 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow accent">make it move</div>
          <h1 className="h-display smaller" style={{ marginTop: 8, marginBottom: 10 }}>
            A reel for Tomas.
          </h1>
          <div className="body-prose" style={{ maxWidth: 560 }}>
            Preview the storyboard, render the vertical reel, then download the MP4.
          </div>
        </div>
        <button type="button" className="btn ghost sm" onClick={() => dispatch(actions.setStep("render"))}>
          back to letter
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 340px",
          gap: 24,
          marginTop: 32,
          alignItems: "start",
        }}
      >
        <div className="card outlined" style={{ padding: 22 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>
            storyboard · {Math.round(reel.storyboard.total_duration_ms / 1000)}s · 9:16
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {reel.storyboard.clips.map((clip, index) => (
              <div
                key={`${clip.file_id}-${clip.start_ms}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "70px 1fr",
                  gap: 12,
                  alignItems: "center",
                  padding: "10px 0",
                  borderTop: index === 0 ? "none" : "1px solid var(--t-ink-ghost)",
                }}
              >
                <div className="eyebrow">{String(index + 1).padStart(2, "0")}</div>
                <div>
                  <div className="serif-italic" style={{ fontSize: 18, color: "var(--t-ink)" }}>
                    {clip.caption}
                  </div>
                  <div className="muted" style={{ fontFamily: "var(--t-mono)", fontSize: 10, marginTop: 4 }}>
                    {clip.file_id} · {Math.round(clip.duration_ms / 100) / 10}s
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 18,
                padding: "12px 14px",
                border: "1px solid var(--t-accent)",
                color: "var(--t-accent-deep)",
                background: "var(--t-accent-soft)",
                fontFamily: "var(--t-mono)",
                fontSize: 11,
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginTop: 22 }}>
            <button type="button" className="btn ghost sm" onClick={() => dispatch(actions.setModal("download"))}>
              open downloads
            </button>
            {download ? (
              <a className="btn primary" href={download.url} download={download.filename}>
                download mp4
              </a>
            ) : (
              <button type="button" className="btn primary" onClick={start} disabled={rendering}>
                {rendering ? "rendering" : "render reel"}
              </button>
            )}
          </div>
        </div>

        <div className="plate" style={{ padding: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            preview
          </div>
          <div
            style={{
              aspectRatio: "9 / 16",
              width: "100%",
              overflow: "hidden",
              background: "var(--t-ink)",
              border: "1px solid var(--t-ink-ghost)",
            }}
          >
            {rendering ? (
              <ReelRenderer
                key={attempt}
                storyboard={reel.storyboard}
                photos={reel.photos}
                audio={reel.audio}
                onComplete={complete}
                onError={fail}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  backgroundImage: `url("${reel.photos[0]?.url ?? ""}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: 20,
                  color: "var(--t-paper)",
                }}
              >
                <div className="serif-italic" style={{ fontSize: 22, lineHeight: 1.25, textShadow: "0 1px 4px rgba(0,0,0,0.7)" }}>
                  {reel.storyboard.clips[0]?.caption}
                </div>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
            <button type="button" className="btn ghost sm" onClick={start} disabled={rendering}>
              retry
            </button>
            <button type="button" className="btn ghost sm" onClick={() => dispatch(actions.setModal("imagecard"))}>
              image card
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
