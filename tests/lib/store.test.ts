import { describe, expect, it } from "vitest";
import { INITIAL_STATE, actions, reducer } from "@/lib/store";
import type { Turn } from "@/lib/types/session";

describe("reducer", () => {
  it("set_step changes the step", () => {
    const next = reducer(INITIAL_STATE, actions.setStep("guide"));
    expect(next.step).toBe("guide");
  });

  it("next_step advances through the flow in order", () => {
    const order = [
      "moment",
      "guide",
      "interview",
      "spine",
      "drafting",
      "render",
    ] as const;
    let state = INITIAL_STATE;
    for (let i = 1; i < order.length; i++) {
      state = reducer(state, actions.nextStep());
      expect(state.step).toBe(order[i]);
    }
  });

  it("next_step wraps from render back to moment", () => {
    const onRender = { ...INITIAL_STATE, step: "render" as const };
    const wrapped = reducer(onRender, actions.nextStep());
    expect(wrapped.step).toBe("moment");
  });

  it("set_theme changes the theme", () => {
    const next = reducer(INITIAL_STATE, actions.setTheme("gothic"));
    expect(next.theme).toBe("gothic");
  });

  it("set_emotion changes the emotion", () => {
    const next = reducer(INITIAL_STATE, actions.setEmotion("moved"));
    expect(next.emotion).toBe("moved");
  });

  it("set_modal opens and closes modals", () => {
    const opened = reducer(INITIAL_STATE, actions.setModal("download"));
    expect(opened.modal).toBe("download");
    const closed = reducer(opened, actions.setModal(null));
    expect(closed.modal).toBeNull();
  });

  it("patch_draft merges partial patches into the draft", () => {
    const r1 = reducer(
      INITIAL_STATE,
      actions.patchDraft({ recipient: "Tomas" }),
    );
    expect(r1.draft.recipient).toBe("Tomas");
    expect(r1.draft.occasion).toBe("");

    const r2 = reducer(r1, actions.patchDraft({ occasion: "eulogy" }));
    expect(r2.draft.recipient).toBe("Tomas");
    expect(r2.draft.occasion).toBe("eulogy");
  });

  it("reset returns to the initial state", () => {
    const dirty = reducer(INITIAL_STATE, actions.setStep("render"));
    const dirtier = reducer(dirty, actions.setTheme("gothic"));
    const clean = reducer(dirtier, actions.reset());
    expect(clean).toEqual(INITIAL_STATE);
  });

  it("does not mutate the previous state", () => {
    const before = INITIAL_STATE;
    const after = reducer(before, actions.setTheme("noir"));
    expect(before.theme).toBe("quiet");
    expect(after.theme).toBe("noir");
    expect(after).not.toBe(before);
  });

  it("set_session_id assigns a session id without disturbing other state", () => {
    const next = reducer(INITIAL_STATE, actions.setSessionId("session-abc"));
    expect(next.session_id).toBe("session-abc");
    expect(next.step).toBe(INITIAL_STATE.step);
    expect(next.turns).toEqual(INITIAL_STATE.turns);
  });

  it("set_artifact_text replaces the artifact_text", () => {
    const next = reducer(
      INITIAL_STATE,
      actions.setArtifactText("Tomas kept a notebook."),
    );
    expect(next.artifact_text).toBe("Tomas kept a notebook.");
    expect(INITIAL_STATE.artifact_text).toBe("");
  });

  it("append_turn pushes turns immutably", () => {
    const turn1: Turn = {
      id: "g1",
      session_id: "s1",
      role: "guide",
      text: "First question?",
      ts: 1,
    };
    const turn2: Turn = {
      id: "u1",
      session_id: "s1",
      role: "user",
      text: "First answer.",
      ts: 2,
    };
    const after1 = reducer(INITIAL_STATE, actions.appendTurn(turn1));
    expect(after1.turns).toEqual([turn1]);
    const after2 = reducer(after1, actions.appendTurn(turn2));
    expect(after2.turns).toEqual([turn1, turn2]);
    // earlier state's array unchanged
    expect(after1.turns).toEqual([turn1]);
    expect(INITIAL_STATE.turns).toEqual([]);
  });
});
