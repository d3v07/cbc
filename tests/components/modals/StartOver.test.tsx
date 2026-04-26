import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { AppState } from "@/lib/store";

// Mock the store so we can drive `state.modal` and observe dispatched actions.
const dispatch = vi.fn();
let currentState: AppState;

vi.mock("@/lib/store", async () => {
  const actual = await vi.importActual<typeof import("@/lib/store")>("@/lib/store");
  return {
    ...actual,
    useAppStore: () => [currentState, dispatch] as const,
  };
});

import StartOver from "@/components/modals/StartOver";
import { INITIAL_STATE, actions } from "@/lib/store";

const openState: AppState = { ...INITIAL_STATE, modal: "startover" };
const closedState: AppState = { ...INITIAL_STATE, modal: null };

afterEach(() => {
  cleanup();
  dispatch.mockReset();
});

describe("StartOver modal", () => {
  it("renders only when state.modal === 'startover'", () => {
    currentState = closedState;
    const { container, rerender } = render(<StartOver />);
    expect(container.querySelector('[role="dialog"]')).toBeNull();

    currentState = openState;
    rerender(<StartOver />);
    expect(screen.getByRole("dialog", { name: /start over\?/i })).toBeTruthy();
    expect(screen.getByText(/draft and provenance trace will be lost/i)).toBeTruthy();
  });

  it("dispatches actions.reset() when confirm button clicked", () => {
    currentState = openState;
    render(<StartOver />);
    fireEvent.click(screen.getByRole("button", { name: /^start over$/i }));
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(actions.reset());
  });

  it("dispatches setModal(null) when cancel button clicked", () => {
    currentState = openState;
    render(<StartOver />);
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(actions.setModal(null));
  });

  it("dispatches setModal(null) on Escape key", () => {
    currentState = openState;
    render(<StartOver />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(actions.setModal(null));
  });

  it("dispatches setModal(null) on overlay click", () => {
    currentState = openState;
    render(<StartOver />);
    const overlay = screen.getByRole("dialog");
    fireEvent.click(overlay);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(actions.setModal(null));
  });
});
