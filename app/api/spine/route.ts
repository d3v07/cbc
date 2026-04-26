import path from "node:path";
import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { anthropicForKey } from "@/lib/anthropic";
import { keyOriginTag, readKey } from "@/lib/byo-key/server";
import { SCRIPT } from "@/lib/demo";
import { loadBuiltInGuides } from "@/lib/guides/loader";
import { log } from "@/lib/logger";
import { verbatimOnly } from "@/lib/spine/validate";
import { FormSchema } from "@/lib/types/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ─────────── Schema ───────────

const GUIDE_ID = z
  .string()
  .regex(/^[A-Za-z0-9_-]{3,64}$/, "guide_id must be 3-64 chars [A-Za-z0-9_-]");

const TurnSchema = z.object({
  id: z.string(),
  role: z.enum(["guide", "user"]),
  text: z.string().max(8000),
});

// Optional body — when omitted (or with no key), we serve the canned eulogy
// SCRIPT for dev DX.
const Body = z.object({
  guide_id: GUIDE_ID.optional(),
  form: FormSchema.optional(),
  turns: z.array(TurnSchema).max(60).optional(),
});
type SpineBody = z.infer<typeof Body>;

interface SpineCandidate {
  text: string;
  source_turn_id: string;
  source_label: string;
}
interface StructureMovement {
  label: string;
  sub: string;
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

// ─────────── POST handler ───────────

/**
 * POST /api/spine — Spine extractor.
 *
 * Stub mode (no key, or empty body): returns the canned eulogy SCRIPT
 * candidates + structure. Tagged with `X-Mean-It-Stub: 1`.
 *
 * Real mode (BYO or env key + a body with at least one user turn):
 * Haiku 4.5 returns 2-3 phrases. `verbatimOnly` validates each phrase
 * against the user-turn text. On failure, retry once with a stricter
 * prompt; on second failure, return 502 with diagnostic.
 */
export async function POST(req: NextRequest): Promise<Response> {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const keyOrigin = keyOriginTag(req);
  const key = readKey(req);

  // Allow empty / no-body callers in stub mode.
  let raw: unknown = {};
  const text = await req.text();
  if (text.trim().length > 0) {
    try {
      raw = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "expected JSON body" },
        { status: 400 },
      );
    }
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const userTurns = (parsed.data.turns ?? []).filter((t) => t.role === "user");
  const userTurnsText = userTurns.map((t) => t.text);

  // Stub fallback: no key, no usable turns, or no guide.
  if (
    keyOrigin === "missing" ||
    !key ||
    userTurns.length === 0 ||
    !parsed.data.guide_id
  ) {
    return stubResponse(requestId, keyOrigin);
  }

  return realResponse(
    requestId,
    keyOrigin,
    key,
    parsed.data,
    userTurns,
    userTurnsText,
  );
}

// ─────────── Stub ───────────

function stubResponse(
  requestId: string,
  keyOrigin: "byo" | "env" | "missing",
): Response {
  log.info("spine.stub", {
    request_id: requestId,
    key_origin: keyOrigin,
  });
  return NextResponse.json(
    {
      stub: true,
      candidates: SCRIPT.spineCandidates,
      structure: SCRIPT.structure,
    },
    { headers: { "X-Mean-It-Stub": "1" } },
  );
}

// ─────────── Real (Haiku 4.5) ───────────

async function realResponse(
  requestId: string,
  keyOrigin: "byo" | "env",
  key: string,
  body: SpineBody,
  userTurns: ReadonlyArray<{ id: string; role: "guide" | "user"; text: string }>,
  userTurnsText: string[],
): Promise<Response> {
  const guide_id = body.guide_id!;
  const form = body.form ?? "letter";

  const guide = getBuiltInGuides().find((g) => g.id === guide_id);
  if (!guide) {
    return NextResponse.json(
      { error: `unknown guide_id: ${guide_id}` },
      { status: 404 },
    );
  }

  const client = anthropicForKey(key);

  log.info("spine.start", {
    request_id: requestId,
    guide_id,
    form,
    user_turn_count: userTurns.length,
    key_origin: keyOrigin,
  });

  // First attempt
  let attempt = await callHaiku(client, guide.name, form, userTurns, false);
  let validated = verbatimOnly(attempt.candidates, userTurnsText);

  // One retry on validation failure with stricter prompt
  if (validated.bad.length > 0) {
    log.info("spine.retry", {
      request_id: requestId,
      bad_count: validated.bad.length,
    });
    attempt = await callHaiku(
      client,
      guide.name,
      form,
      userTurns,
      true,
      validated.bad,
    );
    validated = verbatimOnly(attempt.candidates, userTurnsText);
  }

  if (validated.bad.length > 0 || validated.ok.length === 0) {
    log.error("spine.failed", {
      request_id: requestId,
      bad: validated.bad,
      ok_count: validated.ok.length,
    });
    return NextResponse.json(
      {
        error:
          "spine extractor returned non-verbatim phrases after one retry",
        bad: validated.bad,
      },
      { status: 502 },
    );
  }

  // Map ok phrases back to their source turn for the picker UI.
  const candidates: SpineCandidate[] = validated.ok.map((phrase) => {
    const source = userTurns.find((t) => t.text.includes(phrase.trim()));
    return {
      text: phrase,
      source_turn_id: source?.id ?? userTurns[userTurns.length - 1]!.id,
      source_label: source ? `from your answer · ${source.id}` : "from your answers",
    };
  });

  log.info("spine.ok", {
    request_id: requestId,
    candidate_count: candidates.length,
    structure_count: attempt.structure.length,
  });

  return NextResponse.json({
    candidates,
    structure: attempt.structure,
  });
}

