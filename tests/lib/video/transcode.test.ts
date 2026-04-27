import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// SharedArrayBuffer needs to exist for the init() guard to pass.
// In node it's available; in jsdom it's not — Vitest's "node" env covers us.

class FakeFFmpeg {
  static instances = 0;
  loadCalls = 0;
  writeFile = vi.fn().mockResolvedValue(undefined);
  exec = vi.fn().mockResolvedValue(0);
  readFile = vi.fn().mockResolvedValue(new Uint8Array([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70])); // mp4 magic
  deleteFile = vi.fn().mockResolvedValue(undefined);
  async load() {
    this.loadCalls += 1;
  }
  constructor() {
    FakeFFmpeg.instances += 1;
  }
}

vi.mock("@ffmpeg/ffmpeg", () => ({ FFmpeg: FakeFFmpeg }));
vi.mock("@ffmpeg/util", () => ({
  toBlobURL: vi.fn().mockResolvedValue("blob:fake-url"),
  fetchFile: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])),
}));

import {
  transcodeWebmToMp4,
  __resetTranscodeForTests,
} from "@/lib/video/transcode";

beforeEach(() => {
  FakeFFmpeg.instances = 0;
  __resetTranscodeForTests();
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("transcodeWebmToMp4", () => {
  it("loads ffmpeg.wasm once and reuses the instance across calls", async () => {
    const blob = new Blob([new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])], { type: "video/webm" });
    await transcodeWebmToMp4(blob);
    await transcodeWebmToMp4(blob);
    expect(FakeFFmpeg.instances).toBe(1);
  });

  it("returns an MP4 blob with video/mp4 mime type", async () => {
    const out = await transcodeWebmToMp4(new Blob(["x"], { type: "video/webm" }));
    expect(out).toBeInstanceOf(Blob);
    expect(out.type).toBe("video/mp4");
    expect(out.size).toBeGreaterThan(0);
  });

  it("uses libx264 + aac when hasVideo is true (default)", async () => {
    const blob = new Blob(["x"], { type: "video/webm" });
    await transcodeWebmToMp4(blob);

    const FFmpeg = (await import("@ffmpeg/ffmpeg")).FFmpeg as unknown as typeof FakeFFmpeg;
    // The cached instance is still in module scope, but for assertion we reach
    // for the most recent constructor's exec mock via the prototype trick:
    // we simply rerun once on a fresh module to capture the args.
    __resetTranscodeForTests();
    let captured: string[] = [];
    const Spied = class extends FFmpeg {
      override exec = vi.fn(async (args: string[]) => {
        captured = args;
        return 0;
      });
    };
    vi.doMock("@ffmpeg/ffmpeg", () => ({ FFmpeg: Spied }));
    const { transcodeWebmToMp4: fresh } = await import("@/lib/video/transcode");
    await fresh(blob);
    expect(captured.includes("libx264")).toBe(true);
    expect(captured.includes("aac")).toBe(true);
    vi.doUnmock("@ffmpeg/ffmpeg");
  });

  it("omits libx264 when hasVideo is false (audio-only)", async () => {
    let captured: string[] = [];
    const Spied = class extends FakeFFmpeg {
      override exec = vi.fn(async (args: string[]) => {
        captured = args;
        return 0;
      });
    };
    vi.doMock("@ffmpeg/ffmpeg", () => ({ FFmpeg: Spied }));
    __resetTranscodeForTests();
    const { transcodeWebmToMp4: fresh } = await import("@/lib/video/transcode");
    await fresh(new Blob(["x"], { type: "audio/webm" }), { hasVideo: false });
    expect(captured.includes("libx264")).toBe(false);
    expect(captured.includes("aac")).toBe(true);
    vi.doUnmock("@ffmpeg/ffmpeg");
  });

  it("propagates ffmpeg failure (non-zero exit code)", async () => {
    const Failing = class extends FakeFFmpeg {
      override exec = vi.fn().mockResolvedValue(1);
    };
    vi.doMock("@ffmpeg/ffmpeg", () => ({ FFmpeg: Failing }));
    __resetTranscodeForTests();
    const { transcodeWebmToMp4: fresh } = await import("@/lib/video/transcode");
    await expect(fresh(new Blob(["x"]))).rejects.toThrow(/ffmpeg exited/);
    vi.doUnmock("@ffmpeg/ffmpeg");
  });
});
