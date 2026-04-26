import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/interview/turn/route";

function jsonRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/interview/turn", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("POST /api/interview/turn (stub)", () => {
  it("returns 400 on non-JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/interview/turn", {
        method: "POST",
        body: "not json",
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when guide_id is missing", async () => {
    const res = await POST(jsonRequest({ turn_index: 0 }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when guide_id has illegal characters", async () => {
    const res = await POST(jsonRequest({ guide_id: "bad/../id" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when turn_index is negative", async () => {
    const res = await POST(jsonRequest({ guide_id: "documentarian", turn_index: -1 }) as never);
    expect(res.status).toBe(400);
  });

  it("returns the first scripted question for turn_index 0", async () => {
    const res = await POST(jsonRequest({ guide_id: "documentarian", turn_index: 0 }) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      stub: boolean;
      turn_index: number;
      is_last: boolean;
      question: string;
      meta: string | null;
    };
    expect(body.stub).toBe(true);
    expect(body.turn_index).toBe(0);
    expect(body.is_last).toBe(false);
    expect(body.question.length).toBeGreaterThan(0);
  });

  it("clamps turn_index past the script and flags is_last", async () => {
    const res = await POST(jsonRequest({ guide_id: "documentarian", turn_index: 999 }) as never);
    expect(res.status).toBe(200);
    const body = (await res.json()) as { turn_index: number; is_last: boolean };
    expect(body.is_last).toBe(true);
    expect(body.turn_index).toBeGreaterThan(0);
  });

  it("extracts up to 2 mid-length sentences from user_text into phrases_held", async () => {
    const userText =
      "Her hands smelled of garlic. She always answered the phone the same way. Hi.";
    const res = await POST(
      jsonRequest({ guide_id: "poet", turn_index: 1, user_text: userText }) as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { phrases_held: string[] };
    expect(body.phrases_held.length).toBeGreaterThan(0);
    expect(body.phrases_held.length).toBeLessThanOrEqual(2);
    // 1-word fragments ("Hi.") must not be surfaced.
    expect(body.phrases_held.some((p) => p.split(" ").length < 3)).toBe(false);
  });

  it("returns empty phrases_held when user_text is omitted", async () => {
    const res = await POST(jsonRequest({ guide_id: "poet", turn_index: 0 }) as never);
    const body = (await res.json()) as { phrases_held: string[] };
    expect(body.phrases_held).toEqual([]);
  });

  it("reads X-Anthropic-Key without leaking it back to the response", async () => {
    const res = await POST(
      jsonRequest(
        { guide_id: "poet", turn_index: 0 },
        { "X-Anthropic-Key": "sk-ant-byo-secret" },
      ) as never,
    );
    const text = await res.text();
    expect(text).not.toContain("sk-ant-byo-secret");
  });
});
