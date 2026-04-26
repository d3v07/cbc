"use client";

import { useEffect, useState } from "react";
import type { GuideStub } from "@/types";
import { getSession, saveSession } from "@/lib/session";
import { applyTheme } from "@/lib/theme";
import { MomentPicker } from "./MomentPicker";
import { GuidePicker } from "./GuidePicker";
import { ThemeSlider } from "./ThemeSlider";
import { MagicalBackground } from "./MagicalBackground";
import { FloatingDecoration } from "./FloatingDecoration";

interface Props {
  guides: GuideStub[];
}

export function EntryScreen({ guides }: Props) {
  const [recipient, setRecipient] = useState("");
  const [occasion, setOccasion] = useState("");
  const [form, setForm] = useState<"poem" | "letter">("letter");
  const [guideId, setGuideId] = useState("");
  const [vibe, setVibe] = useState(25);

  useEffect(() => {
    const s = getSession();
    if (s.recipient) setRecipient(s.recipient);
    if (s.occasion) setOccasion(s.occasion);
    if (s.form) setForm(s.form);
    if (s.guide_id) setGuideId(s.guide_id);
    if (s.vibe !== undefined) setVibe(s.vibe);
    applyTheme(s.vibe ?? 25, 30);
  }, []);

  const fieldsComplete = recipient !== "" && occasion !== "";
  const canContinue = fieldsComplete && guideId !== "";

  function handleMomentChange(patch: {
    recipient?: string;
    occasion?: string;
    form?: "poem" | "letter";
  }) {
    if (patch.recipient !== undefined) setRecipient(patch.recipient);
    if (patch.occasion !== undefined) setOccasion(patch.occasion);
    if (patch.form !== undefined) setForm(patch.form);
  }

  function handleContinue() {
    saveSession({ recipient, occasion, form, guide_id: guideId, vibe });
    window.location.href = "/interview";
  }

  const titleColor = vibe < 50 ? '#FF69B4' : '#8B5CF6';
  const subtitleColor = vibe < 50 ? '#FFB6C1' : '#A78BFA';

  return (
    <div className="min-h-screen relative overflow-hidden">
      <MagicalBackground vibe={vibe} />
      <FloatingDecoration vibe={vibe} />

      <div className="relative z-10 container mx-auto py-16 pb-32">
        <header className="text-center mb-16 relative">
          <div className="inline-block mb-6 transition-all duration-500" style={{
            fontSize: vibe < 50 ? '64px' : '48px'
          }}>
            {vibe < 50 ? '✨' : '🌙'}
          </div>

          <h1
            className="mb-4 transition-all duration-500 animate-fade-in"
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: vibe < 50 ? '48px' : '44px',
              color: titleColor,
              fontWeight: vibe < 50 ? 400 : 700,
              letterSpacing: vibe < 50 ? '1px' : '2px',
              textShadow: vibe < 50
                ? '0 2px 10px rgba(255, 105, 180, 0.3)'
                : '0 2px 20px rgba(139, 92, 246, 0.5)',
              lineHeight: '1.2'
            }}
          >
            {vibe < 50 ? 'Craft Your Magical Message' : 'Forge Your Enchanted Words'}
          </h1>

          <p
            className="transition-all duration-500"
            style={{
              fontFamily: 'var(--font-sans)',
              fontSize: '16px',
              color: subtitleColor,
              maxWidth: '600px',
              margin: '0 auto',
              lineHeight: '1.6'
            }}
          >
            {vibe < 50
              ? 'Share a little magic with someone special. Let us help you find the perfect words that sparkle from the heart ✨'
              : 'Summon the perfect words from the depths of your soul. Choose your path and let the magic unfold 🌟'}
          </p>

          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 w-full h-full opacity-20 blur-3xl -z-10 transition-all duration-1000"
            style={{
              background: vibe < 50
                ? 'radial-gradient(circle, #FF69B4, #FFB6C1, transparent)'
                : 'radial-gradient(circle, #8B5CF6, #6B46C1, transparent)'
            }}
          />
        </header>

        <MomentPicker 
          recipient={recipient}
          occasion={occasion}
          form={form}
          onChange={handleMomentChange}
          vibe={vibe} 
        />

        {recipient && occasion && form && (
          <div className="animate-fade-in mt-16">
            <GuidePicker
              guides={guides}
              selectedId={guideId}
              onSelect={setGuideId}
              vibe={vibe}
            />
          </div>
        )}

        {/* ── Continue ── */}
        <div className="flex justify-center mt-12 transition-all duration-500" style={{ opacity: canContinue ? 1 : 0, pointerEvents: canContinue ? "auto" : "none" }}>
          <button
            type="button"
            onClick={handleContinue}
            disabled={!canContinue}
            className="group relative overflow-hidden transition-all duration-300 hover:scale-105"
            style={{
              padding: vibe < 50 ? "16px 40px" : "14px 32px",
              borderRadius: "9999px",
              background: vibe < 50
                ? "linear-gradient(135deg, #FF69B4, #FFB6C1)"
                : "linear-gradient(135deg, #8B5CF6, #A78BFA)",
              color: "white",
              fontWeight: 600,
              fontSize: "1.125rem",
              border: "none",
              cursor: "pointer",
              boxShadow: `0 8px 20px ${vibe < 50 ? "rgba(255, 105, 180, 0.4)" : "rgba(139, 92, 246, 0.4)"}`,
              letterSpacing: "0.05em",
            }}
          >
            <span className="relative z-10 flex items-center gap-2" style={{ fontFamily: 'var(--font-sans)' }}>
              Continue {vibe < 50 ? '✨' : '🔮'}
            </span>
          </button>
        </div>
      </div>

      {/* Theme Slider fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black/20 to-transparent pointer-events-none flex justify-center">
        <div className="pointer-events-auto">
          <ThemeSlider vibe={vibe} onChange={(v) => { setVibe(v); applyTheme(v, 30); }} />
        </div>
      </div>
    </div>
  );
}
