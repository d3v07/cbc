interface BylineMeterProps {
  pct: number;
  lines?: number;
}

interface Tier {
  glyph: string;
  color: string;
  label: string;
}

function tierFor(pct: number): Tier {
  if (pct >= 90) {
    return { glyph: "✓", color: "var(--t-verified)", label: "verified" };
  }
  if (pct >= 70) {
    return { glyph: "◐", color: "var(--t-highlight)", label: "partial" };
  }
  return { glyph: "⚠", color: "var(--t-accent)", label: "low" };
}

/**
 * Byline meter — shows the % of artifact words that came verbatim from
 * the user's interview turns. Color band PLUS iconography per #26
 * accessibility constraint (not color-only). Uses an aria-label so
 * screen readers get the full meaning even with the icon hidden.
 */
export function BylineMeter({ pct, lines }: BylineMeterProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  const t = tierFor(clamped);
  const linesPart = lines !== undefined ? ` · ${lines} lines` : "";

  return (
    <div
      role="status"
      aria-label={`${clamped} percent verified yours${
        lines !== undefined ? `, ${lines} lines` : ""
      } (${t.label})`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontFamily: "var(--t-mono)",
        fontSize: 11,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "var(--t-ink-soft)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: t.color,
          color: "var(--t-paper)",
          fontFamily: "var(--t-display)",
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        {t.glyph}
      </span>
      <span style={{ color: "var(--t-ink)" }}>{clamped}% verified yours</span>
      {lines !== undefined && (
        <span style={{ color: "var(--t-ink-faint)" }}>{linesPart}</span>
      )}
    </div>
  );
}
