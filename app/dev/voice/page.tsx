"use client";

import { useState } from "react";
import { VoiceRecorder } from "@/components/VoiceRecorder";

interface RecordingState {
  blob: Blob;
  size: number;
  durationMs: number;
  mime: string;
  url: string;
}

interface Transcript {
  lines: Array<{ line: string; start: number; end: number }>;
  duration_ms: number;
}

export default function DevVoicePage() {
  const [last, setLast] = useState<RecordingState | null>(null);
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [status, setStatus] = useState<"idle" | "transcribing" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function transcribe() {
    if (!last) return;
    setStatus("transcribing");
    setErrorMsg(null);
    setTranscript(null);
    try {
      const fd = new FormData();
      fd.set("file", last.blob, "voice.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: fd });
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} — ${detail.slice(0, 200)}`);
      }
      const data = (await res.json()) as Transcript;
      setTranscript(data);
      setStatus("idle");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 4 }}>VoiceRecorder · /dev/voice</h1>
      <p style={{ color: "#666", marginTop: 0, fontSize: 14 }}>
        Dev harness. Grant microphone, record, stop, retake, optionally transcribe.
      </p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 4 }}>
        <VoiceRecorder
          onComplete={(blob, durationMs) => {
            setLast({
              blob,
              size: blob.size,
              durationMs,
              mime: blob.type || "unknown",
              url: URL.createObjectURL(blob),
            });
            setTranscript(null);
            setStatus("idle");
            setErrorMsg(null);
          }}
        />
      </section>

      {last && (
        <section
          style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 4 }}
          data-testid="last-recording"
        >
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Last recording</h2>
          <pre
            style={{
              fontSize: 12,
              background: "#f6f1e8",
              padding: 8,
              borderRadius: 3,
              overflow: "auto",
            }}
          >
            {JSON.stringify(
              { size: last.size, durationMs: last.durationMs, mime: last.mime },
              null,
              2,
            )}
          </pre>
          <audio controls src={last.url} style={{ width: "100%", marginTop: 8 }} />
          <button
            type="button"
            onClick={transcribe}
            disabled={status === "transcribing"}
            style={{ marginTop: 12 }}
          >
            {status === "transcribing" ? "Transcribing…" : "Transcribe (Whisper)"}
          </button>
          {status === "error" && errorMsg && (
            <p style={{ fontSize: 12, color: "#c4533a", marginTop: 8 }}>
              transcribe failed: {errorMsg}
            </p>
          )}
        </section>
      )}

      {transcript && (
        <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 4 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Transcript</h2>
          <p style={{ fontSize: 12, color: "#666", margin: "4px 0 12px" }}>
            duration: {transcript.duration_ms} ms · {transcript.lines.length} segment(s)
          </p>
          <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {transcript.lines.map((l, i) => (
              <li
                key={i}
                style={{
                  borderLeft: "2px solid #c4533a",
                  paddingLeft: 10,
                  marginBottom: 8,
                }}
              >
                <div style={{ fontFamily: "monospace", fontSize: 11, color: "#666" }}>
                  {l.start.toFixed(2)}s → {l.end.toFixed(2)}s
                </div>
                <div style={{ fontSize: 14 }}>{l.line}</div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </main>
  );
}
