export type Emotion =
  | "listening"
  | "curious"
  | "moved"
  | "sad"
  | "hopeful"
  | "silence";

export type MascotId = "wren" | "pip" | "cassio";

export const EMOTIONS: readonly Emotion[] = [
  "listening",
  "curious",
  "moved",
  "sad",
  "hopeful",
  "silence",
];

export const MASCOT_IDS: readonly MascotId[] = ["wren", "pip", "cassio"];

export interface MascotMeta {
  id: MascotId;
  name: string;
  // Matches Guide.id from `@/lib/guides/schema`. Pairings are presentation —
  // any mascot can run any guide; this is just the default visual coupling.
  guide_id: string;
  guide_name: string;
  default_theme: "cute" | "warm" | "quiet" | "noir" | "gothic";
}
