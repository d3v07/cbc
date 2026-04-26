"use client";

import { useAppStore } from "@/lib/store";
import { ThemeSlider } from "./ThemeSlider";

export function Chrome() {
  const [{ step }] = useAppStore();

  return (
    <header className="chrome">
      <div className="left flex items-center gap-4">
        <div className="logo">
          Mean It<span className="logo-dot" />
        </div>
        <div className="crumbs">
          <span className={`crumb ${step === "moment" ? "now" : "muted"}`}>Start</span>
          <span className="muted">/</span>
          <span className={`crumb ${step === "guide" ? "now" : "muted"}`}>Guide</span>
          <span className="muted">/</span>
          <span className={`crumb ${["interview", "spine", "drafting", "render"].includes(step) ? "now" : "muted"}`}>Draft</span>
        </div>
      </div>
      
      <div className="right">
        <ThemeSlider />
        <div className="byline">
          <span className="byline-dot" />
          By Claude
        </div>
      </div>
    </header>
  );
}
