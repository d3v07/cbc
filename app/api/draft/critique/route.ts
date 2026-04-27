import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { anthropicForKey } from "@/lib/anthropic";
import { keyOriginTag, readKey } from "@/lib/byo-key/server";
import { loadBuiltInGuides } from "@/lib/guides/loader";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────── Schemas ───────────

const CLICHE_PATTERNS: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  {
    pattern: /forever in our hearts/i,
    reason:
      '"forever in our hearts" is a stock phrase. you noticed garlic on a pillow — keep going specific.',
  },
  {
    pattern: /light of my life/i,
    reason:
      '"light of my life" is borrowed warmth. what specifically did her presence change?',
  },
  {
    pattern: /gone too soon/i,
    reason:
      '"gone too soon" is a cliché. when exactly do you miss her? at what moment of the day?',
  },
  {
    pattern: /will be missed/i,
    reason:
      '"will be missed" is passive — it lets the writer off the hook. who specifically is missing what?',
  },
];

// `draft.max(5000)` caps the input so the O(n²) longestSharedRun helper
// can't be weaponized as a CPU saturation vector on this unauthenticated
// stub. The same cap applies to the upstream payload in real mode.
// `turns.max` mirrors that intent for the user-turn corpus.
const Body = z.object({
  draft: z.string().min(1).max(5000),
  turns: z
    .array(
      z.object({
        id: z.string(),
        role: z.string(),
        text: z.string().max(2000),
      }),
    )
    .max(40)
    .default([]),
  guide_id: z
    .string()
    .regex(/^[A-Za-z0-9_-]{3,64}$/, "guide_id must be 3-64 chars [A-Za-z0-9_-]"),
  theme: z.enum(["cute", "warm", "quiet", "noir", "gothic"]).optional(),
});

interface CritiqueCard {
  kind: "cliche" | "question" | "verified";
  line_ref?: string;
  body: string;
}

// ─────────── Memoized guide load ───────────

let guidesCache: ReturnType<typeof loadBuiltInGuides> | null = null;
function getBuiltInGuides() {
  if (!guidesCache) {
    guidesCache = loadBuiltInGuides(
      path.join(process.cwd(), "prompts", "guides"),
    );
  }
  return guidesCache;
}

// ─────────── SSE helpers ───────────

const ENCODER = new TextEncoder();
function sseFrame(event: string, data: unknown): Uint8Array {
  return ENCODER.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ─────────── POST handler ───────────

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const keyOrigin = keyOriginTag(req);
  const key = readKey(req);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "expected JSON body" },
      { status: 400 },
    );
  }

  const parsed = Body.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Stub mode: keep the existing JSON contract for dev DX.
  if (keyOrigin === "missing" || !key) {
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

  // Real mode: stream Sonnet's critique cards as SSE.
  return realCritiqueResponse(requestId, keyOrigin, parsed.data, key);
}

// ─────────── Stub critique ───────────

