"use client";

import { useAppStore, actions } from "@/lib/store";
import { Mascot } from "@/components/mascots/Mascot";

interface Guide {
  id: string;
  name: string;
  tagline: string;
  mascot: string;
}

export function GuidePicker({ guides = [] }: { guides?: Guide[] }) {
  const [{ draft }, dispatch] = useAppStore();

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
                {/* @ts-expect-error MascotId mapping */}
                <Mascot id={guide.mascot} emotion="listening" />
              </div>
              <div>
                <h3 className="font-serif text-2xl font-medium mb-2">{guide.name}</h3>
                <p className="body-prose text-sm">{guide.tagline}</p>
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
