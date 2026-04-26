import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import Save, { SAVED_SESSIONS_KEY } from "@/components/modals/Save";
import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/lib/store";

const STORAGE_KEY = "mean_it_app_state_v1";

const seedState = (overrides: Partial<AppState> = {}): void => {
  const state: AppState = { ...INITIAL_STATE, ...overrides };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const renderSave = () =>
  render(
    <AppStoreProvider>
      <Save />
    </AppStoreProvider>,
  );

afterEach(() => {
  cleanup();
});

describe("Save modal", () => {
  it("renders only when state.modal === 'save'", () => {
    seedState({ modal: null });
    const { container, unmount } = renderSave();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    unmount();

    seedState({ modal: "save" });
    renderSave();
    expect(screen.getByRole("dialog", { name: /save/i })).toBeTruthy();
  });

  it("disables saving until the title has text", () => {
    seedState({ modal: "save" });
    renderSave();
    const title = screen.getByLabelText(/title/i);
    const save = screen.getByRole("button", { name: /save to library/i }) as HTMLButtonElement;

    fireEvent.change(title, { target: { value: "" } });
    expect(save.disabled).toBe(true);

    fireEvent.change(title, { target: { value: "For Tomas" } });
    expect(save.disabled).toBe(false);
  });

  it("persists a canonical session record to localStorage", () => {
    seedState({
      modal: "save",
      draft: {
        recipient: "Tomas",
        occasion: "Saturday",
        form: "letter",
        guide_id: "documentarian",
      },
    });
    renderSave();

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: "For Tomas" } });
    fireEvent.click(screen.getByRole("radio", { name: /unlisted/i }));
    fireEvent.click(screen.getByRole("button", { name: /save to library/i }));

    const saved = JSON.parse(window.localStorage.getItem(SAVED_SESSIONS_KEY) ?? "[]");
    expect(saved).toHaveLength(1);
    expect(saved[0].title).toBe("For Tomas");
    expect(saved[0].privacy).toBe("unlisted");
    expect(saved[0].session.recipient).toBe("Tomas");
    expect(saved[0].session.guide_id).toBe("documentarian");
    expect(screen.getByText(/share-back link/i)).toBeTruthy();
  });
});
