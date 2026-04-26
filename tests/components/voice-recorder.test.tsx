import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { VoiceRecorder } from "@/components/VoiceRecorder";

// ─── stubs for Web APIs that happy-dom doesn't ship ──────────────────────────

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported(_mime: string) {
    return true;
  }
  state: "inactive" | "recording" = "inactive";
  ondataavailable: ((e: { data: Blob }) => void) | null = null;
  onstop: (() => void) | null = null;
  mimeType: string;
  constructor(_stream: unknown, opts: { mimeType: string }) {
    this.mimeType = opts.mimeType;
    FakeMediaRecorder.instances.push(this);
  }
  start() {
    this.state = "recording";
  }
  stop() {
    this.state = "inactive";
    this.ondataavailable?.({ data: new Blob([new Uint8Array([0xff, 0xfb])], { type: this.mimeType }) });
    this.onstop?.();
  }
}

class FakeAudioContext {
  state: "running" | "closed" = "running";
  createMediaStreamSource() {
    return { connect: () => {} };
  }
  createAnalyser() {
    return {
      fftSize: 1024,
      getByteTimeDomainData: (buf: Uint8Array) => buf.fill(128),
    };
  }
  close() {
    this.state = "closed";
    return Promise.resolve();
  }
}

function fakeStream() {
  return {
    getTracks: () => [{ stop: () => {} }],
  } as unknown as MediaStream;
}

beforeEach(() => {
  FakeMediaRecorder.instances = [];
  vi.stubGlobal("MediaRecorder", FakeMediaRecorder);
  vi.stubGlobal("AudioContext", FakeAudioContext);
  vi.stubGlobal("requestAnimationFrame", (_cb: FrameRequestCallback) => 1);
  vi.stubGlobal("cancelAnimationFrame", () => {});
  Object.defineProperty(globalThis.navigator, "mediaDevices", {
    configurable: true,
    value: { getUserMedia: vi.fn().mockResolvedValue(fakeStream()) },
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("<VoiceRecorder />", () => {
  it("starts in idle and shows a Record button", () => {
    render(<VoiceRecorder onComplete={() => {}} />);
    expect(screen.getByRole("button", { name: /record/i })).toBeTruthy();
    expect(screen.getByTestId("voice-recorder").getAttribute("data-state")).toBe("idle");
  });

  it("transitions idle → recording → done; calls onComplete with blob + duration", async () => {
    const onComplete = vi.fn();
    render(<VoiceRecorder onComplete={onComplete} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /record/i }));
    });
    expect(screen.getByTestId("voice-recorder").getAttribute("data-state")).toBe("recording");

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    });
    expect(screen.getByTestId("voice-recorder").getAttribute("data-state")).toBe("done");

    expect(onComplete).toHaveBeenCalledOnce();
    const [blob, durationMs] = onComplete.mock.calls[0]!;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(typeof durationMs).toBe("number");
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it("retake clears the blob and returns to idle", async () => {
    render(<VoiceRecorder onComplete={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /record/i }));
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /stop/i }));
    });
    expect(screen.getByTestId("recorder-status")).toBeTruthy();

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /retake/i }));
    });
    expect(screen.getByTestId("voice-recorder").getAttribute("data-state")).toBe("idle");
    expect(screen.queryByTestId("recorder-status")).toBeNull();
  });

  it("permission-denied path shows specific copy and a Try-again button", async () => {
    Object.defineProperty(globalThis.navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockRejectedValue(Object.assign(new Error("nope"), { name: "NotAllowedError" })),
      },
    });

    render(<VoiceRecorder onComplete={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /record/i }));
    });
    expect(screen.getByTestId("voice-recorder").getAttribute("data-state")).toBe("error");
    expect(screen.getByTestId("recorder-error").textContent?.toLowerCase()).toContain("permission denied");
    expect(screen.getByRole("button", { name: /try again/i })).toBeTruthy();
  });

  it("renders an error when the browser supports no audio MIME", async () => {
    class UnsupportedRecorder extends FakeMediaRecorder {
      static override isTypeSupported() {
        return false;
      }
    }
    vi.stubGlobal("MediaRecorder", UnsupportedRecorder);

    render(<VoiceRecorder onComplete={() => {}} />);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /record/i }));
    });
    expect(screen.getByTestId("voice-recorder").getAttribute("data-state")).toBe("error");
  });
});
