import path from "node:path";
import { App } from "@/components/App";
import { loadBuiltInGuides } from "@/lib/guides/loader";
import { log } from "@/lib/logger";
import type { Guide } from "@/lib/guides/schema";

// Server component: load guides off disk at request time, hand them to the
// client island. `loadBuiltInGuides` is filesystem-backed so this can't run
// in a client component.
export default function Page() {
  const guidesPath = path.join(process.cwd(), "prompts", "guides");
  let guides: Guide[] = [];
  try {
    guides = loadBuiltInGuides(guidesPath);
  } catch (err) {
    log.error("page.guides.load_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }
  return <App guides={guides} />;
}
