"use client";

import { useAppStore, actions } from "@/lib/store";
import { Mascot } from "@/components/mascots/Mascot";
import { MASCOTS } from "@/components/mascots";
import type { Guide } from "@/lib/guides/schema";
import type { MascotId } from "@/components/mascots/types";

// Map a guide-id to a default mascot. Falls back to Wren if the guide is
// user-authored / shared and not in the canonical roster.
function mascotFor(guideId: string): MascotId {
  const meta = Object.values(MASCOTS).find((m) => m.guide_id === guideId);
  return meta?.id ?? "wren";
}

// First sentence of `description` makes a serviceable tagline. The picker
// card has limited room — we intentionally truncate.
function taglineFor(guide: Guide): string {
  const sentence = guide.description.split(/(?<=\.)\s+/)[0]?.trim() ?? "";
  if (sentence.length > 0 && sentence.length <= 140) return sentence;
  if (sentence.length > 140) return sentence.slice(0, 137).trim() + "…";
  return guide.sensibility.split(/(?<=\.)\s+/)[0]?.trim() ?? "";
}

export function GuidePicker({ guides = [] }: { guides?: Guide[] }) {
  const [, dispatch] = useAppStore();

  const handleSelect = (guideId: string) => {
    dispatch(actions.patchDraft({ guide_id: guideId }));
    dispatch(actions.nextStep());
  };

  return (
    <div className="stage animate-fade-in">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="h-display text-center smaller">Who should guide you?</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guides.map((guide) => (
            <button
              key={guide.id}
              onClick={() => handleSelect(guide.id)}
              className="plate flex flex-col items-center gap-6 text-center hover:-translate-y-1 transition-transform"
            >
              <div className="w-32 h-32">
                <Mascot id={mascotFor(guide.id)} emotion="listening" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-medium mb-2">{guide.name}</h3>
                <p className="body-prose text-sm">{taglineFor(guide)}</p>
              </div>
            </button>
          ))}

          <button
            onClick={() => handleSelect("custom")}
            className="plate bare flex flex-col items-center justify-center gap-4 text-center hover:-translate-y-1 transition-transform"
          >
            <div className="w-16 h-16 rounded-full border-2 border-dashed border-current flex items-center justify-center text-2xl muted">
              +
            </div>
            <h3 className="font-serif text-xl font-medium muted">Create your own</h3>
          </button>
        </div>
      </div>
    </div>
  );
}
