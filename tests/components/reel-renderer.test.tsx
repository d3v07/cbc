import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import type { Storyboard } from "@/lib/types/media";

// ── Stubs captured for assertions ───────────────────────────────────────
const stopTrackSpy = vi.fn();
const closeAudioCtxSpy = vi.fn().mockResolvedValue(undefined);
const recorderInstances: FakeMediaRecorder[] = [];

// ── transcode mock — returns a fake MP4 blob ────────────────────────────
const fakeMp4 = new Blob([new Uint8Array([0, 0, 0, 1])], { type: "video/mp4" });
const transcodeMock = vi.fn().mockResolvedValue(fakeMp4);
vi.mock("@/lib/video/transcode", () => ({
  transcodeWebmToMp4: (...args: unknown[]) => transcodeMock(...args),
}));

// ── DOM/Browser API stubs ───────────────────────────────────────────────
class FakeTrack {
  kind: string;
  stop = stopTrackSpy;
  constructor(kind: string) {
    this.kind = kind;
  }
}

class FakeMediaStream {
  private tracks: FakeTrack[] = [];
  constructor() {}
  addTrack(t: FakeTrack) {
    this.tracks.push(t);
  }
  getTracks(): FakeTrack[] {
    return this.tracks;
  }
  getVideoTracks(): FakeTrack[] {
    return this.tracks.filter((t) => t.kind === "video");
  }
  getAudioTracks(): FakeTrack[] {
    return this.tracks.filter((t) => t.kind === "audio");
  }
}

class FakeMediaRecorder {
  static isTypeSupported(_t: string): boolean {
    return true;
  }
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((ev: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((ev: unknown) => void) | null = null;
  mimeType: string;
  constructor(_stream: unknown, opts?: { mimeType?: string }) {
    this.mimeType = opts?.mimeType ?? "video/webm";
    recorderInstances.push(this);
  }
  start() {
    this.state = "recording";
    // Emit a chunk so the assembled webm blob is non-empty.
    queueMicrotask(() => {
      this.ondataavailable?.({ data: new Blob([new Uint8Array([1, 2, 3])], { type: this.mimeType }) });
    });
  }
  stop() {
    if (this.state === "inactive") return;
    this.state = "inactive";
    queueMicrotask(() => this.onstop?.());
  }
}

class FakeAudioNode {
  connect(_n: unknown) {}
}

class FakeAudioContext {
  close = closeAudioCtxSpy;
  createMediaElementSource(_el: unknown) {
    return new FakeAudioNode();
  }
  createMediaStreamDestination() {
    const stream = new FakeMediaStream();
    stream.addTrack(new FakeTrack("audio"));
    return { stream };
  }
}

// Image stub that fires onload synchronously when src is assigned.
class FakeImage {
  width = 1080;
  height = 1920;
  crossOrigin = "";
  onload: (() => void) | null = null;
  onerror: ((err: unknown) => void) | null = null;
  private _src = "";
  set src(v: string) {
    this._src = v;
    queueMicrotask(() => this.onload?.());
  }
  get src() {
    return this._src;
  }
}

// Canvas captureStream — returns a stream with one video track.
function installCanvasCaptureStream() {
  Object.defineProperty(HTMLCanvasElement.prototype, "captureStream", {
    configurable: true,
    writable: true,
    value: function captureStream() {
      const s = new FakeMediaStream();
      s.addTrack(new FakeTrack("video"));
      return s;
    },
  });
  // happy-dom may not give us a 2D context; stub it.
  const fakeCtx = {
    fillStyle: "",
    font: "",
    textAlign: "",
    textBaseline: "",
    globalAlpha: 1,
    shadowColor: "",
    shadowBlur: 0,
    shadowOffsetY: 0,
    fillRect: vi.fn(),
    drawImage: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    measureText: vi.fn(() => ({ width: 100 })),
  };
  Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
    configurable: true,
    writable: true,
    value: function getContext() {
      return fakeCtx as unknown as CanvasRenderingContext2D;
    },
  });
}

// Audio element stub — exposes a play() that resolves and an `ended` dispatch.
class FakeHTMLAudioElement extends EventTarget {
  src = "";
  crossOrigin = "";
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  // Test helper: trigger the ended event.
  fireEnded() {
    this.dispatchEvent(new Event("ended"));
  }
}

