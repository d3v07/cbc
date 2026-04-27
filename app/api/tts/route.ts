import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { synthesizeSpeech, type TtsVoice, type TtsFormat } from "@/lib/audio/tts";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  text: z.string().min(1),
  voice: z.enum(["alloy", "nova", "shimmer", "echo", "fable", "onyx"]).optional(),
  format: z.enum(["mp3", "wav", "opus", "aac", "flac"]).optional(),
});

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

  try {
    const opts: { voice?: TtsVoice; format?: TtsFormat } = {};
    if (parsed.data.voice) opts.voice = parsed.data.voice;
    if (parsed.data.format) opts.format = parsed.data.format;
    const { audio, mime } = await synthesizeSpeech(parsed.data.text, opts);
    log.info("tts.ok", {
      request_id: requestId,
      bytes: audio.byteLength,
      voice: opts.voice ?? "alloy",
    });
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": mime,
        "X-Voice": "synthesized",
      },
    });
  } catch (err) {
    const typed = err as { status?: number; message?: string };
    const status = typed?.status ?? 502;
    const message = typed?.status && err instanceof Error ? err.message : "tts failed";
    log.error("tts.failed", {
      request_id: requestId,
      status,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: message }, { status });
  }
}
