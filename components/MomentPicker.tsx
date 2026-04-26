"use client";

import { useState, useEffect } from "react";
import { saveSession } from "@/lib/session";

const RECIPIENTS = [
  { value: "Partner", emoji: "💕" },
  { value: "Parent", emoji: "🌟" },
  { value: "Friend", emoji: "🌈" },
  { value: "Colleague", emoji: "✨" },
  { value: "Sibling", emoji: "🎀" },
  { value: "Child", emoji: "🧸" },
  { value: "Grandparent", emoji: "💝" },
  { value: "Someone else", emoji: "💌" },
];

const OCCASIONS = [
  { value: "birthday", label: "Birthday", emoji: "🎂" },
  { value: "anniversary", label: "Anniversary", emoji: "💝" },
  { value: "love_letter", label: "Love letter", emoji: "💌" },
  { value: "apology", label: "Apology", emoji: "🙏" },
  { value: "gratitude", label: "Gratitude", emoji: "✨" },
  { value: "eulogy", label: "Eulogy", emoji: "🕊️" },
  { value: "memorial", label: "Memorial", emoji: "🌿" },
  { value: "retirement", label: "Retirement", emoji: "🎓" },
  { value: "family_story", label: "Family story", emoji: "📖" },
  { value: "just_because", label: "Just because", emoji: "🥂" },
];

const FORMS = [
  { value: "letter", label: "Letter", emoji: "✉️" },
  { value: "poem", label: "Poem", emoji: "📝" },
];

interface Props {
  recipient: string;
  occasion: string;
  form: "poem" | "letter";
  onChange: (patch: { recipient?: string; occasion?: string; form?: "poem" | "letter" }) => void;
  vibe?: number;
}

function SelectorRow({
  label,
  icon,
  options,
  selected,
  onSelect,
  vibe = 25,
}: {
  label: string;
  icon: React.ReactNode;
  options: Array<{ value: string; label?: string; emoji: string }>;
  selected: string;
  onSelect: (value: string) => void;
  vibe?: number;
}) {
  const borderRadius = vibe < 50 ? "24px" : `${24 - (vibe - 50) * 0.3}px`;
  const labelColor = vibe < 50 ? "#FF69B4" : "#8B5CF6";
  const selectedBg =
    vibe < 50
      ? "linear-gradient(135deg, #FF69B4, #FFB6C1)"
      : "linear-gradient(135deg, #8B5CF6, #A78BFA)";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div style={{ color: labelColor }} className="transition-colors duration-500">
          {icon}
        </div>
        <h3
          className="transition-all duration-500"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: vibe < 50 ? "24px" : "22px",
            color: labelColor,
            fontWeight: vibe < 50 ? 400 : 600,
            letterSpacing: vibe < 50 ? "0.5px" : "1px",
          }}
        >
          {label}
        </h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              aria-pressed={isSelected}
              className="group relative overflow-hidden transition-all duration-300 hover:scale-105"
              style={{
                borderRadius,
                padding: vibe < 50 ? "14px 24px" : "12px 20px",
                background: isSelected
                  ? selectedBg
                  : vibe < 50
                    ? "rgba(255, 255, 255, 0.9)"
                    : "rgba(30, 20, 40, 0.6)",
                border: isSelected
                  ? "none"
                  : vibe < 50
                    ? "2px solid rgba(255, 182, 193, 0.5)"
                    : "2px solid rgba(139, 92, 246, 0.5)",
                color: isSelected
                  ? "white"
                  : vibe < 50
                    ? "#FF69B4"
                    : "#A78BFA",
                backdropFilter: "blur(10px)",
                boxShadow: isSelected
                  ? `0 8px 20px ${vibe < 50 ? "rgba(255, 105, 180, 0.4)" : "rgba(139, 92, 246, 0.4)"}`
                  : "none",
                cursor: "pointer",
              }}
            >
              <span
                className="flex items-center gap-2 transition-all duration-300"
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "15px",
                  fontWeight: isSelected ? 600 : 500,
                }}
              >
                <span className="text-xl">{option.emoji}</span>
                {option.label || option.value}
              </span>
              {isSelected && (
                <div
                  className="absolute inset-0 -z-10 opacity-30 blur-xl transition-all duration-500"
                  style={{
                    background:
                      vibe < 50
                        ? "radial-gradient(circle, #FF69B4, transparent)"
                        : "radial-gradient(circle, #8B5CF6, transparent)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MomentPicker({ recipient, occasion, form, onChange, vibe = 25 }: Props) {
  function pick(field: "recipient" | "occasion" | "form", value: string) {
    if (field === "recipient") {
      onChange({ recipient: value });
      saveSession({ recipient: value });
    } else if (field === "occasion") {
      onChange({ occasion: value });
      saveSession({ occasion: value });
    } else {
      const f = value as "poem" | "letter";
      onChange({ form: f });
      saveSession({ form: f });
    }
  }

  return (
    <div className="w-full space-y-12">
      <SelectorRow
        label="Who is this for?"
        icon={<span style={{ fontSize: "24px" }}>💕</span>}
        options={RECIPIENTS}
        selected={recipient}
        onSelect={(value) => pick("recipient", value)}
        vibe={vibe}
      />
      <SelectorRow
        label="What's the occasion?"
        icon={<span style={{ fontSize: "24px" }}>✨</span>}
        options={OCCASIONS}
        selected={occasion}
        onSelect={(value) => pick("occasion", value)}
        vibe={vibe}
      />
      <SelectorRow
        label="What format?"
        icon={<span style={{ fontSize: "24px" }}>📮</span>}
        options={FORMS}
        selected={form}
        onSelect={(value) => pick("form", value)}
        vibe={vibe}
      />
    </div>
  );
}
