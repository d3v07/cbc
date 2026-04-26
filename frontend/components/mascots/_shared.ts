import type { SVGProps } from "react";

// CSS-var refs resolved at render time by `theme.css`.
export const STROKE = "var(--t-ink)";
export const ACCENT = "var(--t-accent)";

export const ink = (
  extra: Partial<SVGProps<SVGPathElement>> = {},
): SVGProps<SVGPathElement> => ({
  fill: "none",
  stroke: STROKE,
  strokeWidth: 1.4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  ...extra,
});
