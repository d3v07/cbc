import { afterEach, describe, expect, it } from "vitest";
import { useEffect, useState, type ReactElement } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Download } from "@/components/modals/Download";
import {
  actions,
  AppStoreProvider,
  useAppStore,
  type ModalKind,
} from "@/lib/store";

function ModalOpener({
  modal,
  children,
}: {
  modal: ModalKind;
  children: ReactElement;
}) {
  const [, dispatch] = useAppStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      dispatch(actions.setModal(modal));
      setReady(true);
    }, 0);

    return () => window.clearTimeout(id);
  }, [dispatch, modal]);

  return ready ? children : null;
}

const renderModal = (ui: ReactElement, modal: ModalKind = null) =>
  render(
    <AppStoreProvider>
      <ModalOpener modal={modal}>{ui}</ModalOpener>
    </AppStoreProvider>,
  );

afterEach(() => {
  cleanup();
});

describe("Download modal", () => {
  it("renders nothing when state.modal is not 'download'", async () => {
    renderModal(<Download />);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("renders the dialog when state.modal === 'download'", async () => {
    renderModal(<Download availableFormats={{ mp4: true }} />, "download");
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("hides MP4 button when availableFormats.mp4 !== true", async () => {
    renderModal(<Download availableFormats={{ webm: true }} />, "download");
    await screen.findByRole("dialog");
    expect(screen.queryByTestId("fmt-mp4")).toBeNull();
    expect(screen.queryByTestId("fmt-webm")).not.toBeNull();
  });

  it("download button is disabled until a format is picked", async () => {
    renderModal(
      <Download availableFormats={{ mp4: true, webm: true }} />,
      "download",
    );
    const btn = await screen.findByRole("button", { name: /^download$/ }) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    const mp4Radio = screen
      .getByTestId("fmt-mp4")
      .querySelector('input[type="radio"]') as HTMLInputElement;
    fireEvent.click(mp4Radio);
    expect(btn.disabled).toBe(false);
  });

  it("flips include-captions and include-byline toggles", async () => {
    renderModal(<Download availableFormats={{ mp4: true }} />, "download");
    const captions = await screen.findByLabelText(/include captions/i) as HTMLInputElement;
    const byline = screen.getByLabelText(/include byline/i) as HTMLInputElement;
    expect(captions.checked).toBe(false);
    expect(byline.checked).toBe(false);
    fireEvent.click(captions);
    fireEvent.click(byline);
    expect(captions.checked).toBe(true);
    expect(byline.checked).toBe(true);
  });

  it("cancel button closes the modal", async () => {
    renderModal(<Download availableFormats={{ mp4: true }} />, "download");
    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("Escape key closes the modal", async () => {
    renderModal(<Download availableFormats={{ mp4: true }} />, "download");
    expect(await screen.findByRole("dialog")).toBeTruthy();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("overlay click closes the modal", async () => {
    renderModal(<Download availableFormats={{ mp4: true }} />, "download");
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(dialog);
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
