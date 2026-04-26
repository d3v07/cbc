"use client";

// Real-time canvas reel renderer. Pre-loads photos, animates Ken Burns +
// captions on a 1080x1920 canvas at 30fps, mixes the user's voice clip via
// WebAudio, records via MediaRecorder, then transcodes the WebM to MP4 via
// ffmpeg.wasm (lib/video/transcode). Cleanup tears down all streams, the
// AudioContext, and the rAF loop on unmount or error.

import { useEffect, useRef, useState } from "react";
import type { CaptionPreset, Clip, KenBurns, Storyboard } from "@/lib/types/media";
import { transcodeWebmToMp4 } from "@/lib/video/transcode";

const CANVAS_WIDTH = 1080;
const CANVAS_HEIGHT = 1920;
const FPS = 30;

// CSS-token-mapped fonts. Tokens are defined in app/globals.css under :root.
// Falls back through standard families if the token chain doesn't resolve at
// canvas paint time (canvas can't read --t-* vars directly, so we resolve via
// getComputedStyle on document.documentElement).
const CAPTION_FONT_TOKEN: Record<CaptionPreset, { token: string; fallback: string; style: string }> = {
  "serif-italic": { token: "--t-display", fallback: "Georgia, 'Iowan Old Style', serif", style: "italic 600" },
  "serif-bold": { token: "--t-display", fallback: "Georgia, 'Iowan Old Style', serif", style: "700" },
  mono: { token: "--t-mono", fallback: "'IBM Plex Mono', ui-monospace, monospace", style: "500" },
  hand: { token: "--t-hand", fallback: "'Caveat', cursive", style: "500" },
};

const CAPTION_FADE_IN_PCT = 0.12;
const CAPTION_FADE_OUT_PCT = 0.88;

interface PhotoInput {
  file_id: string;
  url: string;
}

export interface ReelRendererProps {
  storyboard: Storyboard;
  photos: PhotoInput[];
  audio: Blob;
  onComplete: (mp4: Blob) => void;
  onError?: (err: Error) => void;
}

interface RendererResources {
  raf: number | null;
  recorder: MediaRecorder | null;
  stream: MediaStream | null;
  audioCtx: AudioContext | null;
  audioEl: HTMLAudioElement | null;
  audioUrl: string | null;
  imageEls: HTMLImageElement[];
  stopped: boolean;
}

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const t of candidates) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return undefined;
}

function resolveFontFamily(token: string, fallback: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(token);
  return v.trim().length > 0 ? `${v.trim()}, ${fallback}` : fallback;
}

function preloadImages(photos: PhotoInput[]): Promise<Map<string, HTMLImageElement>> {
  return Promise.all(
    photos.map(
      (p) =>
        new Promise<[string, HTMLImageElement]>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve([p.file_id, img]);
          img.onerror = () => reject(new Error(`reel: failed to load photo ${p.file_id}`));
          img.src = p.url;
        }),
    ),
  ).then((entries) => new Map(entries));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Ken Burns: x/y are anchor points in [0,1], scale ∈ [1.0, 1.6]. We map the
