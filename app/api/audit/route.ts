import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { anthropicForKey } from "@/lib/anthropic";
import { keyOriginTag, readKey } from "@/lib/byo-key/server";
import { loadBuiltInGuides } from "@/lib/guides/loader";
import { runAudit } from "@/lib/interview/audit-middleware";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const Body = z.object({
  message: z.string().min(1).max(8000),
  guide_id: z
    .string()
    .regex(/^[A-Za-z0-9_-]{3,64}$/, "guide_id must be 3-64 chars [A-Za-z0-9_-]"),
});

let guidesCache: ReturnType<typeof loadBuiltInGuides> | null = null;
function getBuiltInGuides() {
  if (!guidesCache) {
    guidesCache = loadBuiltInGuides(
      path.join(process.cwd(), "prompts", "guides"),
    );
  }
  return guidesCache;
}

/**
 * POST /api/audit — flag-driven ghostwriter audit.
 *
 * Stub mode (no key): returns `{ stub: true, flags_tripped: [], reason: "" }`
 * so dev DX isn't regressed. Real mode runs Haiku 4.5 against the active
 * guide's `audit_flags` via `runAudit` from
 * `lib/interview/audit-middleware`.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const keyOrigin = keyOriginTag(req);
  const key = readKey(req);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected JSON body" },
      { status: 400 },
    );
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { message, guide_id } = parsed.data;
  const guide = getBuiltInGuides().find((g) => g.id === guide_id);
  if (!guide) {
    return NextResponse.json(
      { error: `unknown guide_id: ${guide_id}` },
      { status: 404 },
    );
  }

  if (!key || keyOrigin === "missing") {
    log.info("audit.stub", { request_id: requestId, key_origin: keyOrigin });
    return NextResponse.json({
      stub: true,
      flags_tripped: [],
      reason: "",
    });
  }

  const client = anthropicForKey(key);
  const result = await runAudit({ message, guide, client });

  log.info("audit.ok", {
    request_id: requestId,
    guide_id,
    flag_count: result.flags_tripped.length,
    blocked: !result.allow,
  });

  return NextResponse.json({
    flags_tripped: result.flags_tripped,
    reason: result.reason,
  });
}
