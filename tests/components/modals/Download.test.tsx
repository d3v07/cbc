import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Download } from "@/components/modals/Download";
import { INITIAL_STATE, type AppState } from "@/lib/store";

// Source-of-truth key from `lib/store.ts`. Not exported there; mirrored here
// so the persisted blob is picked up by `useAppStore`'s loadInitial.
const STORAGE_KEY = "mean_it_app_state_v1";

// happy-dom 20 ships an empty `window.localStorage` placeholder without the
// Storage prototype methods. Replace it with a Map-backed shim so the
// reducer's persist path (and our seed) can round-trip JSON.
const memStore = new Map<string, string>();
Object.defineProperty(window, "localStorage", {
  configurable: true,
  value: {
    getItem: (key: string): string | null => memStore.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      memStore.set(key, value);
    },
    removeItem: (key: string): void => {
      memStore.delete(key);
    },
    clear: (): void => memStore.clear(),
    key: (i: number): string | null => Array.from(memStore.keys())[i] ?? null,
    get length(): number {
      return memStore.size;
    },
  },
});

const seedState = (overrides: Partial<AppState> = {}): void => {
  const state: AppState = { ...INITIAL_STATE, ...overrides };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

beforeEach(() => {
  memStore.clear();
});

afterEach(() => {
  cleanup();
  memStore.clear();
});

describe("Download modal", () => {
  it("renders nothing when state.modal is not 'download'", () => {
    seedState({ modal: null });
    render(<Download />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("renders the dialog when state.modal === 'download'", () => {
    seedState({ modal: "download" });
    render(<Download availableFormats={{ mp4: true }} />);
    expect(screen.queryByRole("dialog")).not.toBeNull();
  });

  it("hides MP4 button when availableFormats.mp4 !== true", () => {
    seedState({ modal: "download" });
    render(<Download availableFormats={{ webm: true }} />);
    expect(screen.queryByTestId("fmt-mp4")).toBeNull();
    expect(screen.queryByTestId("fmt-webm")).not.toBeNull();
  });

  it("download button is disabled until a format is picked", () => {
    seedState({ modal: "download" });
    render(<Download availableFormats={{ mp4: true, webm: true }} />);
    const btn = screen.getByRole("button", { name: /^download$/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    const mp4Radio = screen
      .getByTestId("fmt-mp4")
      .querySelector('input[type="radio"]') as HTMLInputElement;
    fireEvent.click(mp4Radio);
    expect(btn.disabled).toBe(false);
  });

  it("flips include-captions and include-byline toggles", () => {
    seedState({ modal: "download" });
    render(<Download availableFormats={{ mp4: true }} />);
    const captions = screen.getByLabelText(/include captions/i) as HTMLInputElement;
    const byline = screen.getByLabelText(/include byline/i) as HTMLInputElement;
    expect(captions.checked).toBe(false);
    expect(byline.checked).toBe(false);
    fireEvent.click(captions);
    fireEvent.click(byline);
    expect(captions.checked).toBe(true);
    expect(byline.checked).toBe(true);
  });

  it("cancel button closes the modal", () => {
    seedState({ modal: "download" });
    render(<Download availableFormats={{ mp4: true }} />);
    expect(screen.queryByRole("dialog")).not.toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape key closes the modal", () => {
    seedState({ modal: "download" });
    render(<Download availableFormats={{ mp4: true }} />);
    expect(screen.queryByRole("dialog")).not.toBeNull();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("overlay click closes the modal", () => {
    seedState({ modal: "download" });
    render(<Download availableFormats={{ mp4: true }} />);
    const dialog = screen.getByRole("dialog");
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
