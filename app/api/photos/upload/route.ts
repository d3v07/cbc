import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 20 * 1024 * 1024; // 20MB — Anthropic Files API hard cap is 32MB; keep margin
const ACCEPTED_PREFIXES = ["image/"];

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  let form: FormData;
  try {
    form = await req.formData();
  } catch (err) {
    log.warn("photos.upload.bad_form", { request_id: requestId, error: String(err) });
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "field 'file' missing or not a File" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "file is empty" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: `file exceeds ${MAX_BYTES} bytes`, size: file.size },
      { status: 413 },
    );
  }
  if (!ACCEPTED_PREFIXES.some((p) => file.type.startsWith(p))) {
    return NextResponse.json(
      { error: "unsupported content-type", type: file.type },
      { status: 415 },
    );
  }

  try {
    // Anthropic Files API (beta). The SDK accepts a Web File directly.
    const result = await anthropic().beta.files.upload(
      { file },
      { headers: { "anthropic-beta": "files-api-2025-04-14" } },
    );
    log.info("photos.upload.ok", {
      request_id: requestId,
      file_id: result.id,
      mime: file.type,
      size: file.size,
    });
    return NextResponse.json({ file_id: result.id, mime: file.type, size: file.size });
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 502;
    log.error("photos.upload.failed", {
      request_id: requestId,
      status,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "upload failed" }, { status });
  }
}
