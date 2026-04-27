import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { anthropicForKey } from "@/lib/anthropic";
import { keyOriginTag, readKey } from "@/lib/byo-key/server";
import { applyImmutables } from "@/lib/guides/loader";
import { GuideSchema, type Guide } from "@/lib/guides/schema";
import { log } from "@/lib/logger";

export const runtime = "nodejs";

const CreateInput = z.object({
  name: z.string().min(1).max(120),
  pulls_for: z.string().min(1).max(500),
  voice: z.string().min(1).max(500),
  sample_q: z.string().min(1).max(500),
  never: z.string().min(1).max(500),
  mascot: z.enum(["wren", "pip", "cassio"]).optional(),
});

type CreateInputData = z.infer<typeof CreateInput>;

// Recognized keywords that indicate the user is trying to use the
// generator to produce a "guide" that drafts the artifact for them. We
// refuse before the Opus call so we don't burn tokens on attacks.
const ATTACK_PATTERNS: ReadonlyArray<RegExp> = [
  /\bjust\s+write\s+(it|the\s+\w+|for\s+me)\b/i,
  /\bdraft\s+(the\s+)?(poem|letter|artifact|piece)\b/i,
  /\bcompose\s+(the\s+)?(poem|letter|artifact|piece)\b/i,
  /\bghost-?writer?\b/i,
  /\bwrite\s+the\s+\w+\s+for\s+me\b/i,
];

function detectAttack(input: CreateInputData): string | null {
  const haystack = [
    input.name,
    input.pulls_for,
    input.voice,
    input.sample_q,
    input.never,
  ].join(" \n ");
  for (const re of ATTACK_PATTERNS) {
    const m = haystack.match(re);
    if (m) return m[0];
  }
  return null;
}

function deriveId(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
  return base.length >= 3 ? base : "custom-guide";
}

/**
 * Stub synthesis: build a plausible Guide deterministically from the
 * structured inputs. No model. Used when no API key is present so dev
 * DX and tests don't require live Anthropic access.
 */
function stubSynthesize(input: CreateInputData): Guide {
  const sentences = (s: string) =>
    s
      .split(/[.;]/)
      .map((x) => x.trim())
      .filter(Boolean);

  const voiceRules =
    sentences(input.voice).slice(0, 6) || ["calibrated to the user's tone"];

  const guide: Guide = {
    id: deriveId(input.name),
    name: input.name,
    sensibility: `${input.voice.trim()}. Pulls for ${input.pulls_for.trim()}.`,
    best_for: ["just_because", "gratitude"],
    voice_rules:
      voiceRules.length > 0 ? voiceRules : ["responsive to the moment"],
    allowed: [
      "asking follow-up questions",
      "mirroring the user's striking phrases verbatim",
      "proposing structure without filling it in",
    ],
    forbidden: [input.never.trim()],
    question_bank: [
      input.sample_q.trim(),
      "What's a small thing about them only one person knew?",
      "What's a phrase they always said?",
      "Tell me about an ordinary moment with them.",
      "What sound or smell brings them back?",
    ],
    audit_flags: [
      {
        name: "persona_drift",
        description:
          "The message no longer sounds like this guide's voice.",
      },
    ],
    sample_meta_comments: [
      "Specifics over abstractions — a Tuesday, not 'their presence'.",
    ],
    description: `${input.name} — ${input.pulls_for.trim()}.`,
    source: "user_local",
  };
  return applyImmutables(guide);
}

/**
 * POST /api/guide/create — synthesize a Guide spec from structured user
 * input. Stub mode (no key) returns a deterministic synthesis. Real mode
 * uses Opus 4.7 with structured output.
 */
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

  const parsed = CreateInput.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const attack = detectAttack(parsed.data);
  if (attack) {
    log.warn("guide.create.refused", {
      request_id: requestId,
      attack_pattern: attack,
    });
    return NextResponse.json(
      {
        error:
          "refused: prompt appears to attack the no-drafting guardrail (the guide must never write for you)",
        pattern: attack,
      },
      { status: 422 },
    );
  }

  if (!key || keyOrigin === "missing") {
    log.info("guide.create.stub", {
      request_id: requestId,
      key_origin: keyOrigin,
    });
    return NextResponse.json({
      stub: true,
      guide: stubSynthesize(parsed.data),
    });
  }

  return realCreate(requestId, keyOrigin, key, parsed.data);
}

