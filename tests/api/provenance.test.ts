import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "@/app/api/provenance/route";

function makeRequest(body: unknown, raw = false): NextRequest {
  return new Request("http://localhost/api/provenance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/provenance", () => {
  it("returns provenance + byline_pct on a valid request", async () => {
    const res = await POST(
      makeRequest({
        artifact: "Hello world",
        turns: [
          {
            id: "u1",
            session_id: "s",
            role: "user",
            text: "Hello world is what I said.",
            ts: 1,
          },
        ],
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      provenance: Array<{ match: string }>;
      byline_pct: number;
    };
    expect(json.provenance[0]!.match).toBe("exact");
    expect(json.byline_pct).toBe(100);
  });

  it("400s on a malformed body", async () => {
    const res = await POST(
      makeRequest({ artifact: "x" /* missing turns */ }),
    );
    expect(res.status).toBe(400);
  });

  it("400s on non-JSON body", async () => {
    const res = await POST(makeRequest("not json", true));
    expect(res.status).toBe(400);
  });

  it("returns byline_pct 0 with empty turns", async () => {
    const res = await POST(
      makeRequest({ artifact: "anything goes", turns: [] }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { byline_pct: number };
    expect(json.byline_pct).toBe(0);
  });

  it("accepts turns with optional fields omitted", async () => {
    const res = await POST(
      makeRequest({
        artifact: "Hello",
        turns: [{ id: "u1", role: "user", text: "Hello and goodbye." }],
      }),
    );
    expect(res.status).toBe(200);
  });
});
