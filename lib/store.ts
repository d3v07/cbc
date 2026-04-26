"use client";

import { createContext, createElement, useContext, useEffect, useReducer, type ReactNode } from "react";
import { z } from "zod";
import { EMOTIONS, type Emotion } from "@/components/mascots";
import { FormSchema, ThemeSchema, type Form, type Theme } from "@/lib/types/session";

export const STEPS_TUPLE = [
  "moment",
  "guide",
  "interview",
  "spine",
  "drafting",
  "render",
  "reel",
] as const;
const StepSchema = z.enum(STEPS_TUPLE);
export type Step = z.infer<typeof StepSchema>;

export const MODAL_KINDS_TUPLE = [
  "createguide",
  "download",
  "save",
  "share",
  "startover",
  "imagecard",
  "reel",
] as const;
const ModalKindSchema = z.enum(MODAL_KINDS_TUPLE).nullable();
export type ModalKind = z.infer<typeof ModalKindSchema>;

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

const STEPS: readonly Step[] = STEPS_TUPLE;
const EmotionSchema = z.enum(EMOTIONS as readonly [Emotion, ...Emotion[]]);

// Persisted shape — mirrors AppState but every field is validated. Future
// schema evolution requires bumping STORAGE_KEY (mean_it_app_state_v2 etc.)
// or migrating in `loadInitial`.
const DraftSchema = z.object({
  recipient: z.string().default(""),
  occasion: z.string().default(""),
  form: FormSchema.nullable().default(null),
  guide_id: z.string().nullable().default(null),
});
const PersistedSchema = z.object({
  step: StepSchema,
  theme: ThemeSchema,
  emotion: EmotionSchema,
  modal: ModalKindSchema,
  draft: DraftSchema,
});

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
type StoreTuple = readonly [AppState, React.Dispatch<Action>];
const AppStoreContext = createContext<StoreTuple | null>(null);

function loadInitial(): AppState {
  if (typeof window === "undefined") return INITIAL_STATE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const candidate = JSON.parse(raw);
    const result = PersistedSchema.safeParse(candidate);
    if (!result.success) {
      // Stale or malformed persisted state — discard rather than poison
      // the reducer with values like `theme: "rainbow"` or `step: "draft"`.
      window.localStorage.removeItem(STORAGE_KEY);
      return INITIAL_STATE;
    }
    return result.data;
  } catch {
    return INITIAL_STATE;
  }
}

function useAppStoreReducer() {
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

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const store = useAppStoreReducer();
  return createElement(AppStoreContext.Provider, { value: store }, children);
}

export function useAppStore() {
  const store = useContext(AppStoreContext);
  if (!store) {
    throw new Error("useAppStore must be used within AppStoreProvider");
  }
  return store;
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
