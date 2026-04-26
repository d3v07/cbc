import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

// Mock state shared between the SDK mock and the test bodies. `vi.hoisted`
// lifts this so the factory inside `vi.mock("@anthropic-ai/sdk")` can close
// over it before the route module is imported.
const sse = vi.hoisted(() => {
  const handlers: Record<string, Array<(arg: unknown) => void>> = {};
  const finalMessageMock = vi.fn();
  const mockStream = {
    on(event: string, handler: (arg: unknown) => void) {
      (handlers[event] = handlers[event] ?? []).push(handler);
      return mockStream;
    },
    finalMessage() {
      return finalMessageMock();
    },
  };
  const triggerText = (text: string) => {
    (handlers.text ?? []).forEach((h) => (h as (t: string) => void)(text));
  };
  const reset = () => {
    for (const k of Object.keys(handlers)) delete handlers[k];
    finalMessageMock.mockReset();
  };
  return { mockStream, finalMessageMock, triggerText, reset };
});

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockReturnValue(sse.mockStream),
      create: vi.fn(),
    },
  })),
}));

const { POST } = await import("@/app/api/interview/turn/route");

function makeRequest(
  body: object,
  headers: Record<string, string> = {},
): NextRequest {
  return new Request("http://localhost/api/interview/turn", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const canonicalBody = {
  session: { recipient: "Tomas", occasion: "eulogy", form: "letter" as const },
  guide_id: "documentarian",
  turns: [
    { id: "g1", role: "guide" as const, text: "How did she answer the phone?" },
    {
      id: "u1",
      role: "user" as const,
      text: "Yes she said pronto when answering — every time.",
    },
  ],
  theme: "quiet" as const,
};
const byoHeaders = { "X-Anthropic-Key": "sk-ant-test" };

beforeEach(() => sse.reset());

describe("POST /api/interview/turn — real mode SSE", () => {
  it("streams delta tokens, then phrases_held, then done", async () => {
    sse.finalMessageMock.mockImplementation(async () => {
      sse.triggerText("What ");
      sse.triggerText("did she ");
      sse.triggerText("say?");
      return {
        content: [
          {
            type: "tool_use",
            name: "record_phrases_held",
            input: { phrases: ["she said pronto"] },
          },
        ],
        usage: {
          input_tokens: 200,
          output_tokens: 8,
          cache_read_input_tokens: 150,
          cache_creation_input_tokens: 0,
        },
      };
    });

    const res = await POST(makeRequest(canonicalBody, byoHeaders));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/event-stream");

    const text = await res.text();

    // Three deltas in order
    expect(text).toContain("event: delta");
    expect(text.indexOf("What ")).toBeGreaterThan(-1);
    expect(text.indexOf("did she ")).toBeGreaterThan(text.indexOf("What "));
    expect(text.indexOf("say?")).toBeGreaterThan(text.indexOf("did she "));

    // phrases_held with the verbatim phrase
    expect(text).toContain("event: phrases_held");
    expect(text).toContain("she said pronto");

    // done at the end
    expect(text).toContain("event: done");
    expect(text.lastIndexOf("event: done")).toBeGreaterThan(
      text.indexOf("event: phrases_held"),
    );
  });

  it("filters non-verbatim phrases out of phrases_held", async () => {
    sse.finalMessageMock.mockImplementation(async () => {
      sse.triggerText("Q?");
      return {
        content: [
          {
            type: "tool_use",
            name: "record_phrases_held",
            input: {
              phrases: [
                "she said pronto", // verbatim — kept
                "she greeted strangers warmly", // paraphrase — dropped
              ],
            },
          },
        ],
        usage: { input_tokens: 50, output_tokens: 2 },
      };
    });

    const res = await POST(makeRequest(canonicalBody, byoHeaders));
    const text = await res.text();
    expect(text).toContain("she said pronto");
    expect(text).not.toContain("she greeted strangers warmly");
  });

  it("emits done even when the model never calls the tool", async () => {
    sse.finalMessageMock.mockImplementation(async () => {
      sse.triggerText("Just text, no tool.");
      return {
        content: [{ type: "text", text: "Just text, no tool." }],
        usage: { input_tokens: 10, output_tokens: 5 },
      };
    });

    const res = await POST(makeRequest(canonicalBody, byoHeaders));
    const text = await res.text();
    expect(text).toContain("event: delta");
    expect(text).not.toContain("event: phrases_held");
    expect(text).toContain("event: done");
  });

  it("404s on an unknown guide_id", async () => {
    const res = await POST(
      makeRequest(
        { ...canonicalBody, guide_id: "ghost-guide-xyz" },
        byoHeaders,
      ),
    );
    expect(res.status).toBe(404);
    expect(sse.finalMessageMock).not.toHaveBeenCalled();
  });

  it("emits an error frame when the SDK throws", async () => {
    sse.finalMessageMock.mockImplementation(async () => {
      sse.triggerText("partial...");
      throw new Error("network blew up");
    });

    const res = await POST(makeRequest(canonicalBody, byoHeaders));
    const text = await res.text();
    expect(text).toContain("event: error");
    expect(text).toContain("interview turn failed");
  });
});
