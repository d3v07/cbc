import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { describePhotos } from "@/lib/images/photoReader";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const Body = z.object({
  file_ids: z.array(z.string().min(1)).min(1).max(8),
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
    const descriptions = await describePhotos(parsed.data.file_ids);
    log.info("photos.describe.ok", {
      request_id: requestId,
      count: descriptions.length,
    });
    return NextResponse.json({ descriptions });
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 502;
    log.error("photos.describe.failed", {
      request_id: requestId,
      status,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "describe failed" }, { status });
  }
}
