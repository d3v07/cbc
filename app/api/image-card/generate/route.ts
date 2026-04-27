import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { log } from "@/lib/logger";
import { ThemeSchema } from "@/lib/types/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";
const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";

const FormatSchema = z.enum(["square", "portrait", "landscape"]);
const LayoutSchema = z.enum(["paper", "hero", "photo", "carousel"]);

const Body = z.object({
  artifact: z.string().trim().min(1).max(4000),
  recipient: z.string().trim().max(120).optional(),
  occasion: z.string().trim().max(160).optional(),
  theme: ThemeSchema.optional(),
  format: FormatSchema.default("square"),
  layout: LayoutSchema.default("paper"),
});

type ImageFormat = z.infer<typeof FormatSchema>;

const SIZE_BY_FORMAT: Record<ImageFormat, "1024x1024" | "1024x1536" | "1536x1024"> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

interface OpenAIImageResponse {
  data?: Array<{ b64_json?: string; url?: string }>;
  error?: { message?: string };
}

function readOpenAIKey(): string | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  return key ? key : null;
}

function buildPrompt(data: z.infer<typeof Body>): string {
  const context = [
    data.recipient ? `Recipient: ${data.recipient}` : null,
    data.occasion ? `Occasion: ${data.occasion}` : null,
    `Mood: ${data.theme ?? "warm"}`,
    `Card layout: ${data.layout}`,
  ]
    .filter(Boolean)
    .join("\n");

  return [
    "Create a refined shareable image card inspired by this personal letter.",
    "Use tactile paper, subtle ink, letterpress texture, soft natural light, and an editorial still-life composition.",
    "Do not use logos, watermarks, faces, or readable long blocks of text.",
    "If text appears, keep it abstract or partial; the app will preserve the exact letter separately.",
    context,
    "Letter:",
    data.artifact,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

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

  const key = readOpenAIKey();
  if (!key) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 503 },
    );
  }

  try {
    const upstream = await fetch(OPENAI_IMAGE_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: IMAGE_MODEL,
        prompt: buildPrompt(parsed.data),
        size: SIZE_BY_FORMAT[parsed.data.format],
        quality: "medium",
        n: 1,
      }),
    });

    const payload = (await upstream.json().catch(() => ({}))) as OpenAIImageResponse;
    if (!upstream.ok) {
      const message = payload.error?.message ?? "image generation failed";
      log.error("image_card.generate.failed", {
        request_id: requestId,
        status: upstream.status,
        error: message,
      });
      return NextResponse.json({ error: message }, { status: upstream.status });
    }

    const first = payload.data?.[0];
    if (!first?.b64_json && !first?.url) {
      log.error("image_card.generate.empty", { request_id: requestId });
      return NextResponse.json(
        { error: "image generation returned no image" },
        { status: 502 },
      );
    }

    log.info("image_card.generate.ok", {
      request_id: requestId,
      model: IMAGE_MODEL,
      format: parsed.data.format,
      layout: parsed.data.layout,
    });

    return NextResponse.json({
      image_url: first.b64_json
        ? `data:image/png;base64,${first.b64_json}`
        : first.url,
      mime: "image/png",
      model: IMAGE_MODEL,
      format: parsed.data.format,
      layout: parsed.data.layout,
    });
  } catch (err) {
    log.error("image_card.generate.exception", {
      request_id: requestId,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "image generation failed" }, { status: 502 });
  }
}
