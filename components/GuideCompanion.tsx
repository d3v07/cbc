"use client";

export type CompanionState = "idle" | "encouraging" | "ready";

const MESSAGES: Record<CompanionState, string> = {
  idle: "Tell me who you're writing for.",
  encouraging: "Good — keep going, you're almost there.",
  ready: "Pick a guide and let's begin.",
};

interface Props {
  state: CompanionState;
  tone: number;
}

export function GuideCompanion({ state, tone }: Props) {
  // Eye shape shifts with tone: round (soft) → narrow/angular (gothic)
  const eyeRy = Math.max(4, 10 - tone * 0.08);
  const eyeRx = Math.min(10, 6 + tone * 0.04);
  const mouthPath =
    tone < 40
      ? "M 28 54 Q 40 62 52 54" // smile
      : tone < 70
        ? "M 28 56 L 52 56"     // neutral
        : "M 28 58 Q 40 50 52 58"; // slight frown

  const faceColor = "var(--accent)";
  const eyeColor = "var(--bg)";

  return (
    <div className="flex flex-col items-center gap-3">
      {/* SVG mascot */}
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        aria-hidden="true"
        style={{ transition: "all 0.4s ease" }}
      >
        {/* Body */}
        <circle cx="40" cy="40" r="34" fill={faceColor} opacity="0.15" />
        {/* Face */}
        <circle cx="40" cy="40" r="26" fill={faceColor} />
        {/* Left eye */}
        <ellipse cx="30" cy="36" rx={eyeRx} ry={eyeRy} fill={eyeColor} />
        {/* Right eye */}
        <ellipse cx="50" cy="36" rx={eyeRx} ry={eyeRy} fill={eyeColor} />
        {/* Mouth */}
        <path d={mouthPath} stroke={eyeColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </svg>

      {/* Speech bubble */}
      <div
        className="relative px-4 py-2 text-sm text-center max-w-[180px] leading-snug"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-card)",
          color: "var(--text-primary)",
          transition: "all 0.3s ease",
        }}
      >
        {/* Bubble tail */}
        <span
          aria-hidden
          className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "7px solid transparent",
            borderRight: "7px solid transparent",
            borderBottom: "8px solid var(--border)",
          }}
        />
        <span
          aria-hidden
          className="absolute -top-[7px] left-1/2 -translate-x-1/2 w-0 h-0"
          style={{
            borderLeft: "6px solid transparent",
            borderRight: "6px solid transparent",
            borderBottom: "7px solid var(--surface)",
          }}
        />
        {MESSAGES[state]}
      </div>
    </div>
  );
}
