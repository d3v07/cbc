import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: () => ({ OPENAI_API_KEY: undefined, NODE_ENV: "test" }),
}));

import { POST } from "@/app/api/tts/route";

describe("POST /api/tts (no key)", () => {
  it("returns 503 with specific copy when OPENAI_API_KEY missing", async () => {
    const req = new Request("http://localhost/api/tts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "hello" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toBe("Voice synthesis unavailable: OpenAI API key not configured.");
  });
});