let lastAudioEl: FakeHTMLAudioElement | null = null;

beforeEach(() => {
  stopTrackSpy.mockClear();
  closeAudioCtxSpy.mockClear();
  transcodeMock.mockClear();
  recorderInstances.length = 0;
  lastAudioEl = null;

  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  vi.stubGlobal("MediaStream", FakeMediaStream);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("Image", FakeImage);
  vi.stubGlobal("Audio", function AudioCtor(this: FakeHTMLAudioElement) {
    const el = new FakeHTMLAudioElement();
    lastAudioEl = el;
    return el;
  } as unknown as typeof Audio);
  vi.stubGlobal("URL", {
    ...URL,
    createObjectURL: vi.fn().mockReturnValue("blob:fake-audio"),
    revokeObjectURL: vi.fn(),
  });
  // rAF — invoke immediately to drive the loop a few frames, then stop.
  let rafCount = 0;
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    rafCount += 1;
    if (rafCount < 3) queueMicrotask(() => cb(performance.now()));
    return rafCount;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {});

  installCanvasCaptureStream();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const STORYBOARD: Storyboard = {
  theme: "warm",
  total_duration_ms: 3000,
  caption_preset: "serif-italic",
  clips: [
    {
      file_id: "p1",
      start_ms: 0,
      duration_ms: 3000,
      caption: "a quiet evening",
      ken_burns: {
        start: { x: 0.5, y: 0.5, scale: 1.0 },
        end: { x: 0.5, y: 0.5, scale: 1.2 },
      },
    },
  ],
};

const PHOTOS = [{ file_id: "p1", url: "blob:photo-1" }];
const AUDIO = new Blob([new Uint8Array([9, 9, 9])], { type: "audio/webm" });

describe("ReelRenderer", () => {
  it("renders a 'preparing' status before photos load", async () => {
    // Hold image onload until we look at the screen.
    const HoldingImage = class extends FakeImage {
      override set src(v: string) {
        // never fires onload during this test
        Object.getOwnPropertyDescriptor(FakeImage.prototype, "src")?.set?.call(this, v);
      }
    };
    vi.stubGlobal("Image", HoldingImage);
    const { ReelRenderer } = await import("@/components/ReelRenderer");
    render(
      <ReelRenderer
        storyboard={STORYBOARD}
        photos={PHOTOS}
        audio={AUDIO}
        onComplete={vi.fn()}
      />,
    );
    expect(screen.getByRole("status").textContent ?? "").toMatch(/preparing/i);
  });

  it("calls onComplete with an MP4 Blob after recorder stops and transcode resolves", async () => {
    const onComplete = vi.fn();
    const { ReelRenderer } = await import("@/components/ReelRenderer");
    render(
      <ReelRenderer
        storyboard={STORYBOARD}
        photos={PHOTOS}
        audio={AUDIO}
        onComplete={onComplete}
      />,
    );

    // Wait for setup to wire up recorder + audio element.
    await waitFor(() => {
      expect(recorderInstances.length).toBe(1);
      expect(lastAudioEl).not.toBeNull();
    });

    // Drive the audio "ended" event so the recorder stops, which triggers
    // onstop → transcode → onComplete.
    await act(async () => {
      lastAudioEl?.fireEnded();
    });

    await waitFor(() => {
      expect(transcodeMock).toHaveBeenCalledTimes(1);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
    const arg = onComplete.mock.calls[0]?.[0] as Blob;
    expect(arg).toBeInstanceOf(Blob);
    expect(arg.type).toBe("video/mp4");
  });

  it("cleans up tracks and AudioContext on unmount", async () => {
    const { ReelRenderer } = await import("@/components/ReelRenderer");
    const { unmount } = render(
      <ReelRenderer
        storyboard={STORYBOARD}
        photos={PHOTOS}
        audio={AUDIO}
        onComplete={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(recorderInstances.length).toBe(1);
    });

    unmount();

    await waitFor(() => {
      expect(stopTrackSpy).toHaveBeenCalled();
      expect(closeAudioCtxSpy).toHaveBeenCalled();
    });
  });
});
