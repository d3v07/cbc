import type { MascotId, MascotMeta } from "./types";

export type { Emotion, MascotId, MascotMeta } from "./types";
export { EMOTIONS, MASCOT_IDS } from "./types";
export { Mascot } from "./Mascot";
export { Wren } from "./Wren";
export { Pip } from "./Pip";
export { Cassio } from "./Cassio";
export { Eyes } from "./Eyes";
export { Mouth } from "./Mouth";

// Default pairings. Mascots are decoupled — any mascot can run any guide;
// this is the visual default surfaced in the picker. `guide_id` matches
// the `id` field in `prompts/guides/*.guide.md`.
export const MASCOTS: Record<MascotId, MascotMeta> = {
  wren: {
    id: "wren",
    name: "Wren",
    guide_id: "documentarian",
    guide_name: "The Documentarian",
    default_theme: "quiet",
  },
  pip: {
    id: "pip",
    name: "Pip",
    guide_id: "poet-of-small-things",
    guide_name: "The Poet of Small Things",
    default_theme: "warm",
  },
  cassio: {
    id: "cassio",
    name: "Cassio",
    guide_id: "songwriter",
    guide_name: "The Songwriter",
    default_theme: "noir",
  },
};
