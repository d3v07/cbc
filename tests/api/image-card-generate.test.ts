import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/image-card/generate/route";

const originalFetch = globalThis.fetch;
const originalOpenAIKey = process.env.OPENAI_API_KEY;
const originalImageModel = process.env.OPENAI_IMAGE_MODEL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalOpenAIKey === undefined) {
    delete process.env.OPENAI_API_KEY;
  } else {
    process.env.OPENAI_API_KEY = originalOpenAIKey;
  }
  if (originalImageModel === undefined) {
    delete process.env.OPENAI_IMAGE_MODEL;
  } else {
    process.env.OPENAI_IMAGE_MODEL = originalImageModel;
  }
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/image-card/generate", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/image-card/generate", () => {
  it("returns 400 on invalid body", async () => {
    const res = await POST(jsonRequest({ artifact: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 503 when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;
    const res = await POST(
      jsonRequest({ artifact: "A small letter", format: "square", layout: "hero" }) as never,
    );
    expect(res.status).toBe(503);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/OPENAI_API_KEY/);
  });

  it("generates a PNG data URL from the OpenAI image response", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    const fetchMock = vi.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify({ data: [{ b64_json: "abc123" }] }),
        { headers: { "Content-Type": "application/json" } },
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const res = await POST(
      jsonRequest({
        artifact: "She kept the kitchen radio on low.",
        recipient: "Maya",
        occasion: "birthday",
        theme: "warm",
        format: "portrait",
        layout: "paper",
      }) as never,
    );

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0]!;
    const upstreamBody = JSON.parse(String(init?.body)) as {
      model: string;
      prompt: string;
      size: string;
      quality: string;
    };
    expect(upstreamBody.model).toBe("gpt-image-1");
    expect(upstreamBody.prompt).toContain("She kept the kitchen radio on low.");
    expect(upstreamBody.size).toBe("1024x1536");
    expect(upstreamBody.quality).toBe("medium");

    const body = (await res.json()) as { image_url: string; mime: string };
    expect(body.image_url).toBe("data:image/png;base64,abc123");
    expect(body.mime).toBe("image/png");
  });
});
