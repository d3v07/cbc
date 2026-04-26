import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: () => ({ OPENAI_API_KEY: "test-key", NODE_ENV: "test" }),
}));

import { POST } from "@/app/api/transcribe/route";

const fetchMock = vi.fn();
const originalFetch = globalThis.fetch;

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

function makeRequest(body: BodyInit | null): Request {
  return new Request("http://localhost/api/transcribe", { method: "POST", body });
}

function whisperResponse(payload: unknown, init: ResponseInit = { status: 200 }) {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/transcribe", () => {
  it("rejects non-multipart with 400", async () => {
    const res = await POST(makeRequest("text") as never);
    expect(res.status).toBe(400);
  });

  it("rejects missing 'file' field", async () => {
    const fd = new FormData();
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(400);
  });

  it("rejects non-audio MIME with 415", async () => {
    const fd = new FormData();
    fd.set("file", new File(["x"], "x.txt", { type: "text/plain" }));
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(415);
  });

  it("returns line-level transcript on success", async () => {
    fetchMock.mockResolvedValueOnce(
      whisperResponse({
        segments: [
          { text: "Hello world.", start: 0, end: 1.5 },
          { text: "How are you?", start: 1.5, end: 2.8 },
        ],
        text: "Hello world. How are you?",
      }),
    );

    const fd = new FormData();
    fd.set("file", new File([new Uint8Array([0])], "v.webm", { type: "audio/webm" }));
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { lines: Array<{ line: string }>; duration_ms: number };
    expect(body.lines).toHaveLength(2);
    expect(body.lines[0]?.line).toBe("Hello world.");
    expect(body.duration_ms).toBe(2800);
  });

  it("propagates Whisper error status", async () => {
    fetchMock.mockResolvedValueOnce(new Response("rate", { status: 429 }));
    const fd = new FormData();
    fd.set("file", new File([new Uint8Array([0])], "v.webm", { type: "audio/webm" }));
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(429);
  });
});
