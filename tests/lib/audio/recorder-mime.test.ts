import { describe, expect, it } from "vitest";
import { pickRecorderMime, RECORDER_MIME_PRIORITY } from "@/lib/audio/recorder-mime";

function stub(supported: ReadonlyArray<string>) {
  const set = new Set(supported);
  return { isTypeSupported: (m: string) => set.has(m) };
}

describe("pickRecorderMime", () => {
  it("picks audio/webm;codecs=opus when everything is supported", () => {
    const r = stub(RECORDER_MIME_PRIORITY);
    expect(pickRecorderMime(r)).toBe("audio/webm;codecs=opus");
  });

  it("falls through to audio/webm when opus is unsupported", () => {
    const r = stub(["audio/webm", "audio/mp4"]);
    expect(pickRecorderMime(r)).toBe("audio/webm");
  });

  it("uses Safari's audio/mp4;codecs=mp4a.40.2 when WebM is unavailable", () => {
    const r = stub(["audio/mp4;codecs=mp4a.40.2", "audio/mp4"]);
    expect(pickRecorderMime(r)).toBe("audio/mp4;codecs=mp4a.40.2");
  });

  it("falls through to bare audio/mp4 if AAC variant unsupported", () => {
    const r = stub(["audio/mp4"]);
    expect(pickRecorderMime(r)).toBe("audio/mp4");
  });

  it("returns null when the browser supports none of the candidates", () => {
    const r = stub([]);
    expect(pickRecorderMime(r)).toBeNull();
  });

  it("returns null when MediaRecorder itself is unavailable", () => {
    expect(pickRecorderMime(undefined)).toBeNull();
  });
});
