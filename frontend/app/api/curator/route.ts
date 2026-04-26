import { NextRequest, NextResponse } from "next/server";
import { buildStoryboard, CuratorInputSchema } from "@/lib/video/curator";
import { log } from "@/lib/logger";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const requestId = req.headers.get("x-request-id") ?? crypto.randomUUID();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "expected JSON body" }, { status: 400 });
  }

  const parsed = CuratorInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const storyboard = await buildStoryboard(parsed.data);
    log.info("curator.ok", {
      request_id: requestId,
      theme: storyboard.theme,
      clips: storyboard.clips.length,
      total_ms: storyboard.total_duration_ms,
    });
    return NextResponse.json({ storyboard });
  } catch (err) {
    const status = (err as { status?: number })?.status ?? 502;
    log.error("curator.failed", {
      request_id: requestId,
      status,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "curator failed" }, { status });
  }
}
