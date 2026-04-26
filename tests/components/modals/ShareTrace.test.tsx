import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import ShareTrace from "@/components/modals/ShareTrace";
import { actions } from "@/lib/store";

// Mock the store so we control `state.modal` and observe dispatch calls.
const dispatch = vi.fn();
let modalValue: string | null = "share";

vi.mock("@/lib/store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/store")>("@/lib/store");
  return {
    ...actual,
    useAppStore: () => [
      {
        step: "render",
        theme: "quiet",
        emotion: "listening",
        modal: modalValue,
        draft: { recipient: "", occasion: "", form: null, guide_id: null },
      },
      dispatch,
    ],
  };
});

beforeEach(() => {
  dispatch.mockClear();
  modalValue = "share";
});

afterEach(() => {
  cleanup();
});

describe("ShareTrace", () => {
  it("renders nothing when state.modal !== 'share'", () => {
    modalValue = null;
    const { container } = render(<ShareTrace />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the dialog when state.modal === 'share'", () => {
    render(<ShareTrace />);
    expect(screen.getByRole("dialog")).toBeTruthy();
  });

  it("defaults to verified-only mode and shows its URL", () => {
    render(<ShareTrace />);
    const code = screen.getByText("https://meanit.app/?trace=stub-verified");
    expect(code).toBeTruthy();
  });

  it("updates the CopyLine URL when switching modes", () => {
    render(<ShareTrace />);
    fireEvent.click(screen.getByLabelText(/partial/i));
    expect(screen.getByText("https://meanit.app/?trace=stub-partial")).toBeTruthy();
    fireEvent.click(screen.getByLabelText(/full/i));
    expect(screen.getByText("https://meanit.app/?trace=stub-full")).toBeTruthy();
  });

  it("shows the helper copy for each audience", () => {
    render(<ShareTrace />);
    expect(screen.getByText("only the lines marked verified")).toBeTruthy();
    expect(screen.getByText("your draft and provenance, no interview turns")).toBeTruthy();
    expect(screen.getByText("everything")).toBeTruthy();
  });

  it("dismisses on cancel button click", () => {
    render(<ShareTrace />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(dispatch).toHaveBeenCalledWith(actions.setModal(null));
  });

  it("dismisses on Escape key", () => {
    render(<ShareTrace />);
    act(() => {
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    });
    expect(dispatch).toHaveBeenCalledWith(actions.setModal(null));
  });

  it("dismisses on overlay click", () => {
    render(<ShareTrace />);
    const overlay = screen.getByRole("dialog");
    fireEvent.click(overlay);
    expect(dispatch).toHaveBeenCalledWith(actions.setModal(null));
  });

  it("exposes an accessible Copy button on CopyLine", () => {
    render(<ShareTrace />);
    const copyButtons = screen.getAllByRole("button", { name: /copy/i });
    expect(copyButtons.length).toBeGreaterThan(0);
  });
});
