"use client";

import { useEffect, useState } from "react";
import { applyTheme } from "@/lib/theme";
import { saveSession } from "@/lib/session";

interface Props {
  vibe: number; // 0=Soft/Cute, 100=Bold/Gothic
  onChange: (vibe: number) => void;
}

export function ThemeSlider({ vibe, onChange }: Props) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    applyTheme(vibe, 30);
  }, [vibe]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    onChange(next);
    saveSession({ vibe: next });
  }

  const accentColor = vibe < 50 ? "#FF69B4" : "#8B5CF6";

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-6">
      <div
        className="backdrop-blur-md rounded-3xl p-6 shadow-2xl transition-all duration-500"
        style={{
          backgroundColor:
            vibe < 50
              ? "rgba(255, 245, 250, 0.95)"
              : `rgba(30, 20, 40, ${0.85 + (vibe - 50) / 200})`,
          border: `2px solid ${vibe < 50 ? "rgba(255, 182, 193, 0.5)" : "rgba(139, 92, 246, 0.5)"}`,
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span
              className="transition-all duration-500"
              style={{
                fontSize: "20px",
                opacity: 1 - vibe / 100,
              }}
            >
              ✨
            </span>
            <span
              className="transition-all duration-500"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: vibe < 50 ? "#FF69B4" : "#8B5CF6",
                fontWeight: 500,
              }}
            >
              Soft & Cute
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="transition-all duration-500"
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: "14px",
                color: vibe >= 50 ? "#8B5CF6" : "#D3D1C7",
                fontWeight: 500,
              }}
            >
              Bold & Gothic
            </span>
            <span
              className="transition-all duration-500"
              style={{
                fontSize: "20px",
                opacity: vibe / 100,
              }}
            >
              🌙
            </span>
          </div>
        </div>

        {/* Custom slider track */}
        <div className="relative h-2 mb-4">
          <div
            className="absolute inset-0 rounded-full transition-all duration-500"
            style={{
              background:
                vibe < 50
                  ? "linear-gradient(to right, #FFB6C1, #FFC0CB, #DDA0DD)"
                  : "linear-gradient(to right, #6B46C1, #8B5CF6, #4C1D95)",
            }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={vibe}
            onChange={handleChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            aria-label="Your vibe: Soft/Cute to Bold/Gothic"
            className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full shadow-lg transition-all duration-200"
            style={{
              left: `calc(${vibe}% - 12px)`,
              backgroundColor: accentColor,
              transform: `translateY(-50%) scale(${isDragging ? 1.2 : 1})`,
              boxShadow: `0 0 ${isDragging ? "20px" : "10px"} ${
                vibe < 50
                  ? "rgba(255, 105, 180, 0.5)"
                  : "rgba(139, 92, 246, 0.5)"
              }`,
            }}
          />
        </div>

        {/* Mood label */}
        <div
          className="text-center transition-all duration-500"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "12px",
            color: accentColor,
          }}
        >
          {vibe < 25 && "✨ Whimsical & Dreamy"}
          {vibe >= 25 && vibe < 50 && "🌸 Sweet & Enchanting"}
          {vibe >= 50 && vibe < 75 && "🌙 Mysterious & Elegant"}
          {vibe >= 75 && "🦇 Dark & Dramatic"}
        </div>
      </div>
    </div>
  );
}
