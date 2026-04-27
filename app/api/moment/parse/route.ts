import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

// Stub. Real impl in Sprint 2 calls Sonnet to parse the user's natural-
// language describe-the-moment into structured pills.
const Body = z
  .object({
    text: z.string().min(1).max(2000),
  })
  .optional();

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (raw.trim().length > 0) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
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
      recipient: "Mom",
      occasion: "Birthday",
      when: "Tomorrow",
      tone: "Warm",
    },
    { headers: { "X-Mean-It-Stub": "1" } },
  );
}
