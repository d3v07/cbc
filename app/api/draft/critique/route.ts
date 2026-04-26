import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { keyOriginTag, readKey } from "@/lib/byo-key/server";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Canned critique cards for the v1 stub. Three buckets per Drafting_A
// wireframe: cliché flag, question, verified-yours. Real Sonnet 4.6 critic
// ships in #9.

const CLICHE_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  { pattern: /forever in our hearts/i, reason: '"forever in our hearts" is a stock phrase. you noticed garlic on a pillow — keep going specific.' },
  { pattern: /light of my life/i, reason: '"light of my life" is borrowed warmth. what specifically did her presence change?' },
  { pattern: /gone too soon/i, reason: '"gone too soon" is a cliché. when exactly do you miss her? at what moment of the day?' },
  { pattern: /will be missed/i, reason: '"will be missed" is passive — it lets the writer off the hook. who specifically is missing what?' },
];

// `draft.max(5000)` caps the input so the O(n²) longestSharedRun helper
// can't be weaponized as a CPU saturation vector on this unauthenticated
// stub. Real critic in #9 uses Sonnet 4.6 — same cap will apply on the
// upstream payload. `turns.max` mirrors that intent for the user-turn corpus.
const Body = z.object({
  draft: z.string().min(1).max(5000),
  turns: z
    .array(z.object({ id: z.string(), role: z.string(), text: z.string().max(2000) }))
    .max(40)
    .default([]),
  guide_id: z.string().regex(/^[A-Za-z0-9_-]{3,64}$/, "guide_id must be 3-64 chars [A-Za-z0-9_-]"),
  theme: z.enum(["cute", "warm", "quiet", "noir", "gothic"]).optional(),
});

interface CritiqueCard {
  kind: "cliche" | "question" | "verified";
  line_ref?: string;
  body: string;
}

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

  const cards = buildCannedCritique(parsed.data.draft, parsed.data.turns);
  log.info("draft.critique.stub", {
    request_id: requestId,
    key_origin: keyOrigin,
    has_key: Boolean(key),
    cards: cards.length,
    guide_id: parsed.data.guide_id,
  });

  return NextResponse.json({ stub: true, cards });
}

function buildCannedCritique(
  draft: string,
  turns: ReadonlyArray<{ id: string; role: string; text: string }>,
): CritiqueCard[] {
  const cards: CritiqueCard[] = [];

  for (const { pattern, reason } of CLICHE_PATTERNS) {
    const m = draft.match(pattern);
    if (m) {
      cards.push({ kind: "cliche", line_ref: m[0], body: reason });
      break; // one cliché flag per pass keeps the right pane focused
    }
  }

  if (/\bsimpler\b/i.test(draft)) {
    cards.push({
      kind: "question",
      line_ref: "simpler",
      body: '"simpler" — did you mean simpler, or quieter? both are yours, just choose.',
    });
  }

  // Naive verified-yours: surface the longest user-turn substring also in the
  // draft. Real provenance matcher (#9) replaces this.
  const userText = turns
    .filter((t) => t.role === "user")
    .map((t) => t.text)
    .join(" ");
  // 6 words ≈ a poem line; tuned for stub-mode noise vs signal. Real
  // provenance matcher in #9 uses edit-distance, not a hard word floor.
  const verbatim = longestSharedRun(draft, userText, 6);
  if (verbatim) {
    cards.push({
      kind: "verified",
      line_ref: verbatim,
      body: `"${verbatim}" — direct from your interview. keep it.`,
    });
  }

  if (cards.length === 0) {
    cards.push({
      kind: "question",
      body: "the draft reads clean so far. read it aloud — does any line sound like someone else's?",
    });
  }

  return cards;
}

function longestSharedRun(a: string, b: string, minWords: number): string | null {
  if (!a || !b) return null;
  const aWords = a.split(/\s+/);
  for (let len = aWords.length; len >= minWords; len--) {
    for (let i = 0; i + len <= aWords.length; i++) {
      const candidate = aWords.slice(i, i + len).join(" ");
      const stripped = candidate.replace(/[.,;:!?]+$/, "");
      if (stripped.length >= 8 && b.includes(stripped)) return stripped;
    }
  }
  return null;
}
