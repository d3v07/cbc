import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: () => ({ OPENAI_API_KEY: "test-key", NODE_ENV: "test" }),
}));

import { POST } from "@/app/api/tts/route";

const fetchMock = vi.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/tts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/tts", () => {
  it("rejects empty text", async () => {
    const res = await POST(jsonRequest({ text: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects unknown voice", async () => {
    const res = await POST(jsonRequest({ text: "hi", voice: "robo" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns audio bytes with X-Voice synthesized header on success", async () => {
    const fakeAudio = new Uint8Array([0xff, 0xfb, 0x90]).buffer;
    fetchMock.mockResolvedValueOnce(new Response(fakeAudio, { status: 200 }));

    const res = await POST(jsonRequest({ text: "hi" }) as never);
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("audio/mpeg");
    expect(res.headers.get("X-Voice")).toBe("synthesized");
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBe(3);
  });

  it("propagates upstream status", async () => {
    fetchMock.mockResolvedValueOnce(new Response("nope", { status: 401 }));
    const res = await POST(jsonRequest({ text: "hi" }) as never);
    expect(res.status).toBe(401);
  });
});
