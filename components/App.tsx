"use client";

import { useAppStore } from "@/lib/store";
import { Chrome } from "./Chrome";
import { PickMoment } from "./screens/PickMoment";
import { GuidePicker } from "./screens/GuidePicker";
import { Interview } from "./screens/Interview";
import { Spine } from "./screens/Spine";
import { Render } from "./screens/Render";
import type { Guide } from "@/lib/guides/schema";

export function App({ guides }: { guides: Guide[] }) {
  const [{ step }] = useAppStore();

  return (
    <div className="app">
      <div className="grain" />
      <Chrome />
      <main>
        {step === "moment" && <PickMoment />}
        {step === "guide" && <GuidePicker guides={guides} />}
        {step === "interview" && <Interview />}
        {step === "spine" && <Spine />}
        {step === "drafting" && <div className="stage text-center">Drafting screen coming soon (Sprint 3).</div>}
        {step === "render" && <Render />}
      </main>
    </div>
  );
}
