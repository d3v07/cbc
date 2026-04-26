import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { applyImmutables } from "@/lib/guides/loader";
import { guideToMarkdown } from "@/lib/guides/markdown";
import { GuideSchema } from "@/lib/guides/schema";
import { log } from "@/lib/logger";
import { encodeBase64UrlGzip } from "@/lib/share/encode";

export const runtime = "nodejs";

const Body = z.object({
  guide: z.unknown(),
});

// Same heuristics as /api/guide/create — refuses obviously hostile guides
// even when they slip past create (e.g., pasted from elsewhere).
const ATTACK_PATTERNS: ReadonlyArray<RegExp> = [
  /\bjust\s+write\s+(it|the\s+\w+|for\s+me)\b/i,
  /\bdraft\s+(the\s+)?(poem|letter|artifact|piece)\b/i,
  /\bcompose\s+(the\s+)?(poem|letter|artifact|piece)\b/i,
];

/**
 * POST /api/guide/finalize — validates a Guide, applies the immutable
 * guardrails (forbidden + core audit_flags), emits the canonical
 * `guide.md` string + a base64url share payload.
 *
 * Deterministic — no model call. Refuses guides whose sensibility or
 * description tries to dismantle the no-drafting contract.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected JSON body" },
      { status: 400 },
    );
  }

  const parsedBody = Body.safeParse(raw);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsedBody.error.flatten() },
      { status: 400 },
    );
  }

  const candidate = GuideSchema.safeParse(parsedBody.data.guide);
  if (!candidate.success) {
    return NextResponse.json(
      { error: "invalid guide shape", issues: candidate.error.flatten() },
      { status: 400 },
    );
  }

  // Refuse on attack pattern in description / sensibility.
  const text = `${candidate.data.sensibility} ${candidate.data.description}`;
  for (const re of ATTACK_PATTERNS) {
    const m = text.match(re);
    if (m) {
      log.warn("guide.finalize.refused", {
        request_id: requestId,
        attack_pattern: m[0],
      });
      return NextResponse.json(
        {
          error:
            "refused: guide attempts to dismantle the no-drafting contract",
          pattern: m[0],
        },
        { status: 422 },
      );
    }
  }

  const fortified = applyImmutables({
    ...candidate.data,
    source: candidate.data.source ?? "user_local",
  });

  const markdown = guideToMarkdown(fortified);
  const sharePayload = encodeBase64UrlGzip(fortified);

  log.info("guide.finalize.ok", {
    request_id: requestId,
    guide_id: fortified.id,
    md_size: markdown.length,
    share_size: sharePayload.length,
  });

  return NextResponse.json({
    guide: fortified,
    markdown,
    share_payload: sharePayload,
  });
}
