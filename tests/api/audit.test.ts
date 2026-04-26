import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

const { POST } = await import("@/app/api/audit/route");

function makeRequest(
  body: object | null,
  headers: Record<string, string> = {},
): NextRequest {
  return new Request("http://localhost/api/audit", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: body === null ? "" : JSON.stringify(body),
  }) as unknown as NextRequest;
}

const auditResponse = (flags: string[], reason: string) => ({
  content: [
    {
      type: "tool_use",
      name: "record_audit",
      input: { flags_tripped: flags, reason },
    },
  ],
});

const byoHeaders = { "X-Anthropic-Key": "sk-ant-test" };
const baseBody = {
  message: "What did she say when she answered the phone?",
  guide_id: "documentarian",
};

beforeEach(() => mockCreate.mockReset());

afterEach(() => {
  delete process.env.AUDIT_BLOCK;
});

describe("POST /api/audit — stub mode", () => {
  it("returns empty flags when no key is provided", async () => {
    const res = await POST(makeRequest(baseBody));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.stub).toBe(true);
    expect(json.flags_tripped).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe("POST /api/audit — real mode (Haiku mocked)", () => {
  it("returns empty flags on a clean message", async () => {
    mockCreate.mockResolvedValueOnce(auditResponse([], ""));
    const res = await POST(makeRequest(baseBody, byoHeaders));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.flags_tripped).toEqual([]);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("returns flags + reason when the model finds a violation", async () => {
    mockCreate.mockResolvedValueOnce(
      auditResponse(
        ["drafted_line"],
        "the third sentence is a poetic line in the artifact's register.",
      ),
    );
    const res = await POST(makeRequest(baseBody, byoHeaders));
    const json = await res.json();
    expect(json.flags_tripped).toEqual(["drafted_line"]);
    expect(json.reason).toContain("third sentence");
  });

  it("404s on an unknown guide_id", async () => {
    const res = await POST(
      makeRequest({ ...baseBody, guide_id: "ghost-xyz" }, byoHeaders),
    );
    expect(res.status).toBe(404);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("400s on a malformed body", async () => {
    const res = await POST(
      makeRequest({ message: "" } as unknown as object, byoHeaders),
    );
    expect(res.status).toBe(400);
  });

  it("400s on non-JSON body", async () => {
    const res = await POST(makeRequest(null, byoHeaders));
    expect(res.status).toBe(400);
  });
});
