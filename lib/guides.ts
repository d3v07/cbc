import type { GuideStub } from "@/types";

export const GUIDE_STUBS: GuideStub[] = [
  {
    id: "documentarian",
    name: "The Documentarian",
    description:
      "Treats ordinary moments as historically important. Asks in concrete particulars — sounds, phrases, textures of a regular Tuesday.",
    best_for: ["eulogy", "legacy", "family story", "memorial", "retirement"],
    tone_tag: "Tender",
  },
  {
    id: "poet-of-small-things",
    name: "The Poet of Small Things",
    description:
      "Quietly delighted by sensory detail. Believes the everyday is where meaning actually lives. Resists the grand gesture.",
    best_for: ["birthday", "gratitude", "anniversary", "thank you"],
    tone_tag: "Warm",
  },
  {
    id: "songwriter",
    name: "The Songwriter",
    description:
      "Comfortable with ache and mess. Believes the line you almost don't write is the one that matters most.",
    best_for: ["love letter", "apology", "anniversary", "reconciliation"],
    tone_tag: "Honest",
  },
  {
    id: "chronicler",
    name: "The Chronicler",
    description:
      "Precise and celebratory. Finds the right words for professional moments — formal, warm, and exactly the right length.",
    best_for: ["retirement", "promotion", "work anniversary", "farewell"],
    tone_tag: "Professional",
  },
];
