import { useEffect, useState } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import Save, { SAVED_SESSIONS_KEY } from "@/components/modals/Save";
import {
  actions,
  AppStoreProvider,
  useAppStore,
  type AppState,
  type ModalKind,
} from "@/lib/store";

function SaveHarness({
  modal,
  state,
}: {
  modal: ModalKind;
  state?: Partial<AppState>;
}) {
  const [, dispatch] = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (state?.draft) dispatch(actions.patchDraft(state.draft));
      if (state?.theme) dispatch(actions.setTheme(state.theme));
      dispatch(actions.setModal(modal));
      setReady(true);
    }, 0);

    return () => window.clearTimeout(id);
  }, [dispatch, modal, state]);

  return ready ? <Save /> : null;
}

const renderSave = (modal: ModalKind, state?: Partial<AppState>) =>
  render(
    <AppStoreProvider>
      <SaveHarness modal={modal} state={state} />
    </AppStoreProvider>,
  );

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe("Save modal", () => {
  it("renders only when state.modal === 'save'", async () => {
    const { container, unmount } = renderSave(null);
    await waitFor(() => expect(container.querySelector('[role="dialog"]')).toBeNull());
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    unmount();

    renderSave("save");
    expect(await screen.findByRole("dialog", { name: /save/i })).toBeTruthy();
  });

  it("disables saving until the title has text", async () => {
    renderSave("save");
    const title = await screen.findByLabelText(/title/i);
    const save = screen.getByRole("button", { name: /save to library/i }) as HTMLButtonElement;

    fireEvent.change(title, { target: { value: "" } });
    expect(save.disabled).toBe(true);

    fireEvent.change(title, { target: { value: "For Tomas" } });
    expect(save.disabled).toBe(false);
  });

  it("persists a canonical session record to localStorage", async () => {
    renderSave("save", {
      draft: {
        recipient: "Tomas",
        occasion: "Saturday",
        form: "letter",
        guide_id: "documentarian",
      },
    });

    fireEvent.change(await screen.findByLabelText(/title/i), { target: { value: "For Tomas" } });
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
