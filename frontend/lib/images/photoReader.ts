import { anthropic } from "@/lib/anthropic";

const SYSTEM_PROMPT = `You are the Photo Reader for Mean It — a writing-companion app.
Given one photo, return concise, concrete descriptions used later to plan a vertical reel.

Rules:
- subject: one short clause describing the *primary* person, object, or scene (no narrative, no inference about identity).
- setting: where the photo appears to be taken — physical context only.
- mood: one or two emotional descriptors (e.g. "tender, candid", "still, formal").
- No flowery prose. No invented detail. If something cannot be determined, say "unclear".
- Each field stays under 15 words.`;

const TOOL = {
  name: "record_photo_description",
  description: "Record subject, setting, and mood for one photo.",
  input_schema: {
    type: "object" as const,
    properties: {
      subject: { type: "string", description: "Primary person/object/scene" },
      setting: { type: "string", description: "Where the photo was taken" },
      mood: { type: "string", description: "1–2 emotional descriptors" },
    },
    required: ["subject", "setting", "mood"],
    additionalProperties: false,
  },
};

export interface PhotoDescription {
  subject: string;
  setting: string;
  mood: string;
}

export async function describePhoto(file_id: string): Promise<PhotoDescription> {
  const res = await anthropic().beta.messages.create(
    {
      model: "claude-sonnet-4-6",
      max_tokens: 256,
      system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "file", file_id } },
            { type: "text", text: "Describe this photo." },
          ],
        },
      ],
    },
    { headers: { "anthropic-beta": "files-api-2025-04-14" } },
  );

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("photo_reader: model did not invoke the tool");
  }
  const input = block.input as PhotoDescription;
  if (!input.subject || !input.setting || !input.mood) {
    throw new Error("photo_reader: missing required fields");
  }
  return input;
}

export async function describePhotos(
  file_ids: readonly string[],
): Promise<Array<PhotoDescription & { file_id: string }>> {
  const results = await Promise.all(
    file_ids.map(async (file_id) => ({ file_id, ...(await describePhoto(file_id)) })),
  );
  return results;
}