function buildCannedCritique(
  draft: string,
  turns: ReadonlyArray<{ id: string; role: string; text: string }>,
): CritiqueCard[] {
  const cards: CritiqueCard[] = [];

  for (const { pattern, reason } of CLICHE_PATTERNS) {
    const m = draft.match(pattern);
    if (m) {
      cards.push({ kind: "cliche", line_ref: m[0], body: reason });
      break;
    }
  }

  if (/\bsimpler\b/i.test(draft)) {
    cards.push({
      kind: "question",
      line_ref: "simpler",
      body: '"simpler" — did you mean simpler, or quieter? both are yours, just choose.',
    });
  }

  const userText = turns
    .filter((t) => t.role === "user")
    .map((t) => t.text)
    .join(" ");
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

function longestSharedRun(
  a: string,
  b: string,
  minWords: number,
): string | null {
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

// ─────────── Real critique (Sonnet 4.6 SSE) ───────────

async function realCritiqueResponse(
  requestId: string,
  keyOrigin: "byo" | "env",
  data: z.infer<typeof Body>,
  key: string,
): Promise<Response> {
  const guide = getBuiltInGuides().find((g) => g.id === data.guide_id);
  if (!guide) {
    return NextResponse.json(
      { error: `unknown guide_id: ${data.guide_id}` },
      { status: 404 },
    );
  }

  const userTurns = data.turns
    .filter((t) => t.role === "user")
    .map((t) => `[${t.id}] ${t.text}`)
    .join("\n\n");
  const themeBlock = data.theme ? `Theme: ${data.theme}.` : "";

  const systemText = [
    `You are a creative critic working with the guide ${guide.name}.`,
    "The user is drafting a piece based on their interview turns. Read their draft and produce 1-4 critique cards.",
    "",
    "There are exactly THREE card kinds:",
    '- "cliche" — a stock phrase, borrowed sentiment ("forever in our hearts", "light of my life", "gone too soon"). Suggest cutting; gesture at the user\'s own specifics.',
    '- "question" — a real ambiguity in the draft. ("did you mean X or Y? both are yours, just pick one")',
    '- "verified" — a line lifted directly from the user\'s interview turns. Positive reinforcement; encourage keeping.',
    "",
    "RULES",
    "- You may not draft any line in the artifact's register. No example replacements. No 'try writing it like this'.",
    "- Flag, ask, or affirm. That is all.",
    "- Output one card per record_critique_card tool call. Up to 4 calls total. Order: most important first.",
    "- Skip a card kind entirely if there's nothing legitimate to say about it.",
    "",
    themeBlock,
  ]
    .filter(Boolean)
    .join("\n");

  const tools: Anthropic.Tool[] = [
    {
      name: "record_critique_card",
      description:
        "Record one critique card. Call multiple times — once per card. Up to 4 cards total.",
      input_schema: {
        type: "object" as const,
        properties: {
          kind: {
            type: "string",
            enum: ["cliche", "question", "verified"],
          },
          line_ref: {
            type: "string",
            description:
              "The specific text from the draft this card refers to. Optional.",
          },
          body: {
            type: "string",
            description: "The critique text shown to the user.",
          },
        },
        required: ["kind", "body"],
      },
    },
  ];

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const client = anthropicForKey(key);
        const ms = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: systemText,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages: [
            {
              role: "user",
              content: `User's interview turns:\n\n${userTurns || "(no turns yet)"}\n\nDraft so far:\n\n${data.draft}\n\nProduce critique cards via the record_critique_card tool.`,
            },
          ],
          tools,
        });

        const finalMessage = await ms.finalMessage();

        let cardCount = 0;
        for (const block of finalMessage.content) {
          if (
            block.type === "tool_use" &&
            block.name === "record_critique_card"
          ) {
            const input = block.input as {
              kind?: unknown;
              line_ref?: unknown;
              body?: unknown;
            };
            const kind =
              input.kind === "cliche" ||
              input.kind === "question" ||
              input.kind === "verified"
                ? input.kind
                : null;
            const body =
              typeof input.body === "string" ? input.body : null;
            if (kind && body) {
              controller.enqueue(
                sseFrame("card", {
                  kind,
                  line_ref:
                    typeof input.line_ref === "string"
                      ? input.line_ref
                      : null,
                  body,
                }),
              );
              cardCount++;
            }
          }
        }

        if (finalMessage.usage) {
          log.info("draft.critique.usage", {
            request_id: requestId,
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
            cache_read_input_tokens:
              finalMessage.usage.cache_read_input_tokens ?? 0,
            cache_creation_input_tokens:
              finalMessage.usage.cache_creation_input_tokens ?? 0,
          });
        }

        log.info("draft.critique.ok", {
          request_id: requestId,
          guide_id: data.guide_id,
          key_origin: keyOrigin,
          card_count: cardCount,
        });

        controller.enqueue(sseFrame("done", {}));
        controller.close();
      } catch (err) {
        log.error("draft.critique.failed", {
          request_id: requestId,
          error: err instanceof Error ? err.message : String(err),
        });
        controller.enqueue(
          sseFrame("error", { message: "critique failed" }),
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Request-Id": requestId,
    },
  });
}
