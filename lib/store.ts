"use client";

import { useEffect, useReducer } from "react";
import type { Emotion } from "@/components/mascots";
import type { Form, Theme } from "@/lib/types/session";

export type Step =
  | "moment"
  | "guide"
  | "interview"
  | "spine"
  | "drafting"
  | "render";

export type ModalKind =
  | "createguide"
  | "download"
  | "save"
  | "share"
  | "startover"
  | "imagecard"
  | "reel"
  | null;

// Slice of `Session` accumulated as the user moves through the flow. The
// canonical `Session` (from `@/lib/types/session`) is constructed at render
// time when all required fields are present.
export interface DraftSession {
  recipient: string;
  occasion: string;
  form: Form | null;
  guide_id: string | null;
}

export interface AppState {
  step: Step;
  theme: Theme;
  emotion: Emotion;
  modal: ModalKind;
  draft: DraftSession;
}

export type Action =
  | { type: "set_step"; step: Step }
  | { type: "next_step" }
  | { type: "set_theme"; theme: Theme }
  | { type: "set_emotion"; emotion: Emotion }
  | { type: "set_modal"; modal: ModalKind }
  | { type: "patch_draft"; patch: Partial<DraftSession> }
  | { type: "reset" };

const STEPS: readonly Step[] = [
  "moment",
  "guide",
  "interview",
  "spine",
  "drafting",
  "render",
] as const;

export const INITIAL_STATE: AppState = {
  step: "moment",
  theme: "quiet",
  emotion: "listening",
  modal: null,
  draft: {
    recipient: "",
    occasion: "",
    form: null,
    guide_id: null,
  },
};

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "set_step":
      return { ...state, step: action.step };
    case "next_step": {
      const i = STEPS.indexOf(state.step);
      const next = STEPS[i + 1] ?? "moment";
      return { ...state, step: next };
    }
    case "set_theme":
      return { ...state, theme: action.theme };
    case "set_emotion":
      return { ...state, emotion: action.emotion };
    case "set_modal":
      return { ...state, modal: action.modal };
    case "patch_draft":
      return { ...state, draft: { ...state.draft, ...action.patch } };
    case "reset":
      return INITIAL_STATE;
  }
}

const STORAGE_KEY = "mean_it_app_state_v1";

function loadInitial(): AppState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...INITIAL_STATE,
      ...parsed,
      draft: { ...INITIAL_STATE.draft, ...(parsed.draft ?? {}) },
    };
  } catch {
    return INITIAL_STATE;
  }
}

export function useAppStore() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE, loadInitial);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // localStorage full or unavailable — drop silently.
    }
  }, [state]);
  return [state, dispatch] as const;
}

// Action constructors for ergonomic dispatch at call sites.
export const actions = {
  setStep: (step: Step): Action => ({ type: "set_step", step }),
  nextStep: (): Action => ({ type: "next_step" }),
  setTheme: (theme: Theme): Action => ({ type: "set_theme", theme }),
  setEmotion: (emotion: Emotion): Action => ({ type: "set_emotion", emotion }),
  setModal: (modal: ModalKind): Action => ({ type: "set_modal", modal }),
  patchDraft: (patch: Partial<DraftSession>): Action => ({
    type: "patch_draft",
    patch,
  }),
  reset: (): Action => ({ type: "reset" }),
};
