import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { anthropicForKey } from "@/lib/anthropic";
import { keyOriginTag, readKey } from "@/lib/byo-key/server";
import { loadBuiltInGuides } from "@/lib/guides/loader";
import { assemblePrompt } from "@/lib/interview/assemble-prompt";
import { log } from "@/lib/logger";
import { verbatimOnly } from "@/lib/spine/validate";
import { FormSchema, ThemeSchema } from "@/lib/types/session";

// Edge would be ideal for streaming, but `loadBuiltInGuides` reads from
// disk via `node:fs`. Building a const-bundle of guides is out of scope
// for this PR — we accept Node runtime for now.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────── Schemas ───────────

const GUIDE_ID = z
  .string()
  .regex(/^[A-Za-z0-9_-]{3,64}$/, "guide_id must be 3-64 chars [A-Za-z0-9_-]");

const TurnSchema = z.object({
  id: z.string(),
  role: z.enum(["guide", "user"]),
  text: z.string().max(8000),
});

// Canonical shape per #6 / #26.
const Canonical = z.object({
  session: z.object({
    recipient: z.string().min(1),
    occasion: z.string().min(1),
    form: FormSchema,
  }),
  guide_id: GUIDE_ID,
  turns: z.array(TurnSchema).max(40),
  theme: ThemeSchema.optional(),
});

// Legacy stub shape preserved during transition. Existing dev callers
// (and the d3v07 stub tests) use this.
const Legacy = z.object({
  guide_id: GUIDE_ID,
  turn_index: z.number().int().min(0).default(0),
  user_text: z.string().max(8000).optional(),
  theme: ThemeSchema.optional(),
});

type CanonicalBody = z.infer<typeof Canonical>;
type LegacyBody = z.infer<typeof Legacy>;

// ─────────── Stub fallback ───────────

const STUB_SCRIPT: ReadonlyArray<{ question: string; meta?: string }> = [
  {
    question: "What's a smell that means home, when you think of her?",
    meta: "the best small details are ones only one person knew.",
  },
  { question: "What did she always say when she answered the phone?" },
  {
    question: "What's a thing she did that nobody else would have done?",
    meta: "specifics over abstractions — a Tuesday, not 'her presence'.",
  },
  { question: "What hands do you remember? How did they hold things?" },
  { question: "What didn't you get to say?" },
];

function stubExtractCandidatePhrases(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [];
  const sentences = cleaned.split(/[.!?]\s+/).filter((s) => s.length > 0);
  return sentences
    .filter((s) => {
      const wc = s.split(" ").length;
      return wc >= 3 && wc <= 12;
    })
    .slice(0, 2);
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

  const canonical = Canonical.safeParse(raw);
  const legacy = Legacy.safeParse(raw);

  // Stub mode: no key, OR caller used the legacy (non-canonical) shape.
  // Both keep dev DX with no API key required.
  if (keyOrigin === "missing" || !key || !canonical.success) {
    if (canonical.success) return stubResponse(requestId, keyOrigin, canonical.data);
    if (legacy.success) return stubResponse(requestId, keyOrigin, legacy.data);
    return NextResponse.json(
      {
        error: "invalid body",
        issues: legacy.error.flatten(),
      },
      { status: 400 },
    );
  }

  // Real mode: canonical shape + a real key (BYO or env).
  return realResponse(requestId, keyOrigin, canonical.data, key);
}

// ─────────── Stub response ───────────

function stubResponse(
  requestId: string,
  keyOrigin: "byo" | "env" | "missing",
  parsed: CanonicalBody | LegacyBody,
): Response {
  let guide_id: string;
  let turn_index: number;
  let user_text: string | undefined;

  if ("session" in parsed) {
    guide_id = parsed.guide_id;
    turn_index = parsed.turns.filter((t) => t.role === "guide").length;
    const lastUser = [...parsed.turns].reverse().find((t) => t.role === "user");
    user_text = lastUser?.text;
  } else {
    guide_id = parsed.guide_id;
    turn_index = parsed.turn_index;
    user_text = parsed.user_text;
  }

  const i = Math.min(turn_index, STUB_SCRIPT.length - 1);
  const slot = STUB_SCRIPT[i]!;
  const phrasesHeld = user_text ? stubExtractCandidatePhrases(user_text) : [];

  log.info("interview.turn.stub", {
    request_id: requestId,
    guide_id,
    turn_index: i,
    key_origin: keyOrigin,
    has_key: keyOrigin !== "missing",
  });

  return NextResponse.json({
    stub: true,
    turn_index: i,
    is_last: i === STUB_SCRIPT.length - 1,
    question: slot.question,
    meta: slot.meta ?? null,
    phrases_held: phrasesHeld,
  });
}

