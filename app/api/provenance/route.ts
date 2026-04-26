import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { log } from "@/lib/logger";
import { matchProvenance } from "@/lib/provenance/match";

export const runtime = "nodejs";

const TurnInputSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1).optional(),
  role: z.enum(["guide", "user"]),
  text: z.string().max(8000),
  ts: z.number().int().optional(),
  phrases_held: z.array(z.string()).optional(),
});

const Body = z.object({
  artifact: z.string().max(20000),
  turns: z.array(TurnInputSchema).max(60),
});

/**
 * POST /api/provenance — deterministic provenance matcher.
 *
 * Input:  { artifact: string; turns: Turn[] }
 * Output: { provenance: ProvenanceLine[]; byline_pct: number }
 *
 * No model. No key required. Pure compute over the artifact and the
 * user-typed turns.
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

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Provide defaults for optional Turn fields the matcher doesn't read.
  const turns = parsed.data.turns.map((t) => ({
    id: t.id,
    session_id: t.session_id ?? "session",
    role: t.role,
    text: t.text,
    ts: t.ts ?? 0,
    phrases_held: t.phrases_held,
  }));

  const result = matchProvenance(parsed.data.artifact, turns);

  log.info("provenance.ok", {
    request_id: requestId,
    line_count: result.provenance.length,
    byline_pct: result.byline_pct,
  });

  return NextResponse.json(result);
}
