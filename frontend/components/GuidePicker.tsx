"use client";

import type { GuideStub } from "@/types";
import { GuideCard } from "./GuideCard";
import { saveSession } from "@/lib/session";

interface Props {
  guides: GuideStub[];
  selectedId: string;
  onSelect: (id: string) => void;
  vibe?: number;
}

export function GuidePicker({ guides, selectedId, onSelect, vibe = 25 }: Props) {
  function handleSelect(id: string) {
    onSelect(id);
    saveSession({ guide_id: id });
  }

  const titleColor = vibe < 50 ? "#FF69B4" : "#8B5CF6";

  return (
    <div>
      <div className="flex items-center gap-3 mb-8 justify-center">
        <span style={{ fontSize: "28px" }}>✨</span>
        <h3
          className="transition-all duration-500"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: vibe < 50 ? "28px" : "26px",
            color: titleColor,
            fontWeight: vibe < 50 ? 400 : 600,
            letterSpacing: vibe < 50 ? "0.5px" : "1.5px",
          }}
        >
          Choose Your Writing Guide
        </h3>
        <span style={{ fontSize: "28px" }}>✨</span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {guides.map((guide) => (
          <GuideCard
            key={guide.id}
            guide={guide}
            selected={selectedId === guide.id}
            onSelect={handleSelect}
            vibe={vibe}
          />
        ))}
      </div>
    </div>
  );
}
