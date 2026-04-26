"use client";

import { useState } from "react";
import { transcodeWebmToMp4 } from "@/lib/video/transcode";

interface Result {
  inputBytes: number;
  outputBytes: number;
  ms: number;
  url: string;
}

export default function DevTranscodePage() {
  const [file, setFile] = useState<File | null>(null);
  const [hasVideo, setHasVideo] = useState(true);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function run() {
    if (!file) return;
    setStatus("running");
    setErrorMsg(null);
    setResult(null);
    const t0 = performance.now();
    try {
      const mp4 = await transcodeWebmToMp4(file, { hasVideo });
      const ms = Math.round(performance.now() - t0);
      setResult({
        inputBytes: file.size,
        outputBytes: mp4.size,
        ms,
        url: URL.createObjectURL(mp4),
      });
      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1 style={{ marginBottom: 4 }}>Transcode · /dev/transcode</h1>
      <p style={{ color: "#666", marginTop: 0, fontSize: 14 }}>
        ffmpeg.wasm WebM → MP4. Drop a .webm (record one at <a href="/dev/voice">/dev/voice</a>{" "}
        first, or pick any video). First run downloads ~14MB of wasm core.
      </p>

      <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 4 }}>
        <input
          type="file"
          accept="video/webm,audio/webm,.webm"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            setFile(f);
            setResult(null);
            setStatus("idle");
            setErrorMsg(null);
          }}
        />
        <label style={{ display: "block", marginTop: 12, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={hasVideo}
            onChange={(e) => setHasVideo(e.target.checked)}
            style={{ marginRight: 6 }}
          />
          Input has video stream (uncheck for audio-only WebM from VoiceRecorder)
        </label>
        <button
          type="button"
          onClick={run}
          disabled={!file || status === "running"}
          style={{ marginTop: 12 }}
        >
          {status === "running" ? "Transcoding…" : "Transcode to MP4"}
        </button>
        {status === "error" && errorMsg && (
          <p style={{ fontSize: 12, color: "#c4533a", marginTop: 8 }}>
            failed: {errorMsg}
          </p>
        )}
      </section>

      {result && (
        <section style={{ marginTop: 24, padding: 16, border: "1px solid #ddd", borderRadius: 4 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>Result</h2>
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
              {
                input_bytes: result.inputBytes,
                output_bytes: result.outputBytes,
                duration_ms: result.ms,
                ratio: (result.outputBytes / result.inputBytes).toFixed(2),
              },
              null,
              2,
            )}
          </pre>
          <video controls src={result.url} style={{ width: "100%", marginTop: 8 }} />
          <a
            href={result.url}
            download={file?.name?.replace(/\.webm$/i, ".mp4") || "out.mp4"}
            style={{ display: "inline-block", marginTop: 12 }}
          >
            Download MP4
          </a>
        </section>
      )}
    </main>
  );
}
