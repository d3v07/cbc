import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { App } from "@/components/App";
import { INITIAL_STATE, type AppState } from "@/lib/store";

const STORAGE_KEY = "mean_it_app_state_v1";

const seedState = (overrides: Partial<AppState> = {}): void => {
  const state: AppState = { ...INITIAL_STATE, ...overrides };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

afterEach(() => {
  cleanup();
});

describe("App issue-27 flow", () => {
  it("advances from the rendered artifact into ReelViewer", () => {
    seedState({ step: "render" });
    render(<App guides={[]} />);
    fireEvent.click(screen.getByRole("button", { name: /make it move/i }));
    expect(screen.getByRole("heading", { name: /a reel for tomas/i })).toBeTruthy();
  });

  it("wires the artifact actions into the App modal switch", () => {
    seedState({ step: "render" });
    render(<App guides={[]} />);

    fireEvent.click(screen.getByRole("button", { name: /download/i }));
    expect(screen.getByRole("dialog", { name: /download/i })).toBeTruthy();
    expect(screen.getByTestId("fmt-poster")).toBeTruthy();
    expect(screen.queryByTestId("fmt-mp4")).toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    expect(screen.getByRole("dialog", { name: /^save$/i })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /share trace/i }));
    expect(screen.getByRole("dialog", { name: /share the trace/i })).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /start over/i }));
    expect(screen.getByRole("dialog", { name: /start over\?/i })).toBeTruthy();
  });
});
