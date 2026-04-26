import { loadBuiltInGuides } from "@/lib/guides/loader";
import { App } from "@/components/App";
import path from "node:path";
import type { Guide } from "@/lib/guides/schema";

export default function Page() {
  const guidesPath = path.join(process.cwd(), "prompts", "guides");
  let guides: Guide[] = [];
  try {
    guides = loadBuiltInGuides(guidesPath);
  } catch(e) {
    console.error("Failed to load guides:", e);
  }

  return <App guides={guides} />;
}
