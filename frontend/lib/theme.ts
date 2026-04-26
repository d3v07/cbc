export interface ThemeVars {
  "--bg": string;
  "--surface": string;
  "--border": string;
  "--text-primary": string;
  "--text-muted": string;
  "--accent": string;
  "--accent-soft": string;
  "--radius-card": string;
  "--radius-btn": string;
}

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpHex(from: string, to: string, t: number): string {
  const f = parseInt(from.slice(1), 16);
  const tHex = parseInt(to.slice(1), 16);
  const r = lerp((f >> 16) & 0xff, (tHex >> 16) & 0xff, t);
  const g = lerp((f >> 8) & 0xff, (tHex >> 8) & 0xff, t);
  const b = lerp(f & 0xff, tHex & 0xff, t);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// tone: 0=Soft/Cute, 100=Gothic/Edge
// warmth: 0=Feminine (lighter), 100=Masculine (heavier/denser)
export function themeToVars(tone: number, warmth: number): ThemeVars {
  const t = tone / 100;
  const w = warmth / 100;

  // Soft end: warm parchment → Gothic end: deep cosmic purple (Figma inspiration)
  const bg = lerpHex("#FAF7F2", "#0E0B1F", t);
  const surface = lerpHex("#F2EDE4", "#1A1435", t);
  const border = lerpHex("#E0D8CC", "#2D2255", t);
  const textPrimary = lerpHex("#2C2420", "#F0ECF9", t);
  const textMuted = lerpHex("#7A6E66", "#9B8BC4", t);
  // Accent: terracotta → warm amber (pops against dark purple)
  const accent = lerpHex("#D4956A", "#EF9F27", w);
  const accentSoft = lerpHex("#FDE8B8", "#3D2200", t);

  const radiusCard = t < 0.5 ? "1rem" : "0";
  const radiusBtn = t < 0.5 ? "9999px" : "2px";

  return {
    "--bg": bg,
    "--surface": surface,
    "--border": border,
    "--text-primary": textPrimary,
    "--text-muted": textMuted,
    "--accent": accent,
    "--accent-soft": accentSoft,
    "--radius-card": radiusCard,
    "--radius-btn": radiusBtn,
  };
}

export function applyTheme(tone: number, warmth: number): void {
  if (typeof document === "undefined") return;
  const vars = themeToVars(tone, warmth);
  const root = document.documentElement;
  for (const [key, value] of Object.entries(vars)) {
    root.style.setProperty(key, value);
  }
  // Font class swap at midpoint
  if (tone >= 50) {
    root.classList.add("theme-edge");
    root.classList.remove("theme-soft");
  } else {
    root.classList.add("theme-soft");
    root.classList.remove("theme-edge");
  }
}
