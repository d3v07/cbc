import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SCRIPT } from "@/lib/demo";

export const runtime = "nodejs";

// Stub-mode contract — kept in sync with the real Haiku 4.5 route that
// will land in #6/#9. The stub validates input the same way so caller-side
// schema mistakes surface during stub development, not in production.
const Body = z
  .object({
    guide_id: z.string().regex(/^[A-Za-z0-9_-]{3,64}$/, "guide_id must be 3-64 chars [A-Za-z0-9_-]"),
    form: z.enum(["poem", "letter"]).optional(),
    turns: z
      .array(
        z.object({
          id: z.string(),
          role: z.string(),
          text: z.string().max(2000),
        }),
      )
      .max(40)
      .optional(),
  })
  .partial()
  .optional();

/**
 * POST /api/spine — Spine extractor (stub).
 *
 * Sprint-1 (this branch): returns the canonical eulogy SCRIPT's spine
 * candidates + structure regardless of input.
 *
 * Sprint-2 contract:
 *   request:  { turns: Turn[]; guide_id: string; form: Form }
 *   response: { candidates: DemoSpineCandidate[]; structure: DemoStructureMovement[] }
 *
 * Real implementation = Haiku 4.5 returning verbatim substrings of the
 * user-typed turns + a structure proposal calibrated to the active form.
 */
export async function POST(req: NextRequest): Promise<Response> {
  // Validate when a body is provided (caller mistake catcher); accept the
  // empty/no-body case for now since dev callers may not send anything.
  const text = await req.text();
  if (text.trim().length > 0) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
    }
    const result = Body.safeParse(parsed);
    if (!result.success) {
      return NextResponse.json(
        { error: "invalid body", issues: result.error.flatten() },
        { status: 400 },
      );
    }
  }

  return NextResponse.json(
    {
      stub: true,
      candidates: SCRIPT.spineCandidates,
      structure: SCRIPT.structure,
    },
    { headers: { "X-Mean-It-Stub": "1" } },
  );
}
