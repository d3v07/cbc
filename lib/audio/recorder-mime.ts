// MIME priorities for the in-browser voice recorder.
// Order matters: pick the best Opus-in-WebM container first; Safari only
// supports MP4 / AAC, so fall through to that. Returns null if the browser
// supports none of these — caller surfaces a specific error.
export const RECORDER_MIME_PRIORITY = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
] as const;

export type RecorderMime = (typeof RECORDER_MIME_PRIORITY)[number];

interface IsTypeSupported {
  isTypeSupported(mime: string): boolean;
}

export function pickRecorderMime(
  recorder: IsTypeSupported | undefined = typeof MediaRecorder !== "undefined"
    ? (MediaRecorder as unknown as IsTypeSupported)
    : undefined,
): RecorderMime | null {
  if (!recorder) return null;
  for (const mime of RECORDER_MIME_PRIORITY) {
    if (recorder.isTypeSupported(mime)) return mime;
  }
  return null;
}