// image to cover the canvas bbox and translate so the anchor sits at the
// canvas center, scaled by `scale`.
function drawKenBurnsImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  kb: KenBurns,
  t: number,
) {
  const sx = lerp(kb.start.x, kb.end.x, t);
  const sy = lerp(kb.start.y, kb.end.y, t);
  const scale = lerp(kb.start.scale, kb.end.scale, t);

  // Cover-fit base scale.
  const cover = Math.max(CANVAS_WIDTH / img.width, CANVAS_HEIGHT / img.height);
  const drawW = img.width * cover * scale;
  const drawH = img.height * cover * scale;

  // Anchor (sx, sy) ∈ [0,1] picks a point in the source image; we want that
  // point to land at the canvas center.
  const anchorXpx = sx * drawW;
  const anchorYpx = sy * drawH;
  const dx = CANVAS_WIDTH / 2 - anchorXpx;
  const dy = CANVAS_HEIGHT / 2 - anchorYpx;

  ctx.drawImage(img, dx, dy, drawW, drawH);
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  preset: CaptionPreset,
  alpha: number,
) {
  if (alpha <= 0) return;
  const cfg = CAPTION_FONT_TOKEN[preset];
  const family = resolveFontFamily(cfg.token, cfg.fallback);
  const fontSize = 64;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = `${cfg.style} ${fontSize}px ${family}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 16;
  ctx.shadowOffsetY = 2;

  // Word-wrap manually to keep within 90% of canvas width.
  const maxWidth = CANVAS_WIDTH * 0.9;
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);

  const lineHeight = fontSize * 1.2;
  const captionAreaY = CANVAS_HEIGHT * 0.82;
  const totalH = lineHeight * lines.length;
  const startY = captionAreaY - totalH / 2 + lineHeight / 2;
  lines.forEach((l, i) => {
    ctx.fillText(l, CANVAS_WIDTH / 2, startY + i * lineHeight);
  });
  ctx.restore();
}

function clipAlphaForT(elapsed: number, duration: number): number {
  if (duration <= 0) return 0;
  const pct = elapsed / duration;
  if (pct < CAPTION_FADE_IN_PCT) return pct / CAPTION_FADE_IN_PCT;
  if (pct > CAPTION_FADE_OUT_PCT) return Math.max(0, (1 - pct) / (1 - CAPTION_FADE_OUT_PCT));
  return 1;
}

function findActiveClip(clips: readonly Clip[], elapsedMs: number): Clip | undefined {
  // Linear scan — clip count is small (handful per reel).
  for (const c of clips) {
    if (elapsedMs >= c.start_ms && elapsedMs < c.start_ms + c.duration_ms) {
      return c;
    }
  }
  return undefined;
}

export function ReelRenderer({ storyboard, photos, audio, onComplete, onError }: ReelRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const resourcesRef = useRef<RendererResources>({
    raf: null,
    recorder: null,
    stream: null,
    audioCtx: null,
    audioEl: null,
    audioUrl: null,
    imageEls: [],
    stopped: false,
  });
  const [phase, setPhase] = useState<"preparing" | "recording" | "transcoding" | "done" | "error">(
    "preparing",
  );

  useEffect(() => {
    let cancelled = false;
    const res = resourcesRef.current;

    const fail = (err: unknown) => {
      const e = err instanceof Error ? err : new Error(String(err));
      if (!cancelled) setPhase("error");
      onError?.(e);
      teardown();
    };

    const teardown = () => {
      if (res.stopped) return;
      res.stopped = true;
      if (res.raf !== null && typeof cancelAnimationFrame !== "undefined") {
        cancelAnimationFrame(res.raf);
        res.raf = null;
      }
      try {
        res.recorder?.state !== "inactive" && res.recorder?.stop();
      } catch {
        // recorder may already be stopped
      }
      res.stream?.getTracks().forEach((t) => t.stop());
      res.audioEl?.pause();
      if (res.audioUrl) URL.revokeObjectURL(res.audioUrl);
      res.audioCtx?.close().catch(() => {});
      res.imageEls = [];
    };

    (async () => {
      try {
        const imageMap = await preloadImages(photos);
        if (cancelled) return;

        const canvas = canvasRef.current;
        if (!canvas) throw new Error("reel: canvas ref not attached");
        canvas.width = CANVAS_WIDTH;
        canvas.height = CANVAS_HEIGHT;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("reel: 2d context unavailable");

        // Audio plumbing
        const audioUrl = URL.createObjectURL(audio);
        res.audioUrl = audioUrl;
        const audioEl = new Audio();
        audioEl.src = audioUrl;
        audioEl.crossOrigin = "anonymous";
        res.audioEl = audioEl;

        const AudioCtor: typeof AudioContext =
          (window as unknown as { AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
            .AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtor();
        res.audioCtx = audioCtx;
        const sourceNode = audioCtx.createMediaElementSource(audioEl);
        const dest = audioCtx.createMediaStreamDestination();
        sourceNode.connect(dest);

        // Compose the MediaStream: canvas video track + audio destination's track.
        const videoStream = canvas.captureStream(FPS);
        const combined = new MediaStream();
        videoStream.getVideoTracks().forEach((t) => combined.addTrack(t));
        dest.stream.getAudioTracks().forEach((t) => combined.addTrack(t));
        res.stream = combined;

        const mimeType = pickRecorderMimeType();
        const recorder = new MediaRecorder(combined, mimeType ? { mimeType } : undefined);
        res.recorder = recorder;
        const chunks: Blob[] = [];
        recorder.ondataavailable = (ev) => {
          if (ev.data && ev.data.size > 0) chunks.push(ev.data);
        };
        recorder.onerror = (ev) => {
          fail(new Error(`reel: MediaRecorder error: ${(ev as unknown as { error?: { message?: string } }).error?.message ?? "unknown"}`));
        };
        recorder.onstop = () => {
          if (cancelled) return;
          (async () => {
            try {
              setPhase("transcoding");
              const webm = new Blob(chunks, { type: mimeType ?? "video/webm" });
              const mp4 = await transcodeWebmToMp4(webm);
              if (cancelled) return;
              setPhase("done");
              onComplete(mp4);
              teardown();
            } catch (err) {
              fail(err);
            }
          })();
        };

        // Start audio playback + recorder, then drive the canvas via rAF.
        audioEl.addEventListener("ended", () => {
          if (recorder.state !== "inactive") {
            try {
              recorder.stop();
            } catch (err) {
              fail(err);
            }
          }
        });

        const startTs = (typeof performance !== "undefined" ? performance.now() : Date.now());
        const tick = () => {
          if (cancelled || res.stopped) return;
          const now = (typeof performance !== "undefined" ? performance.now() : Date.now());
          const elapsedMs = now - startTs;
          const clip = findActiveClip(storyboard.clips, elapsedMs);

          ctx.fillStyle = "#000";
          ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

          if (clip) {
            const img = imageMap.get(clip.file_id);
            if (img) {
              const tNorm = Math.min(1, Math.max(0, (elapsedMs - clip.start_ms) / clip.duration_ms));
              drawKenBurnsImage(ctx, img, clip.ken_burns, tNorm);
            }
            if (clip.caption) {
              const alpha = clipAlphaForT(elapsedMs - clip.start_ms, clip.duration_ms);
              drawCaption(ctx, clip.caption, storyboard.caption_preset, alpha);
            }
          }

          res.raf = requestAnimationFrame(tick);
        };

        setPhase("recording");
        recorder.start();
        await audioEl.play();
        res.raf = requestAnimationFrame(tick);
      } catch (err) {
        fail(err);
      }
    })();

    return () => {
      cancelled = true;
      teardown();
    };
    // We deliberately depend on the inputs — if any change, we restart the
    // pipeline. Caller should pass stable references.
  }, [storyboard, photos, audio, onComplete, onError]);

  return (
    <div className="reel-renderer" data-phase={phase}>
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        aria-label="Reel preview"
        style={{ width: "100%", height: "auto", display: phase === "preparing" ? "none" : "block" }}
      />
      {phase === "preparing" && (
        <p className="muted" role="status" aria-live="polite">
          preparing reel…
        </p>
      )}
      {phase === "transcoding" && (
        <p className="muted" role="status" aria-live="polite">
          encoding mp4…
        </p>
      )}
    </div>
  );
}
