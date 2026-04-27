import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/lib/store";

const mockRenderer = vi.hoisted(() => ({
  blob: undefined as Blob | undefined,
  error: null as Error | null,
}));

vi.mock("@/components/ReelRenderer", () => ({
  ReelRenderer: ({
    onComplete,
    onError,
  }: {
    onComplete: (blob: Blob) => void;
    onError?: (err: Error) => void;
  }) => (
    <div>
      <div role="status">renderer mounted</div>
      <button type="button" onClick={() => onComplete(mockRenderer.blob ?? new Blob(["mp4"], { type: "video/mp4" }))}>
        finish renderer
      </button>
      <button type="button" onClick={() => onError?.(mockRenderer.error ?? new Error("vendor unavailable"))}>
        fail renderer
      </button>
    </div>
  ),
}));

import { ReelViewer } from "@/components/screens/ReelViewer";

const STORAGE_KEY = "mean_it_app_state_v1";

const seedState = (overrides: Partial<AppState> = {}): void => {
  const state: AppState = { ...INITIAL_STATE, step: "reel", ...overrides };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const renderViewer = (props: ComponentProps<typeof ReelViewer> = {}) =>
  render(
    <AppStoreProvider>
      <ReelViewer {...props} />
    </AppStoreProvider>,
  );

beforeEach(() => {
  mockRenderer.blob = new Blob(["mp4"], { type: "video/mp4" });
  mockRenderer.error = null;
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: vi.fn(() => "blob:mean-it-reel"),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    value: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ReelViewer", () => {
  it("renders the storyboard preview", () => {
    seedState();
    renderViewer();
    expect(screen.getByRole("heading", { name: /a reel for tomas/i })).toBeTruthy();
    expect(screen.getAllByText(/storyboard/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Tomas kept a notebook/i).length).toBeGreaterThan(0);
  });

  it("shows specific copy for a voice clip shorter than five seconds", () => {
    seedState();
    renderViewer({ audioDurationSec: 3 });
    fireEvent.click(screen.getByRole("button", { name: /render reel/i }));
    expect(screen.getByRole("alert").textContent ?? "").toMatch(/shorter than 5s/i);
  });

  it("surfaces renderer failures", () => {
    seedState();
    mockRenderer.error = new Error("vendor unavailable");
    renderViewer();
    fireEvent.click(screen.getByRole("button", { name: /render reel/i }));
    fireEvent.click(screen.getByRole("button", { name: /fail renderer/i }));
    expect(screen.getByRole("alert").textContent ?? "").toMatch(/vendor unavailable/i);
  });

  it("offers an MP4 download when rendering completes", () => {
    seedState();
    const onMp4Ready = vi.fn();
    renderViewer({ onMp4Ready });
    fireEvent.click(screen.getByRole("button", { name: /render reel/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish renderer/i }));

    const link = screen.getByRole("link", { name: /download mp4/i }) as HTMLAnchorElement;
    expect(link.href).toBe("blob:mean-it-reel");
    expect(link.download).toBe("mean-it-reel.mp4");
    expect(onMp4Ready).toHaveBeenCalledWith({
      url: "blob:mean-it-reel",
      filename: "mean-it-reel.mp4",
    });
  });

  it("rejects renderer output with an unexpected MIME type", () => {
    seedState();
    mockRenderer.blob = new Blob(["webm"], { type: "video/webm" });
    renderViewer();
    fireEvent.click(screen.getByRole("button", { name: /render reel/i }));
    fireEvent.click(screen.getByRole("button", { name: /finish renderer/i }));
    expect(screen.getByRole("alert").textContent ?? "").toMatch(/cannot download/i);
  });
});
