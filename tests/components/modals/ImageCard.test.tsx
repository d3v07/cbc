import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import ImageCard from "@/components/modals/ImageCard";
import { AppStoreProvider, INITIAL_STATE, type AppState } from "@/lib/store";

const STORAGE_KEY = "mean_it_app_state_v1";

const seedState = (overrides: Partial<AppState> = {}): void => {
  const state: AppState = { ...INITIAL_STATE, ...overrides };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const renderImageCard = () =>
  render(
    <AppStoreProvider>
      <ImageCard />
    </AppStoreProvider>,
  );

afterEach(() => {
  cleanup();
});

describe("ImageCard modal", () => {
  it("renders the format options from the design reference", () => {
    seedState({ modal: "imagecard" });
    renderImageCard();
    expect(screen.getByRole("button", { name: /1 : 1/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /4 : 5/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /9 : 16/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /16 : 9/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /letter artifact photo/i })).toBeTruthy();
  });

  it("updates the live preview when layout and format change", () => {
    seedState({ modal: "imagecard" });
    renderImageCard();
    const preview = screen.getByTestId("image-card-preview");
    expect(preview.getAttribute("data-format")).toBe("1x1");
    expect(preview.getAttribute("data-layout")).toBe("hero");

    fireEvent.click(screen.getByRole("button", { name: /photo \+ caption/i }));
    fireEvent.click(screen.getByRole("button", { name: /9 : 16/i }));
    expect(preview.getAttribute("data-format")).toBe("9x16");
    expect(preview.getAttribute("data-layout")).toBe("photo");
  });

  it("reports when an image has been prepared", () => {
    seedState({ modal: "imagecard" });
    renderImageCard();
    fireEvent.click(screen.getByRole("button", { name: /download 1x1 image/i }));
    expect(screen.getByRole("status").textContent ?? "").toMatch(/image prepared/i);
  });
});
