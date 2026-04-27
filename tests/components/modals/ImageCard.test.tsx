import { useEffect } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import ImageCard from "@/components/modals/ImageCard";
import { actions, AppStoreProvider, useAppStore, type AppState } from "@/lib/store";

const originalFetch = globalThis.fetch;

function ImageCardHarness({ state }: { state: Partial<AppState> }) {
  const [, dispatch] = useAppStore();

  useEffect(() => {
    const id = window.setTimeout(() => {
      if (state.artifact_text !== undefined) {
        dispatch(actions.setArtifactText(state.artifact_text));
      }
      if (state.draft) {
        dispatch(actions.patchDraft(state.draft));
      }
      if (state.theme) {
        dispatch(actions.setTheme(state.theme));
      }
      dispatch(actions.setModal("imagecard"));
    }, 0);

    return () => window.clearTimeout(id);
  }, [dispatch, state]);

  return <ImageCard />;
}

const renderImageCard = (state: Partial<AppState> = {}) =>
  render(
    <AppStoreProvider>
      <ImageCardHarness state={state} />
    </AppStoreProvider>,
  );

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
});

describe("ImageCard modal", () => {
  it("renders the format options from the design reference", async () => {
    renderImageCard();
    expect(await screen.findByRole("button", { name: /1 : 1/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /4 : 5/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /9 : 16/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /16 : 9/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /letter artifact photo/i })).toBeTruthy();
  });

  it("updates the live preview when layout and format change", async () => {
    renderImageCard();
    const preview = await screen.findByTestId("image-card-preview");
    expect(preview.getAttribute("data-format")).toBe("1x1");
    expect(preview.getAttribute("data-layout")).toBe("hero");

    fireEvent.click(screen.getByRole("button", { name: /photo \+ caption/i }));
    fireEvent.click(screen.getByRole("button", { name: /9 : 16/i }));
    expect(preview.getAttribute("data-format")).toBe("9x16");
    expect(preview.getAttribute("data-layout")).toBe("photo");
  });

  it("generates an image card from the current artifact", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          image_url: "data:image/png;base64,abc123",
          mime: "image/png",
          model: "gpt-image-1",
          format: "square",
          layout: "hero",
        }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    renderImageCard({
      artifact_text: "She kept the kitchen radio on low.",
      draft: {
        recipient: "Maya",
        occasion: "birthday",
        form: "letter",
        guide_id: "documentarian",
      },
      theme: "warm",
    });

    fireEvent.click(await screen.findByRole("button", { name: /generate 1x1 image/i }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce());
    const [, init] = fetchMock.mock.calls[0]!;
    const body = JSON.parse(String(init?.body)) as {
      artifact: string;
      recipient: string;
      occasion: string;
      theme: string;
      format: string;
      layout: string;
    };
    expect(body.artifact).toBe("She kept the kitchen radio on low.");
    expect(body.recipient).toBe("Maya");
    expect(body.occasion).toBe("birthday");
    expect(body.theme).toBe("warm");
    expect(body.format).toBe("square");
    expect(body.layout).toBe("hero");
    expect(
      (await screen.findByTestId("image-card-generated")).getAttribute("src"),
    ).toBe("data:image/png;base64,abc123");
    expect(screen.getByRole("status").textContent ?? "").toMatch(/image prepared/i);
  });
});