// ─────────── Haiku call ───────────

interface HaikuAttemptResult {
  candidates: string[];
  structure: StructureMovement[];
}

async function callHaiku(
  client: Anthropic,
  guideName: string,
  form: "poem" | "letter",
  userTurns: ReadonlyArray<{ id: string; role: "guide" | "user"; text: string }>,
  strictRetry: boolean,
  badPhrases: string[] = [],
): Promise<HaikuAttemptResult> {
  const userText = userTurns
    .map((t) => `[turn ${t.id}] ${t.text}`)
    .join("\n\n");

  const baseSystem = [
    `You are a spine extractor for ${guideName}, working on a ${form} someone is writing.`,
    "Read the user's accumulated turns. Pick 2 or 3 short phrases — each one a verbatim substring of one of the user's turns — that read as the spine of what they're trying to say. Phrases that other phrases hang from.",
    "Then propose a 3-movement structure for the artifact (each movement: a label and a one-line sub).",
    "",
    "RULES",
    "- Each phrase MUST be an exact substring of the user's text. No paraphrasing. No summarising. Copy the characters as they appear.",
    "- Pick phrases of 4-12 words. Avoid trailing punctuation when possible.",
    "- Pick phrases the user actually said, not phrases inferred from what they said.",
    "- Use the `record_spine` tool to return the result. Do not return prose.",
  ];
  if (strictRetry && badPhrases.length > 0) {
    baseSystem.push(
      "",
      "STRICTNESS REMINDER",
      `Your previous attempt returned phrases that were not verbatim substrings: ${badPhrases.map((p) => JSON.stringify(p)).join(", ")}.`,
      "Try again. Each phrase must appear character-for-character in the user's turns above. Copy from the source.",
    );
  }
  const systemText = baseSystem.join("\n");

  const tools: Anthropic.Tool[] = [
    {
      name: "record_spine",
      description:
        "Record 2-3 verbatim spine candidates plus a 3-movement structure proposal.",
      input_schema: {
        type: "object" as const,
        properties: {
          candidates: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 3,
            description:
              "Each candidate MUST be an exact substring of the user's turns.",
          },
          structure: {
            type: "array",
            items: {
              type: "object",
              properties: {
                label: { type: "string" },
                sub: { type: "string" },
              },
              required: ["label", "sub"],
            },
            minItems: 3,
            maxItems: 3,
          },
        },
        required: ["candidates", "structure"],
      },
    },
  ];

  const result = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: [
      { type: "text", text: systemText, cache_control: { type: "ephemeral" } },
    ],
    messages: [
      {
        role: "user",
        content: `User turns so far:\n\n${userText}\n\nReturn the spine via the record_spine tool.`,
      },
    ],
    tools,
    tool_choice: { type: "tool", name: "record_spine" },
  });

  for (const block of result.content) {
    if (block.type === "tool_use" && block.name === "record_spine") {
      const input = block.input as {
        candidates?: unknown;
        structure?: unknown;
      };
      const candidates = Array.isArray(input.candidates)
        ? (input.candidates as unknown[]).filter(
            (c): c is string => typeof c === "string",
          )
        : [];
      const structureRaw = Array.isArray(input.structure)
        ? (input.structure as unknown[])
        : [];
      const structure: StructureMovement[] = structureRaw
        .map((s) => {
          const obj = s as { label?: unknown; sub?: unknown };
          return {
            label: typeof obj.label === "string" ? obj.label : "",
            sub: typeof obj.sub === "string" ? obj.sub : "",
          };
        })
        .filter((m) => m.label.length > 0);
      return { candidates, structure };
    }
  }

  return { candidates: [], structure: [] };
}