// ─────────── Real (Sonnet 4.6) response ───────────

async function realResponse(
  requestId: string,
  keyOrigin: "byo" | "env",
  body: CanonicalBody,
  key: string,
): Promise<Response> {
  const { session, guide_id, turns, theme } = body;

  const guide = getBuiltInGuides().find((g) => g.id === guide_id);
  if (!guide) {
    return NextResponse.json(
      { error: `unknown guide_id: ${guide_id}` },
      { status: 404 },
    );
  }

  const systemPrompt = assemblePrompt({
    guide,
    recipient: session.recipient,
    occasion: session.occasion,
    form: session.form,
    theme,
  });

  // Map canonical turns → Anthropic message params. Empty turns means
  // first call — bootstrap with a synthetic user message so Sonnet
  // produces the opening greeting + first question per its system prompt.
  const messages: Anthropic.MessageParam[] =
    turns.length === 0
      ? [{ role: "user", content: "Please begin the interview." }]
      : turns.map((t) => ({
          role: t.role === "guide" ? ("assistant" as const) : ("user" as const),
          content: t.text,
        }));

  const userTurnsText = turns
    .filter((t) => t.role === "user")
    .map((t) => t.text);

  log.info("interview.turn.start", {
    request_id: requestId,
    guide_id,
    theme: theme ?? "warm",
    turn_count: turns.length,
    key_origin: keyOrigin,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const client = anthropicForKey(key);

        const tools: Anthropic.Tool[] = [
          {
            name: "record_phrases_held",
            description:
              "Record 1-3 verbatim substrings from the user's recent turns that you are holding onto as candidate spine phrases. Each phrase MUST be an exact substring of one of the user's turns — never paraphrase, never summarize. Use this when something specific in the user's answer struck you.",
            input_schema: {
              type: "object" as const,
              properties: {
                phrases: {
                  type: "array",
                  items: { type: "string" },
                  minItems: 1,
                  maxItems: 3,
                },
              },
              required: ["phrases"],
            },
          },
        ];

        const ms = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: systemPrompt,
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
          tools,
        });

        ms.on("text", (text: string) => {
          controller.enqueue(sseFrame("delta", { text }));
        });

        const finalMessage = await ms.finalMessage();

        // Surface validated phrases_held from any tool_use blocks.
        for (const block of finalMessage.content) {
          if (block.type === "tool_use" && block.name === "record_phrases_held") {
            const input = block.input as { phrases?: unknown };
            const raw = Array.isArray(input.phrases)
              ? (input.phrases as unknown[]).filter(
                  (p): p is string => typeof p === "string",
                )
              : [];
            const { ok, bad } = verbatimOnly(raw, userTurnsText);
            controller.enqueue(sseFrame("phrases_held", { phrases: ok }));
            if (bad.length > 0) {
              log.info("interview.turn.phrases_dropped", {
                request_id: requestId,
                bad_count: bad.length,
              });
            }
          }
        }

        // Cache-hit telemetry — the difference between $5 and $50 over a session.
        if (finalMessage.usage) {
          log.info("interview.turn.usage", {
            request_id: requestId,
            input_tokens: finalMessage.usage.input_tokens,
            output_tokens: finalMessage.usage.output_tokens,
            cache_read_input_tokens:
              finalMessage.usage.cache_read_input_tokens ?? 0,
            cache_creation_input_tokens:
              finalMessage.usage.cache_creation_input_tokens ?? 0,
          });
        }

        controller.enqueue(sseFrame("done", {}));
        controller.close();
      } catch (err) {
        log.error("interview.turn.failed", {
          request_id: requestId,
          error: err instanceof Error ? err.message : String(err),
        });
        controller.enqueue(
          sseFrame("error", { message: "interview turn failed" }),
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
