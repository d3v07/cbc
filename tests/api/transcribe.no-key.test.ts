import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: () => ({ OPENAI_API_KEY: undefined, NODE_ENV: "test" }),
}));

import { POST } from "@/app/api/transcribe/route";

describe("POST /api/transcribe (no key)", () => {
  it("returns 503 with specific copy when OPENAI_API_KEY missing", async () => {
    const fd = new FormData();
    fd.set("file", new File([new Uint8Array([0])], "v.webm", { type: "audio/webm" }));
    const req = new Request("http://localhost/api/transcribe", { method: "POST", body: fd });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Voice transcript unavailable: OpenAI API key not configured.");
  });
});
