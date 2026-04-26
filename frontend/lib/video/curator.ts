import { z } from "zod";
import { anthropic } from "@/lib/anthropic";
import { StoryboardSchema, type Storyboard } from "@/lib/types/media";
import type { Theme } from "@/lib/types/theme";
import { DEFAULT_THEME } from "@/lib/types/theme";

const SYSTEM_PROMPT = `You are the Curator for Mean It — you turn a short poem, a few photo descriptions, and a voice recording's line timestamps into a storyboard for a vertical 9:16 reel.

Output rules:
- Use ONLY the supplied file_ids. Do not invent photos.
- Each clip's start_ms + duration_ms must fit within total_duration_ms (the voice clip length).
- Captions must be drawn from the poem text. Never write new lines.
- Ken Burns parameters are normalized to [0,1] (x, y are anchor points; scale is 1.0–1.6).

Theme guidance — applied without rewriting the poem:
- cute     → quicker cuts (~1500–2200ms), high Ken Burns (scale 1.3–1.6), caption_preset "hand"
- warm     → medium cuts (~2200–3500ms), gentle Ken Burns (scale 1.1–1.3), caption_preset "serif-italic"
- quiet    → long cuts (~3500–5000ms), nearly still (scale 1.0–1.1),       caption_preset "mono"
- noir     → medium cuts (~2500–4000ms), held framing (scale 1.05–1.2),    caption_preset "serif-bold"
- gothic   → long cuts (~3500–5500ms), nearly still (scale 1.0–1.1),       caption_preset "serif-italic"

Return the storyboard via the build_storyboard tool only.`;

const TOOL = {
  name: "build_storyboard",
  description: "Emit a complete storyboard for the reel.",
  input_schema: {
    type: "object" as const,
    properties: {
      theme: { type: "string", enum: ["cute", "warm", "quiet", "noir", "gothic"] },
      total_duration_ms: { type: "integer", minimum: 1 },
      caption_preset: {
        type: "string",
        enum: ["serif-italic", "serif-bold", "mono", "hand"],
      },
      clips: {
        type: "array",
        minItems: 1,
        items: {
          type: "object",
          properties: {
            file_id: { type: "string" },
            start_ms: { type: "integer", minimum: 0 },
            duration_ms: { type: "integer", minimum: 1 },
            caption: { type: "string" },
            ken_burns: {
              type: "object",
              properties: {
                start: {
                  type: "object",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                    scale: { type: "number" },
                  },
                  required: ["x", "y", "scale"],
                },
                end: {
                  type: "object",
                  properties: {
                    x: { type: "number" },
                    y: { type: "number" },
                    scale: { type: "number" },
                  },
                  required: ["x", "y", "scale"],
                },
              },
              required: ["start", "end"],
            },
          },
          required: ["file_id", "start_ms", "duration_ms", "ken_burns"],
        },
      },
    },
    required: ["theme", "total_duration_ms", "caption_preset", "clips"],
    additionalProperties: false,
  },
};

const CuratorInput = z.object({
  poem: z.string().min(1),
  photos: z
    .array(
      z.object({
        file_id: z.string().min(1),
        subject: z.string().optional(),
        setting: z.string().optional(),
        mood: z.string().optional(),
      }),
    )
    .min(1),
  voice_lines: z
    .array(
      z.object({
        line: z.string(),
        start: z.number().nonnegative(),
        end: z.number().nonnegative(),
      }),
    )
    .min(1),
  theme: z
    .enum(["cute", "warm", "quiet", "noir", "gothic"])
    .optional()
    .default(DEFAULT_THEME),
});

export type CuratorInput = z.infer<typeof CuratorInput>;
export { CuratorInput as CuratorInputSchema };

export async function buildStoryboard(input: CuratorInput): Promise<Storyboard> {
  const theme: Theme = input.theme ?? DEFAULT_THEME;
  const total_ms = Math.round((input.voice_lines.at(-1)?.end ?? 0) * 1000);

  const userMessage = JSON.stringify(
    {
      theme,
      total_duration_ms: total_ms,
      poem: input.poem,
      photos: input.photos,
      voice_lines: input.voice_lines,
    },
    null,
    2,
  );

  const res = await anthropic().messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    tools: [TOOL],
    tool_choice: { type: "tool", name: TOOL.name },
    messages: [{ role: "user", content: userMessage }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("curator: model did not invoke the tool");
  }

  const parsed = StoryboardSchema.safeParse(block.input);
  if (!parsed.success) {
    throw new Error(
      `curator: storyboard failed validation: ${parsed.error.issues.map((i) => i.path.join(".") + ": " + i.message).join("; ")}`,
    );
  }

  // Extra invariants the model can violate even with a valid schema.
  const validIds = new Set(input.photos.map((p) => p.file_id));
  for (const clip of parsed.data.clips) {
    if (!validIds.has(clip.file_id)) {
      throw new Error(`curator: clip references unknown file_id ${clip.file_id}`);
    }
    if (clip.start_ms + clip.duration_ms > parsed.data.total_duration_ms) {
      throw new Error("curator: clip exceeds total_duration_ms");
    }
  }

  return parsed.data;
}
