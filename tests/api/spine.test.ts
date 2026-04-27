import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: mockCreate,
      stream: vi.fn(),
    },
  })),
}));

const { POST } = await import("@/app/api/spine/route");

function makeRequest(
  body: object | null,
  headers: Record<string, string> = {},
): NextRequest {
  const init: RequestInit = {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
  };
  if (body !== null) init.body = JSON.stringify(body);
  return new Request("http://localhost/api/spine", init) as unknown as NextRequest;
}

const happyResponse = (candidates: string[]) => ({
  content: [
    {
      type: "tool_use",
      name: "record_spine",
      input: {
        candidates,
        structure: [
          { label: "memory", sub: "the radio" },
          { label: "phrase", sub: "the dial" },
          { label: "inheritance", sub: "what passes down" },
        ],
      },
    },
  ],
});

const validBody = {
  guide_id: "documentarian",
  form: "letter" as const,
  turns: [
    {
      id: "u1",
      role: "user" as const,
      text: "His hands tuned the radio dial like it was a violin string.",
    },
    {
      id: "u2",
      role: "user" as const,
      text: "I tune the dial the same way now.",
    },
  ],
};

const byoHeaders = { "X-Anthropic-Key": "sk-ant-test" };

beforeEach(() => {
  mockCreate.mockReset();
});

describe("POST /api/spine — stub mode", () => {
  it("returns canned candidates with no body", async () => {
    const res = await POST(makeRequest(null));
    expect(res.headers.get("X-Mean-It-Stub")).toBe("1");
    const json = await res.json();
    expect(json.stub).toBe(true);
    expect(json.candidates).toBeInstanceOf(Array);
    expect(json.candidates.length).toBeGreaterThanOrEqual(2);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns stub when no key is provided (even with valid body)", async () => {
    const res = await POST(makeRequest(validBody));
    const json = await res.json();
    expect(json.stub).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns stub when key present but no user turns", async () => {
    const res = await POST(
      makeRequest(
        { guide_id: "documentarian", form: "letter" },
        byoHeaders,
      ),
    );
    const json = await res.json();
    expect(json.stub).toBe(true);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("400s on a malformed body", async () => {
    const res = await POST(
      makeRequest(
        { guide_id: "x", turns: "not an array" } as unknown as object,
        byoHeaders,
      ),
    );
    expect(res.status).toBe(400);
  });
});

describe("POST /api/spine — real mode (Haiku mocked)", () => {
  it("returns candidates + structure on a clean response", async () => {
    mockCreate.mockResolvedValueOnce(
      happyResponse([
        "tuned the radio dial like it was a violin string",
        "I tune the dial the same way now",
      ]),
    );

    const res = await POST(makeRequest(validBody, byoHeaders));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.candidates).toHaveLength(2);
    expect(json.candidates[0].text).toContain("violin string");
    expect(json.candidates[0].source_turn_id).toBeTruthy();
    expect(json.structure).toHaveLength(3);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("retries once when a phrase is non-verbatim and succeeds on retry", async () => {
    mockCreate
      .mockResolvedValueOnce(
        happyResponse([
          "he loved the radio", // paraphrased — not a substring
          "I tune the dial the same way now",
        ]),
      )
      .mockResolvedValueOnce(
        happyResponse([
          "tuned the radio dial like it was a violin string",
          "I tune the dial the same way now",
        ]),
      );

    const res = await POST(makeRequest(validBody, byoHeaders));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.candidates).toHaveLength(2);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("502s when retry also fails", async () => {
    const bad = happyResponse([
      "totally fabricated phrase",
      "another one that's not in the text",
    ]);
    mockCreate.mockResolvedValueOnce(bad).mockResolvedValueOnce(bad);

    const res = await POST(makeRequest(validBody, byoHeaders));
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toContain("non-verbatim");
    expect(json.bad).toBeInstanceOf(Array);
    expect(mockCreate).toHaveBeenCalledTimes(2);
  });

  it("404s on an unknown guide_id", async () => {
    const res = await POST(
      makeRequest(
        { ...validBody, guide_id: "nonexistent-guide" },
        byoHeaders,
      ),
    );
    expect(res.status).toBe(404);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("passes the second-attempt strict-retry instruction with the bad phrases", async () => {
    mockCreate
      .mockResolvedValueOnce(happyResponse(["paraphrased nonsense"]))
      .mockResolvedValueOnce(
        happyResponse([
          "tuned the radio dial like it was a violin string",
          "I tune the dial the same way now",
        ]),
      );

    await POST(makeRequest(validBody, byoHeaders));

    expect(mockCreate).toHaveBeenCalledTimes(2);
    const secondCall = mockCreate.mock.calls[1]![0];
    const systemBlocks = secondCall.system as Array<{ text: string }>;
    expect(systemBlocks[0]!.text).toContain("STRICTNESS REMINDER");
    expect(systemBlocks[0]!.text).toContain("paraphrased nonsense");
  });
});
