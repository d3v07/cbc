"use client";

import { useAppStore, actions } from "@/lib/store";
import { ModalShell, StampMark } from "@/components/modals/shared";

export default function StartOver() {
  const [state, dispatch] = useAppStore();
  const dismiss = () => dispatch(actions.setModal(null));
  const confirm = () => dispatch(actions.reset());

  return (
    <ModalShell
      open={state.modal === "startover"}
      onClose={dismiss}
      title="Start over?"
    >
      <div
        style={{ display: "flex", justifyContent: "flex-end", marginTop: -4, marginBottom: 8 }}
        aria-hidden="true"
      >
        <StampMark label="begin" size={40} />
      </div>
      <p
        className="body-prose"
        style={{
          fontSize: 15,
          marginTop: 0,
          marginBottom: 22,
          color: "var(--t-ink)",
        }}
      >
        Your draft and provenance trace will be lost — this letter cannot be recovered once you begin again.
      </p>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <button type="button" className="btn ghost" onClick={dismiss}>
          cancel
        </button>
        <button type="button" className="btn primary" onClick={confirm}>
          start over
        </button>
      </div>
    </ModalShell>
  );
}
