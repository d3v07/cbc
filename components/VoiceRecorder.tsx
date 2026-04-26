"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { pickRecorderMime } from "@/lib/audio/recorder-mime";

type State = "idle" | "recording" | "done" | "error";

export interface VoiceRecorderProps {
  onComplete: (blob: Blob, durationMs: number) => void;
  /** Auto-stop after this many ms. Default: 120_000 (2 min). */
  maxDurationMs?: number;
  className?: string;
}

interface ActiveSession {
  recorder: MediaRecorder;
  stream: MediaStream;
  audioCtx: AudioContext;
  rafId: number;
  startedAt: number;
  chunks: Blob[];
  mime: string;
  autoStop?: ReturnType<typeof setTimeout>;
}

export function VoiceRecorder({
  onComplete,
  maxDurationMs = 120_000,
  className,
}: VoiceRecorderProps) {
  const [state, setState] = useState<State>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [lastDurationMs, setLastDurationMs] = useState<number>(0);

  const sessionRef = useRef<ActiveSession | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const tearDown = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    sessionRef.current = null;
    cancelAnimationFrame(s.rafId);
    if (s.autoStop) clearTimeout(s.autoStop);
    for (const track of s.stream.getTracks()) track.stop();
    if (s.audioCtx.state !== "closed") {
      void s.audioCtx.close();
    }
  }, []);

  // Cleanup if the component unmounts mid-recording.
  useEffect(() => () => tearDown(), [tearDown]);

  const drawWaveform = useCallback((analyser: AnalyserNode) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const buffer = new Uint8Array(analyser.fftSize);

    const render = () => {
      analyser.getByteTimeDomainData(buffer);
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#c4533a"; // terracotta accent from wireframes
      ctx.beginPath();
      const slice = width / buffer.length;
      let x = 0;
      for (let i = 0; i < buffer.length; i++) {
        const v = (buffer[i] ?? 128) / 128;
        const y = (v * height) / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += slice;
      }
      ctx.stroke();

      const session = sessionRef.current;
      if (session) {
        session.rafId = requestAnimationFrame(render);
      }
    };

    const session = sessionRef.current;
    if (session) session.rafId = requestAnimationFrame(render);
  }, []);

  const start = useCallback(async () => {
    setErrorMessage(null);
    if (typeof MediaRecorder === "undefined") {
      setErrorMessage("Recording is not supported in this browser.");
      setState("error");
      return;
    }
    const mime = pickRecorderMime();
    if (!mime) {
      setErrorMessage("This browser cannot record any supported audio format.");
      setState("error");
      return;
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const code = (err as { name?: string })?.name ?? "";
      setErrorMessage(
        code === "NotAllowedError"
          ? "Microphone permission denied. Allow it in your browser to record."
          : `Microphone unavailable (${code || "unknown"}).`,
      );
      setState("error");
      return;
    }

    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    const startedAt = performance.now();

    const session: ActiveSession = {
      recorder,
      stream,
      audioCtx,
      rafId: 0,
      startedAt,
      chunks: [],
      mime,
    };
    sessionRef.current = session;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) session.chunks.push(e.data);
    };
    recorder.onstop = () => {
      const durationMs = Math.round(performance.now() - session.startedAt);
      const blob = new Blob(session.chunks, { type: mime });
      tearDown();
      setLastBlob(blob);
      setLastDurationMs(durationMs);
      setState("done");
      onComplete(blob, durationMs);
    };

    session.autoStop = setTimeout(() => {
      if (sessionRef.current?.recorder.state === "recording") {
        sessionRef.current.recorder.stop();
      }
    }, maxDurationMs);

    recorder.start();
    setState("recording");
    drawWaveform(analyser);
  }, [drawWaveform, maxDurationMs, onComplete, tearDown]);

  const stop = useCallback(() => {
    const s = sessionRef.current;
    if (s && s.recorder.state === "recording") {
      s.recorder.stop();
    }
  }, []);

  const retake = useCallback(() => {
    tearDown();
    setLastBlob(null);
    setLastDurationMs(0);
    setErrorMessage(null);
    setState("idle");
  }, [tearDown]);

  return (
    <div className={className} data-state={state} data-testid="voice-recorder">
      <canvas
        ref={canvasRef}
        width={480}
        height={64}
        style={{ display: "block", width: "100%", height: 64, background: "#fbf7ef" }}
        aria-hidden
      />
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {state === "idle" && (
          <button type="button" onClick={start}>
            Record
          </button>
        )}
        {state === "recording" && (
          <button type="button" onClick={stop}>
            Stop
          </button>
        )}
        {state === "done" && (
          <button type="button" onClick={retake}>
            Retake
          </button>
        )}
        {state === "error" && (
          <button type="button" onClick={retake}>
            Try again
          </button>
        )}
      </div>
      {state === "done" && lastBlob && (
        <p data-testid="recorder-status" style={{ fontSize: 12, marginTop: 8 }}>
          {lastBlob.size} bytes · {lastDurationMs} ms · {lastBlob.type || "unknown"}
        </p>
      )}
      {state === "error" && errorMessage && (
        <p data-testid="recorder-error" style={{ fontSize: 12, marginTop: 8, color: "#c4533a" }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
