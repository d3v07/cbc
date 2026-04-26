"use client";

const SAMPLE = `The last time I saw her,
she was standing at the kitchen window,
watching the light do what it always did
in October — thin and particular,
like it had somewhere else to be.`;

interface Props {
  tone: number;
}

export function ArtifactPreview({ tone }: Props) {
  return (
    <div
      aria-label="Live artifact preview"
      style={{
        padding: "1.25rem",
        borderRadius: "var(--radius-card)",
        border: "1px solid var(--border)",
        background: "var(--surface)",
        transition: "all 0.3s ease",
      }}
    >
      <p
        style={{
          fontSize: "0.7rem",
          fontWeight: 500,
          letterSpacing: "0.07em",
          textTransform: "uppercase",
          color: "var(--text-muted)",
          marginBottom: "0.875rem",
        }}
      >
        Preview
      </p>
      <p
        className="font-serif"
        style={{
          fontSize: tone < 50 ? "1rem" : "0.9375rem",
          lineHeight: tone < 50 ? 1.85 : 1.65,
          color: "var(--text-primary)",
          whiteSpace: "pre-line",
          letterSpacing: tone >= 50 ? "0.01em" : "0",
          transition: "all 0.35s ease",
        }}
      >
        {SAMPLE}
      </p>
    </div>
  );
}
