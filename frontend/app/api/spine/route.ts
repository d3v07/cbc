import { NextResponse } from "next/server";
import { SCRIPT } from "@/lib/demo";

export const runtime = "nodejs";

/**
 * POST /api/spine — Spine extractor (stub).
 *
 * Sprint-1 (this branch): returns the canonical eulogy SCRIPT's spine
 * candidates + structure. Ignores the request body.
 *
 * Sprint-2 contract:
 *   request:  { turns: Turn[]; guide_id: string; form: Form }
 *   response: { candidates: DemoSpineCandidate[]; structure: DemoStructureMovement[] }
 *
 * Real implementation = Haiku 4.5 returning verbatim substrings of the
 * user-typed turns + a structure proposal calibrated to the active form.
 */
export async function POST(): Promise<Response> {
  return NextResponse.json(
    {
      candidates: SCRIPT.spineCandidates,
      structure: SCRIPT.structure,
    },
    { headers: { "X-Mean-It-Stub": "1" } },
  );
}
