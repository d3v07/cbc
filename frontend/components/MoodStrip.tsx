"use client";

const OCCASION_MAP: Record<
  string,
  { adjective: string; words: string[]; swatches: [string, string, string] }
> = {
  birthday:    { adjective: "Celebratory", words: ["joy", "memory", "light", "years"],       swatches: ["#FDE8B8", "#EF9F27", "#BA7517"] },
  anniversary: { adjective: "Devoted",     words: ["time", "warmth", "still", "here"],       swatches: ["#FDE8B8", "#D98C1A", "#8B4513"] },
  love_letter: { adjective: "Tender",      words: ["longing", "close", "truth", "yours"],    swatches: ["#FFE4E1", "#E8927C", "#C0392B"] },
  apology:     { adjective: "Honest",      words: ["sorry", "weight", "undo", "again"],      swatches: ["#E8EAF6", "#7986CB", "#3949AB"] },
  gratitude:   { adjective: "Warm",        words: ["seen", "given", "gratitude", "you"],     swatches: ["#FFF8E1", "#FFD54F", "#F9A825"] },
  eulogy:      { adjective: "Reverent",    words: ["voice", "mornings", "always", "loss"],   swatches: ["#ECEFF1", "#90A4AE", "#546E7A"] },
  memorial:    { adjective: "Tender",      words: ["light", "quiet", "held", "gone"],        swatches: ["#F3E5F5", "#CE93D8", "#8E24AA"] },
  retirement:  { adjective: "Gracious",    words: ["decades", "craft", "earned", "next"],    swatches: ["#E8F5E9", "#81C784", "#388E3C"] },
  family_story:{ adjective: "Rooted",      words: ["table", "voices", "home", "told"],       swatches: ["#FFF3E0", "#FFCC80", "#EF6C00"] },
  just_because:{ adjective: "Spontaneous", words: ["today", "enough", "notice", "simple"],   swatches: ["#FDE8B8", "#EF9F27", "#BA7517"] },
};

const DEFAULT = {
  adjective: "Thoughtful",
  words: ["warmth", "memory", "gratitude", "future"],
  swatches: ["#FAF8F4", "#D3D1C7", "#7A6E66"] as [string, string, string],
};

interface Props {
  occasion: string;
  recipient: string;
  form: "poem" | "letter";
}

export function MoodStrip({ occasion }: Props) {
  const mood = OCCASION_MAP[occasion] ?? DEFAULT;

  return (
    <div
      style={{
        width: "100%",
        height: "64px",
        background: "var(--bg)",
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        display: "flex",
        alignItems: "center",
        gap: "1.25rem",
        padding: "0 1.5rem",
        transition: "all 0.2s ease",
      }}
    >
      {/* Swatch row */}
      <div className="flex gap-1.5 shrink-0">
        {mood.swatches.map((color, i) => (
          <span
            key={i}
            style={{
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: color,
              border: "1px solid var(--border)",
              display: "inline-block",
              transition: "background 0.2s ease",
            }}
          />
        ))}
      </div>

      {/* Adjective */}
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          flexShrink: 0,
          transition: "all 0.2s ease",
        }}
      >
        {mood.adjective}
      </span>

      {/* Divider */}
      <span style={{ color: "var(--border)", fontSize: "1rem" }}>·</span>

      {/* Word cloud */}
      <span
        style={{
          fontSize: "0.8125rem",
          color: "var(--text-muted)",
          transition: "all 0.2s ease",
        }}
      >
        {mood.words.join(" · ")}
      </span>
    </div>
  );
}