async function realCreate(
  requestId: string,
  keyOrigin: "byo" | "env",
  key: string,
  input: CreateInputData,
): Promise<Response> {
  const client = anthropicForKey(key);

  const tools: Anthropic.Tool[] = [
    {
      name: "record_guide",
      description:
        "Record a complete Guide spec synthesized from the user's inputs.",
      input_schema: {
        type: "object" as const,
        properties: {
          id: {
            type: "string",
            description: "kebab-case, 3-64 chars, derived from name",
          },
          name: { type: "string" },
          sensibility: {
            type: "string",
            description:
              "1-paragraph description of what this guide pays attention to",
          },
          best_for: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
            description:
              "occasion tags: eulogy, legacy, family_story, birthday, gratitude, anniversary, just_because, thank_you, love_letter, apology, reconciliation, retirement, memorial",
          },
          voice_rules: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 6,
          },
          allowed: {
            type: "array",
            items: { type: "string" },
            minItems: 3,
            maxItems: 5,
          },
          forbidden: {
            type: "array",
            items: { type: "string" },
            minItems: 1,
            description:
              "Persona-specific forbidden items. Immutable items are added server-side.",
          },
          question_bank: {
            type: "array",
            items: { type: "string" },
            minItems: 12,
            maxItems: 22,
            description:
              "Specific, concrete questions in this guide's voice. Pull for moments and details, not abstractions.",
          },
          audit_flags: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
              },
              required: ["name", "description"],
            },
            minItems: 1,
            description:
              "Persona-specific audit flags. Immutable flags are added server-side.",
          },
          sample_meta_comments: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
            maxItems: 4,
          },
          description: {
            type: "string",
            description:
              "Long-form description shown on the picker card. 3-5 sentences.",
          },
        },
        required: [
          "id",
          "name",
          "sensibility",
          "best_for",
          "voice_rules",
          "allowed",
          "forbidden",
          "question_bank",
          "audit_flags",
          "sample_meta_comments",
          "description",
        ],
      },
    },
  ];

  const systemText = [
    "You synthesize creative-guide specs for the Mean It app.",
    "Mean It is a guided writing companion: a guide interviews the user",
    "but never drafts the artifact. Every word in the final piece must",
    "come from the user.",
    "",
    "The user has described the guide they want to create. Synthesize a",
    "complete Guide spec via the record_guide tool.",
    "",
    "RULES",
    "- The guide you produce must never draft. Voice rules and allowed",
    "  actions describe how it asks, mirrors, and critiques — never how",
    "  it writes.",
    "- Question bank: specific and concrete. 'What did her hands do?'",
    "  not 'How did she make you feel?'.",
    "- Persona-specific forbidden items + audit flags are encouraged on",
    "  top of the immutables (which are added server-side).",
    "- If the user's inputs include their never (forbidden item), include",
    "  it verbatim in forbidden[].",
  ].join("\n");

  try {
    const result = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 4096,
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
          content: [
            `User inputs for the guide they want:`,
            ``,
            `name: ${input.name}`,
            `pulls_for: ${input.pulls_for}`,
            `voice: ${input.voice}`,
            `sample_q: ${input.sample_q}`,
            `never: ${input.never}`,
            input.mascot ? `mascot: ${input.mascot}` : "",
            ``,
            `Synthesize the complete Guide via record_guide.`,
          ]
            .filter(Boolean)
            .join("\n"),
        },
      ],
      tools,
      tool_choice: { type: "tool", name: "record_guide" },
    });

    let raw: Record<string, unknown> | null = null;
    for (const block of result.content) {
      if (block.type === "tool_use" && block.name === "record_guide") {
        raw = block.input as Record<string, unknown>;
      }
    }
    if (!raw) {
      throw new Error("model did not invoke record_guide");
    }

    // Inject the user's chosen mascot (if any) since the tool schema
    // doesn't carry it. Pin source and apply the immutable guardrails.
    const candidate = {
      ...raw,
      source: "user_local" as const,
    };
    const parsedGuide = GuideSchema.safeParse(candidate);
    if (!parsedGuide.success) {
      log.error("guide.create.invalid_synthesis", {
        request_id: requestId,
        issues: parsedGuide.error.flatten(),
      });
      return NextResponse.json(
        {
          error: "model returned an invalid guide shape",
          issues: parsedGuide.error.flatten(),
        },
        { status: 502 },
      );
    }

    const fortified = applyImmutables(parsedGuide.data);

    log.info("guide.create.ok", {
      request_id: requestId,
      key_origin: keyOrigin,
      guide_id: fortified.id,
    });

    return NextResponse.json({ guide: fortified });
  } catch (err) {
    log.error("guide.create.failed", {
      request_id: requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json(
      { error: "guide create failed" },
      { status: 500 },
    );
  }
}
