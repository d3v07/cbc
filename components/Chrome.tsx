"use client";

import { actions, type Step, useAppStore } from "@/lib/store";
import { ThemeSlider } from "./ThemeSlider";

const CORE_STEPS: Array<{ step: Step; label: string }> = [
  { step: "moment", label: "Moment" },
  { step: "guide", label: "Guide" },
  { step: "interview", label: "Interview" },
  { step: "spine", label: "Spine" },
  { step: "drafting", label: "Drafting" },
  { step: "render", label: "Render" },
];

export function Chrome() {
  const [{ step }, dispatch] = useAppStore();

  return (
    <header className="chrome">
      <div className="left flex items-center gap-4">
        <div className="logo">
          Mean It<span className="logo-dot" />
        </div>
        <div className="crumbs">
          {CORE_STEPS.map((item, index) => (
            <span key={item.step} className="inline-flex items-center gap-2">
              {index > 0 && <span className="muted">/</span>}
              <button
                type="button"
                className={`crumb ${step === item.step ? "now" : "muted"}`}
                onClick={() => dispatch(actions.setStep(item.step))}
              >
                {item.label}
              </button>
            </span>
          ))}
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
