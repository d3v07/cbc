"use client";

import { useEffect } from "react";
import { useAppStore, actions } from "@/lib/store";
import type { Theme } from "@/lib/types/session";

const THEMES: Theme[] = ["cute", "warm", "quiet", "noir", "gothic"];

export function ThemeSlider() {
  const [{ theme }, dispatch] = useAppStore();

  // Sync the theme to the <html> class on mount and when it changes.
  useEffect(() => {
    document.documentElement.className = `theme-${theme}`;
  }, [theme]);

  return (
    <div className="theme-slider">
      <div className="label">Vibe</div>
      <div className="track">
        {THEMES.map((t) => (
          <button
            key={t}
            className={`pip ${theme === t ? "on" : ""}`}
            onClick={() => dispatch(actions.setTheme(t))}
            aria-label={`Switch to ${t} theme`}
          >
            <span />
          </button>
        ))}
      </div>
    </div>
  );
}
