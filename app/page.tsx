import path from "node:path";
import { App } from "@/components/App";
import { loadBuiltInGuides } from "@/lib/guides/loader";
import type { Guide } from "@/lib/guides/schema";
import { log } from "@/lib/logger";
import { decodeBase64UrlGuide } from "@/lib/share/decode";

// Server component: load guides off disk at request time, hand them to the
// client island. If `?guide=<payload>` is present, decode it server-side
// and prepend to the picker as a `source: "shared"` guide.

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ guide?: string | string[] }>;
}) {
  const guidesPath = path.join(process.cwd(), "prompts", "guides");
  let guides: Guide[] = [];
  try {
    guides = loadBuiltInGuides(guidesPath);
  } catch (err) {
    log.error("page.guides.load_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
  }

  const params = await searchParams;
  const sharedParam = Array.isArray(params.guide)
    ? params.guide[0]
    : params.guide;
  if (typeof sharedParam === "string" && sharedParam.length > 0) {
    const decoded = decodeBase64UrlGuide(sharedParam);
    if (decoded.ok) {
      // Prepend so the imported guide is the first card in the picker.
      guides = [decoded.guide, ...guides];
      log.info("page.shared_guide.imported", {
        guide_id: decoded.guide.id,
        name: decoded.guide.name,
      });
    } else {
      log.warn("page.shared_guide.invalid", { error: decoded.error });
    }
  }

  return <App guides={guides} />;
}
