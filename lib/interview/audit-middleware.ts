import type Anthropic from "@anthropic-ai/sdk";
import type { Guide } from "@/lib/guides/schema";

export interface RunAuditInput {
  message: string;
  guide: Guide;
  client: Anthropic;
}

export interface AuditResult {
  allow: boolean;
  flags_tripped: string[];
  reason: string;
}

/**
 * Audit an assistant message against the active guide's audit_flags.
 *
 * - Default mode is log-only: `allow` is always true, but the caller is
 *   expected to log the result so a human can inspect false positives.
 * - When `process.env.AUDIT_BLOCK === "1"` and at least one flag tripped,
 *   `allow` is false. The caller is responsible for surfacing this to
 *   the client (e.g. an `audit_blocked` SSE event).
 *
 * Infra failures (network, model error) yield `allow: true` with empty
 * flags. We never block on a failed audit — that would let an outage
 * become a denial-of-service for the whole interview flow.
 */
export async function runAudit(input: RunAuditInput): Promise<AuditResult> {
  const flagDescriptions = input.guide.audit_flags
    .map((f) => `- ${f.name}: ${f.description}`)
    .join("\n");

  const systemText = [
    "You audit assistant messages produced by a creative-guide app.",
    "The guide is FORBIDDEN from drafting the user's artifact.",
    "Inspect the message below and report which audit flags it trips.",
    "",
    `AUDIT FLAGS for guide ${input.guide.name}:`,
    flagDescriptions,
    "",
    'If the message is clean, return flags_tripped=[] and reason="".',
    "If any flags fire, list them and explain in one sentence which",
    "passage(s) triggered each.",
    "",
    "Use the record_audit tool for the response.",
  ].join("\n");

  const tools: Anthropic.Tool[] = [
    {
      name: "record_audit",
      description: "Record which audit flags this message trips, if any.",
      input_schema: {
        type: "object" as const,
        properties: {
          flags_tripped: {
            type: "array",
            items: { type: "string" },
            description: "Names of flags that fired. Empty if clean.",
          },
          reason: {
            type: "string",
            description: "One-sentence explanation. Empty if no flags fired.",
          },
        },
        required: ["flags_tripped", "reason"],
      },
    },
  ];

  try {
    const result = await input.client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
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
          content: `Message:\n\n${input.message}\n\nRun the audit.`,
        },
      ],
      tools,
      tool_choice: { type: "tool", name: "record_audit" },
    });

    let flags: string[] = [];
    let reason = "";
    for (const block of result.content) {
      if (block.type === "tool_use" && block.name === "record_audit") {
        const i = block.input as {
          flags_tripped?: unknown;
          reason?: unknown;
        };
        flags = Array.isArray(i.flags_tripped)
          ? (i.flags_tripped as unknown[]).filter(
              (x): x is string => typeof x === "string",
            )
          : [];
        reason = typeof i.reason === "string" ? i.reason : "";
      }
    }

    const blocked =
      process.env.AUDIT_BLOCK === "1" && flags.length > 0;
    return { allow: !blocked, flags_tripped: flags, reason };
  } catch {
    return { allow: true, flags_tripped: [], reason: "" };
  }
}
