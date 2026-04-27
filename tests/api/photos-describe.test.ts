import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/env", () => ({
  env: () => ({ ANTHROPIC_API_KEY: "test-key", NODE_ENV: "test" }),
}));

const createMock = vi.fn();
vi.mock("@/lib/anthropic", () => ({
  anthropic: () => ({ beta: { messages: { create: createMock } } }),
}));

import { POST } from "@/app/api/photos/describe/route";

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/photos/describe", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function toolUseResponse(input: Record<string, string>) {
  return {
    content: [{ type: "tool_use", name: "record_photo_description", input }],
  };
}

describe("POST /api/photos/describe", () => {
  beforeEach(() => createMock.mockReset());

  it("rejects missing file_ids with 400", async () => {
    const res = await POST(makeRequest({}) as never);
    expect(res.status).toBe(400);
  });

  it("rejects empty file_ids array", async () => {
    const res = await POST(makeRequest({ file_ids: [] }) as never);
    expect(res.status).toBe(400);
  });

  it("rejects > 8 file_ids", async () => {
    const res = await POST(
      makeRequest({ file_ids: Array(9).fill("file_x") }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("describes photos in parallel and returns merged shape", async () => {
    createMock
      .mockResolvedValueOnce(
        toolUseResponse({ subject: "grandmother", setting: "kitchen", mood: "warm" }),
      )
      .mockResolvedValueOnce(
        toolUseResponse({ subject: "candle", setting: "windowsill", mood: "still" }),
      );

    const res = await POST(makeRequest({ file_ids: ["f1", "f2"] }) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      descriptions: Array<{ file_id: string; subject: string }>;
    };
    expect(body.descriptions).toHaveLength(2);
    expect(body.descriptions[0]?.file_id).toBe("f1");
    expect(body.descriptions[0]?.subject).toBe("grandmother");
    expect(body.descriptions[1]?.subject).toBe("candle");
    expect(createMock).toHaveBeenCalledTimes(2);
  });

  it("returns 502 when the model omits the tool call", async () => {
    createMock.mockResolvedValueOnce({ content: [{ type: "text", text: "no tool" }] });
    const res = await POST(makeRequest({ file_ids: ["f1"] }) as never);
    expect(res.status).toBe(502);
  });

  it("propagates upstream status code", async () => {
    createMock.mockRejectedValueOnce(Object.assign(new Error("rate"), { status: 429 }));
    const res = await POST(makeRequest({ file_ids: ["f1"] }) as never);
    expect(res.status).toBe(429);
  });
});
