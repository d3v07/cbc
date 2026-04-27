"use client";

import { useEffect, useState } from "react";
import { useAppStore, actions } from "@/lib/store";
import type { Form } from "@/lib/types/session";

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
  const [recipient, setRecipient] = useState(draft.recipient);
  const [text, setText] = useState(draft.occasion);
  const [form, setForm] = useState<Form>(draft.form ?? "letter");
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);

  useEffect(() => {
    setRecipient(draft.recipient);
    setText(draft.occasion);
    setForm(draft.form ?? "letter");
    setSelectedFeeling(FEELINGS.includes(draft.occasion) ? draft.occasion : null);
  }, [draft.recipient, draft.occasion, draft.form]);

  const handleNext = () => {
    const occasion = (selectedFeeling || text).trim();
    dispatch(
      actions.startSession({
        recipient: recipient.trim(),
        occasion,
        form,
        guide_id: null,
      }),
    );
  };

  const canContinue = Boolean(recipient.trim()) && Boolean(text.trim() || selectedFeeling) && Boolean(form);

  return (
    <div className="stage animate-fade-in">
      <div className="max-w-3xl mx-auto space-y-12">
        <h1 className="h-display text-center">What brings you here?</h1>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {FEELINGS.map((feeling) => (
            <button
              key={feeling}
              onClick={() => {
                setSelectedFeeling(feeling);
                dispatch(actions.patchDraft({ occasion: feeling }));
              }}
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
          <label className="eyebrow block">Who is this for?</label>
          <input
            className="textarea-prose"
            style={{ minHeight: 0, paddingTop: 14, paddingBottom: 14 }}
            placeholder="Tomas, Mom, Nisha..."
            value={recipient}
            onChange={(e) => {
              setRecipient(e.target.value);
              dispatch(actions.patchDraft({ recipient: e.target.value }));
            }}
          />
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
              dispatch(actions.patchDraft({ occasion: e.target.value }));
            }}
          />
        </div>

        <div className="space-y-4">
          <label className="eyebrow block">What are you making?</label>
          <div className="flex gap-3">
            {(["letter", "poem"] as const).map((kind) => (
              <button
                key={kind}
                type="button"
                className={`btn ghost sm ${form === kind ? "selected" : ""}`}
                onClick={() => {
                  setForm(kind);
                  dispatch(actions.patchDraft({ form: kind }));
                }}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-8">
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className="btn primary stamp"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
