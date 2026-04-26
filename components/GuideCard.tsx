import type { GuideStub } from "@/types";

interface Props {
  guide: GuideStub;
  selected: boolean;
  onSelect: (id: string) => void;
  vibe?: number;
}

export function GuideCard({ guide, selected, onSelect, vibe = 25 }: Props) {
  const borderRadius = vibe < 50 ? "28px" : `${28 - (vibe - 50) * 0.4}px`;

  return (
    <button
      type="button"
      onClick={() => onSelect(guide.id)}
      aria-pressed={selected}
      className="group relative overflow-hidden transition-all duration-500 hover:scale-105 text-left"
      style={{
        borderRadius,
        padding: "28px",
        background:
          vibe < 50
            ? "rgba(255, 255, 255, 0.95)"
            : "rgba(30, 20, 40, 0.7)",
        border: selected
          ? vibe < 50
            ? "3px solid #FF69B4"
            : "3px solid #8B5CF6"
          : vibe < 50
            ? "2px solid rgba(255, 182, 193, 0.4)"
            : "2px solid rgba(139, 92, 246, 0.4)",
        backdropFilter: "blur(12px)",
        boxShadow: selected
          ? `0 12px 30px ${vibe < 50 ? "rgba(255, 105, 180, 0.5)" : "rgba(139, 92, 246, 0.5)"}`
          : `0 4px 12px ${vibe < 50 ? "rgba(0, 0, 0, 0.05)" : "rgba(0, 0, 0, 0.3)"}`,
        cursor: "pointer",
        width: "100%",
        transition: "all 0.5s ease",
      }}
    >
      {selected && (
        <div
          className="absolute top-2 right-2 transition-all duration-500"
          style={{ fontSize: "24px" }}
        >
          {vibe < 50 ? "✨" : "⭐"}
        </div>
      )}

      {/* Guide name */}
      <p
        className="mb-3 transition-all duration-500"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: vibe < 50 ? "20px" : "19px",
          color: vibe < 50 ? "#FF69B4" : "#A78BFA",
          fontWeight: vibe < 50 ? 500 : 700,
          letterSpacing: vibe < 50 ? "0.3px" : "0.8px",
          lineHeight: 1.3,
        }}
      >
        {guide.name}
      </p>

      {/* Description */}
      <p
        className="mb-4 transition-all duration-500"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "14px",
          color: vibe < 50 ? "#78766F" : "#D8B4FE",
          lineHeight: "1.6",
        }}
      >
        {guide.description}
      </p>

      {/* Tone tag */}
      <span
        className="inline-block transition-all duration-500"
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "13px",
          padding: "6px 16px",
          borderRadius: vibe < 50 ? "20px" : "8px",
          background:
            vibe < 50
              ? "linear-gradient(135deg, #FFB6C1, #FFC0CB)"
              : "linear-gradient(135deg, #6B46C1, #8B5CF6)",
          color: "white",
          fontWeight: 500,
        }}
      >
        {guide.tone_tag}
      </span>

      {/* Best for tags */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {guide.best_for.slice(0, 3).map((tag) => (
          <span
            key={tag}
            style={{
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.04em",
              padding: "3px 10px",
              borderRadius: vibe < 50 ? "12px" : "4px",
              background:
                vibe < 50
                  ? "rgba(255, 182, 193, 0.2)"
                  : "rgba(139, 92, 246, 0.2)",
              border: `1px solid ${vibe < 50 ? "rgba(255, 105, 180, 0.3)" : "rgba(139, 92, 246, 0.3)"}`,
              color: vibe < 50 ? "#FF69B4" : "#A78BFA",
            }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Glow effect when selected */}
      {selected && (
        <div
          className="absolute inset-0 -z-10 opacity-20 blur-2xl transition-all duration-500"
          style={{
            background:
              vibe < 50
                ? "radial-gradient(circle at center, #FF69B4, transparent)"
                : "radial-gradient(circle at center, #8B5CF6, transparent)",
          }}
        />
      )}
    </button>
  );
}
