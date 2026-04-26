import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { keyOriginTag, readKey } from "@/lib/byo-key/server";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Canned script for the v1 stub. Real Sonnet 4.6 interviewer ships in #6.
// Each entry is a question + an optional meta-note in the guide's voice.
const SCRIPT: ReadonlyArray<{ question: string; meta?: string }> = [
  {
    question: "What's a smell that means home, when you think of her?",
    meta: "the best small details are ones only one person knew.",
  },
  {
    question: "What did she always say when she answered the phone?",
  },
  {
    question: "What's a thing she did that nobody else would have done?",
    meta: "specifics over abstractions — a Tuesday, not 'her presence'.",
  },
  {
    question: "What hands do you remember? How did they hold things?",
  },
  { question: "What didn't you get to say?" },
];

const GUIDE_ID = z.string().regex(/^[A-Za-z0-9_-]{3,64}$/, "guide_id must be 3-64 chars [A-Za-z0-9_-]");

const Body = z.object({
  guide_id: GUIDE_ID,
  turn_index: z.number().int().min(0).default(0),
  user_text: z.string().max(8000).optional(),
  theme: z.enum(["cute", "warm", "quiet", "noir", "gothic"]).optional(),
});

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const keyOrigin = keyOriginTag(req);
  const key = readKey(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { guide_id, turn_index } = parsed.data;
  const i = Math.min(turn_index, SCRIPT.length - 1);
  const slot = SCRIPT[i]!;
  const phrasesHeld = parsed.data.user_text
    ? extractCandidatePhrases(parsed.data.user_text)
    : [];

  log.info("interview.turn.stub", {
    request_id: requestId,
    guide_id,
    turn_index: i,
    key_origin: keyOrigin,
    has_key: Boolean(key),
  });

  return NextResponse.json({
    stub: true,
    turn_index: i,
    is_last: i === SCRIPT.length - 1,
    question: slot.question,
    meta: slot.meta ?? null,
    phrases_held: phrasesHeld,
  });
}

// Pull short verbatim runs from the user's turn so the holding-pane in the
// interview UI has something to show. Real spine extractor (#6) replaces this.
function extractCandidatePhrases(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const sentences = cleaned.split(/[.!?]\s+/).filter((s) => s.length > 0);
  return sentences
    .filter((s) => s.split(" ").length >= 3 && s.split(" ").length <= 12)
    .slice(0, 2);
}
