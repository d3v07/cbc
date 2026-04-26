"use client";

import { useState } from "react";
import { useAppStore, actions } from "@/lib/store";

const FEELINGS = [
  "I want to celebrate them",
  "I need to say I'm sorry",
  "I want to confess something",
  "I miss them so much",
  "I'm feeling grateful",
  "I just want to check in",
];

export function PickMoment() {
  const [{ draft }, dispatch] = useAppStore();
  const [text, setText] = useState("");
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);

  const handleNext = () => {
    // Dispatch selected text and move to next step
    dispatch(actions.patchDraft({ occasion: selectedFeeling || text }));
    dispatch(actions.nextStep());
  };

  return (
    <div className="stage animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-12">
        <h1 className="h-display text-center">What brings you here?</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FEELINGS.map((feeling) => (
            <button
              key={feeling}
              onClick={() => setSelectedFeeling(feeling)}
              className={`card text-left transition-all ${
                selectedFeeling === feeling ? "selected" : ""
              }`}
            >
              <div className="body-prose font-medium">{feeling}</div>
            </button>
          ))}
        </div>

        <div className="divider-flourish">
          <span className="ornament-glyph">~</span>
        </div>

        <div className="space-y-4">
          <label className="eyebrow block">Or tell us in your own words</label>
          <textarea
            className="textarea-prose ruled"
            rows={4}
            placeholder="I want to write a letter to my grandmother for her 80th birthday..."
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSelectedFeeling(null);
            }}
          />
        </div>

        <div className="flex justify-end pt-8">
          <button
            onClick={handleNext}
            disabled={!text && !selectedFeeling}
            className="btn primary stamp"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
