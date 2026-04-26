// Client-only ffmpeg.wasm wrapper. Lazy-loads the ~14MB wasm core on first
// use so the rest of the app isn't penalized. Requires cross-origin
// isolation (COOP/COEP headers) — scoped to /dev/* in next.config.mjs.

import type { FFmpeg } from "@ffmpeg/ffmpeg";

const FFMPEG_CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

let cached: FFmpeg | null = null;

async function init(): Promise<FFmpeg> {
  if (cached) return cached;
  if (typeof window === "undefined") {
    throw new Error("transcode: ffmpeg.wasm requires a browser environment");
  }
  if (typeof SharedArrayBuffer === "undefined") {
    throw new Error(
      "transcode: SharedArrayBuffer unavailable. Ensure COOP/COEP headers are set on this route.",
    );
  }
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");
  const ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${FFMPEG_CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
  });
  cached = ffmpeg;
  return ffmpeg;
}

export interface TranscodeOptions {
  /** Default true: input has a video stream. Pass false for audio-only WebM. */
  hasVideo?: boolean;
}

export async function transcodeWebmToMp4(
  webm: Blob,
  opts: TranscodeOptions = {},
): Promise<Blob> {
  const hasVideo = opts.hasVideo ?? true;
  const ffmpeg = await init();
  const { fetchFile } = await import("@ffmpeg/util");

  const inputName = "input.webm";
  const outputName = "output.mp4";

  try {
    await ffmpeg.writeFile(inputName, await fetchFile(webm));

    const cmd: string[] = ["-i", inputName];
    if (hasVideo) cmd.push("-c:v", "libx264", "-preset", "ultrafast");
    cmd.push("-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", outputName);

    const code = await ffmpeg.exec(cmd);
    if (code !== 0) {
      throw new Error(`transcode: ffmpeg exited with code ${code}`);
    }

    const data = await ffmpeg.readFile(outputName);
    if (typeof data === "string") {
      throw new Error("transcode: unexpected string output from ffmpeg");
    }
    // Copy into an ArrayBuffer-backed view; the SDK's Uint8Array can be
    // SharedArrayBuffer-backed which TypeScript rejects as a BlobPart.
    const copy = new Uint8Array(data);
    return new Blob([copy.buffer], { type: "video/mp4" });
  } finally {
    // Best-effort cleanup; deleteFile may throw if the file was never written.
    await ffmpeg.deleteFile(inputName).catch(() => {});
    await ffmpeg.deleteFile(outputName).catch(() => {});
  }
}

/** Exposed for tests — resets the cached FFmpeg instance. */
export function __resetTranscodeForTests() {
  cached = null;
}
