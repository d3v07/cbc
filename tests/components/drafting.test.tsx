import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Drafting } from "@/components/screens/Drafting";
import { Render } from "@/components/screens/Render";
import { actions, AppStoreProvider, useAppStore, type AppState } from "@/lib/store";

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn();

function Screens() {
  const [state] = useAppStore();
  return state.step === "render" ? <Render /> : <Drafting />;
}

function DraftingHarness({ state }: { state: Partial<AppState> }) {
  const [, dispatch] = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (state.draft) dispatch(actions.patchDraft(state.draft));
      if (state.artifact_text !== undefined) {
        dispatch(actions.setArtifactText(state.artifact_text));
      }
      for (const turn of state.turns ?? []) {
        dispatch(actions.appendTurn(turn));
      }
      dispatch(actions.setStep("drafting"));
      setReady(true);
    }, 0);

    return () => window.clearTimeout(id);
  }, [dispatch, state]);

  return ready ? <Screens /> : null;
}

function renderDrafting(state: Partial<AppState>) {
  render(
    <AppStoreProvider>
      <DraftingHarness state={state} />
    </AppStoreProvider>,
  );
}

beforeEach(() => {
  window.localStorage.clear();
  fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/provenance")) {
      return new Response(
        JSON.stringify({
          provenance: [
            {
              line: "short phrase plus my words",
              source_turn_id: "u1",
              source_text: "short phrase plus my words",
              match: "exact",
            },
          ],
          byline_pct: 100,
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ cards: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  });
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("Drafting", () => {
  it("loads short spine text, allows editing, and renders", async () => {
    renderDrafting({
      draft: {
        recipient: "Tomas",
        occasion: "birthday",
        form: "letter",
        guide_id: "documentarian",
      },
      artifact_text: "short phrase",
      turns: [
        {
          id: "u1",
          session_id: "session-1",
          role: "user",
          text: "short phrase plus my words",
          ts: 1,
        },
      ],
    });

    const editor = await screen.findByPlaceholderText(
      /start with one of your phrases/i,
    );
    await waitFor(() => {
      expect((editor as HTMLTextAreaElement).value).toBe("short phrase");
    });

    fireEvent.change(editor, {
      target: { value: "short phrase plus my words" },
    });
    const renderButton = screen.getByRole("button", {
      name: /render the artifact/i,
    }) as HTMLButtonElement;

    expect(renderButton.disabled).toBe(false);
    fireEvent.click(renderButton);

    expect(await screen.findByText(/your artifact/i)).toBeTruthy();
  });
});
