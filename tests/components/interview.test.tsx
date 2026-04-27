import { useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Interview } from "@/components/screens/Interview";
import {
  actions,
  AppStoreProvider,
  STORAGE_KEY,
  useAppStore,
  type AppState,
} from "@/lib/store";
import type { Turn } from "@/lib/types/session";

const originalFetch = globalThis.fetch;
const fetchMock = vi.fn();

function guideTurn(index: number): Turn {
  return {
    id: `g-${index}`,
    session_id: "session-1",
    role: "guide",
    text: `Question ${index}?`,
    ts: index,
  };
}

function userTurn(index: number, phrases_held: string[] = []): Turn {
  return {
    id: `u-${index}`,
    session_id: "session-1",
    role: "user",
    text: `Answer ${index}.`,
    ts: index,
    phrases_held,
  };
}

function interviewState(turns: Turn[]): Partial<AppState> {
  return {
    draft: {
      recipient: "Tomas",
      occasion: "birthday",
      form: "letter",
      guide_id: "documentarian",
    },
    session_id: "session-1",
    turns,
  };
}

function InterviewHarness({ state }: { state: Partial<AppState> }) {
  const [, dispatch] = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (state.draft) dispatch(actions.patchDraft(state.draft));
      if (state.theme) dispatch(actions.setTheme(state.theme));
      if (state.session_id) dispatch(actions.setSessionId(state.session_id));
      for (const turn of state.turns ?? []) {
        dispatch(actions.appendTurn(turn));
      }
      setReady(true);
    }, 0);

    return () => window.clearTimeout(id);
  }, [dispatch, state]);

  return ready ? <Interview /> : null;
}

async function renderInterview(state: Partial<AppState>): Promise<void> {
  render(
    <AppStoreProvider>
      <InterviewHarness state={state} />
    </AppStoreProvider>,
  );
  await screen.findByText(/interview · documentarian/i);
}

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("Interview", () => {
  it("shows held phrases from the current in-session turns", async () => {
    await renderInterview(
      interviewState([
        guideTurn(1),
        userTurn(2, ["garlic and orange peel", "the kitchen radio"]),
        { ...guideTurn(3), text: "What did the room sound like?" },
      ]),
    );

    expect(await screen.findByText("garlic and orange peel")).toBeTruthy();
    expect(screen.getByText("the kitchen radio")).toBeTruthy();
    expect(screen.getByText("What did the room sound like?")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("saves the current three held phrases on the submitted user turn", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          question: "What happened next?",
          meta: null,
          phrases_held: [
            "her hands smelled of garlic",
            "the kitchen radio stayed on",
            "she answered the phone the same way",
          ],
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
    await renderInterview(interviewState([guideTurn(1)]));
    fireEvent.change(screen.getByPlaceholderText(/something specific/i), {
      target: {
        value:
          "Her hands smelled of garlic. The kitchen radio stayed on. She answered the phone the same way.",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    await screen.findByText("What happened next?");
    await waitFor(() => {
      const saved = JSON.parse(
        window.localStorage.getItem(STORAGE_KEY) ?? "{}",
      ) as AppState;
      const savedUserTurn = saved.turns.find((turn) => turn.role === "user");
      expect(savedUserTurn?.phrases_held).toEqual([
        "her hands smelled of garlic",
        "the kitchen radio stayed on",
        "she answered the phone the same way",
      ]);
    });
  });

  it("stops accepting answers after eight guide questions", async () => {
    const turns = Array.from({ length: 8 }, (_, i) => [
      guideTurn(i * 2 + 1),
      userTurn(i * 2 + 2),
    ]).flat();
    await renderInterview(interviewState(turns));

    const textbox = await screen.findByPlaceholderText(/something specific/i);
    expect((textbox as HTMLTextAreaElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: /limit reached/i })).toBeTruthy();
    expect(screen.getByText("8/8 questions · 8 answers")).toBeTruthy();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
