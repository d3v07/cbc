import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const sse = vi.hoisted(() => {
  const finalMessageMock = vi.fn();
  const mockStream = {
    on() {
      return mockStream;
    },
    finalMessage() {
      return finalMessageMock();
    },
  };
  const reset = () => {
    finalMessageMock.mockReset();
  };
  return { mockStream, finalMessageMock, reset };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockReturnValue(sse.mockStream),
      create: vi.fn(),
    },
  })),
}));

const { POST } = await import("@/app/api/draft/critique/route");

function makeRequest(
  body: object,
  headers: Record<string, string> = {},
): NextRequest {
  return new Request("http://localhost/api/draft/critique", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const baseBody = {
  draft: "Tomas kept a notebook in his coat pocket.",
  turns: [
    { id: "u1", role: "user", text: "He kept a notebook in his coat pocket." },
  ],
  guide_id: "documentarian",
  theme: "quiet",
};
const byoHeaders = { "X-Anthropic-Key": "sk-ant-test" };

const cardBlock = (
  kind: "cliche" | "question" | "verified",
  body: string,
  line_ref?: string,
) => ({
  type: "tool_use",
  name: "record_critique_card",
  input: { kind, body, ...(line_ref ? { line_ref } : {}) },
});

beforeEach(() => sse.reset());

describe("POST /api/draft/critique — real mode", () => {
  it("emits one card SSE event per record_critique_card tool call, then done", async () => {
    sse.finalMessageMock.mockResolvedValue({
      content: [
        cardBlock("cliche", "stock phrase noticed", "forever in our hearts"),
        cardBlock(
          "verified",
          "lifted from your turn — keep it.",
          "kept a notebook in his coat pocket",
        ),
        cardBlock("question", "did you mean simpler or quieter?", "simpler"),
      ],
      usage: { input_tokens: 100, output_tokens: 30 },
    });

    const res = await POST(makeRequest(baseBody, byoHeaders));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await res.text();
    // Three card events
    const cardCount = (text.match(/event: card/g) ?? []).length;
    expect(cardCount).toBe(3);
    expect(text).toContain("stock phrase noticed");
    expect(text).toContain("lifted from your turn");
    expect(text).toContain("did you mean simpler");
    // done at the end
    expect(text).toContain("event: done");
    expect(text.lastIndexOf("event: done")).toBeGreaterThan(
      text.lastIndexOf("event: card"),
    );
  });

  it("skips invalid tool inputs", async () => {
    sse.finalMessageMock.mockResolvedValue({
      content: [
        cardBlock("cliche", "valid card", "x"),
        // Invalid kind — should be dropped
        {
          type: "tool_use",
          name: "record_critique_card",
          input: { kind: "nonsense", body: "should be skipped" },
        },
      ],
      usage: { input_tokens: 50, output_tokens: 10 },
    });

    const res = await POST(makeRequest(baseBody, byoHeaders));
    const text = await res.text();
    const cardCount = (text.match(/event: card/g) ?? []).length;
    expect(cardCount).toBe(1);
    expect(text).toContain("valid card");
    expect(text).not.toContain("should be skipped");
  });

  it("emits done with no cards when the model produces no tool calls", async () => {
    sse.finalMessageMock.mockResolvedValue({
      content: [{ type: "text", text: "Hmm, draft looks clean." }],
      usage: { input_tokens: 30, output_tokens: 5 },
    });

    const res = await POST(makeRequest(baseBody, byoHeaders));
    const text = await res.text();
    expect(text).not.toContain("event: card");
    expect(text).toContain("event: done");
  });

  it("404s on an unknown guide_id", async () => {
    const res = await POST(
      makeRequest({ ...baseBody, guide_id: "ghost-xyz" }, byoHeaders),
    );
    expect(res.status).toBe(404);
    expect(sse.finalMessageMock).not.toHaveBeenCalled();
  });

  it("emits error frame when the SDK throws", async () => {
    sse.finalMessageMock.mockRejectedValue(new Error("rate limited"));

    const res = await POST(makeRequest(baseBody, byoHeaders));
    const text = await res.text();
    expect(text).toContain("event: error");
    expect(text).toContain("critique failed");
  });
});
