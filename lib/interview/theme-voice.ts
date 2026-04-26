import type { Theme } from "@/lib/types/session";

// Short instruction blocks appended to the assembled interviewer system
// prompt, one per theme. Modulates voice without rewriting the persona.
// Cute leans playful; gothic leans patient with silence — see DESIGN.md.
export const THEME_VOICE: Record<Theme, string> = {
  cute: "Lean playful and curious. Permission to use small surprises and delight, light textures, gentle wordplay. Never saccharine; the warmth is genuine, not performed.",
  warm: "Low-key, family-shaped, conversational. Patient with the everyday — the kitchen, the Tuesday, the small habit. Treat the ordinary as load-bearing.",
  quiet: "Patient with silence — leave room. Resist filling the gap when the user trails off. Solemn but never heavy-handed; let what hurts be quietly named.",
  noir: "Comfortable with weight and shadow. Lean into the line that's almost too honest — the contradiction, the regret, the thing said too late. Don't tidy the mess.",
  gothic: "Most patient with silence. Most willing to sit with what's unresolved. The line you almost don't ask is the one that matters. Spare prose; ceremonial weight.",
};

const DEFAULT_THEME: Theme = "warm";

export function themeVoiceBlock(theme: Theme | undefined): string {
  return THEME_VOICE[theme ?? DEFAULT_THEME];
}
