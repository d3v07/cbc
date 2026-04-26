import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/audio/transcribe";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 25 * 1024 * 1024; // Whisper hard cap is 25MB.
const ACCEPTED_PREFIXES = ["audio/"];

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "field 'file' missing" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "file is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: `file exceeds ${MAX_BYTES} bytes` }, { status: 413 });
  }
  if (!ACCEPTED_PREFIXES.some((p) => file.type.startsWith(p))) {
    return NextResponse.json(
      { error: "unsupported content-type", type: file.type },
      { status: 415 },
    );
  }

  try {
    const result = await transcribeAudio(file);
    log.info("transcribe.ok", {
      request_id: requestId,
      lines: result.lines.length,
      duration_ms: result.duration_ms,
    });
    return NextResponse.json(result);
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 502;
    log.error("transcribe.failed", {
      request_id: requestId,
      status,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "transcribe failed" }, { status });
  }
}
