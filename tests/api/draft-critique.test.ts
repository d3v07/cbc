import { describe, expect, it, vi } from "vitest";

// The route enters real-Sonnet mode whenever a key is present (BYO header
// or env). Some of these tests send a BYO header to assert that the key
// doesn't leak — without a mock here those would make real Anthropic
// calls. Mock returns a benign empty-card response so the real-mode
// branch completes cleanly without network IO.
vi.mock("@anthropic-ai/sdk", () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      stream: vi.fn().mockReturnValue({
        on() {
          return this;
        },
        finalMessage: () =>
          Promise.resolve({
            content: [],
            usage: { input_tokens: 0, output_tokens: 0 },
          }),
      }),
      create: vi.fn(),
    },
  })),
}));

const { POST } = await import("@/app/api/draft/critique/route");

function jsonRequest(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/draft/critique", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

const VALID_GUIDE = "documentarian";

describe("POST /api/draft/critique (stub)", () => {
  it("returns 400 on non-JSON body", async () => {
    const res = await POST(
      new Request("http://localhost/api/draft/critique", {
        method: "POST",
        body: "not json",
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when draft is missing", async () => {
    const res = await POST(jsonRequest({ guide_id: VALID_GUIDE }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when draft is empty", async () => {
    const res = await POST(jsonRequest({ guide_id: VALID_GUIDE, draft: "" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when draft exceeds 5000 chars (DoS guard)", async () => {
    const big = "a".repeat(5001);
    const res = await POST(jsonRequest({ guide_id: VALID_GUIDE, draft: big }) as never);
    expect(res.status).toBe(400);
  });

  it("accepts a 5000-char draft (boundary)", async () => {
    const big = "a".repeat(5000);
    const res = await POST(jsonRequest({ guide_id: VALID_GUIDE, draft: big }) as never);
    expect(res.status).toBe(200);
  });

  it("returns 400 when guide_id has illegal characters", async () => {
    const res = await POST(
      jsonRequest({ guide_id: "../etc/passwd", draft: "anything" }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when turns array exceeds the cap", async () => {
    const turns = Array.from({ length: 41 }, (_, i) => ({
      id: `t${i}`,
      role: "user",
      text: "x",
    }));
    const res = await POST(
      jsonRequest({ guide_id: VALID_GUIDE, draft: "x", turns }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("emits a cliché card when a stock phrase is present", async () => {
    const res = await POST(
      jsonRequest({
        guide_id: VALID_GUIDE,
        draft: "She will be forever in our hearts.",
      }) as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cards: Array<{ kind: string; line_ref?: string }> };
    expect(body.cards.find((c) => c.kind === "cliche")).toBeDefined();
  });

  it("emits a question card on the 'simpler' trigger", async () => {
    const res = await POST(
      jsonRequest({
        guide_id: VALID_GUIDE,
        draft: "and the world was simpler then",
      }) as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cards: Array<{ kind: string }> };
    expect(body.cards.find((c) => c.kind === "question")).toBeDefined();
  });

  it("emits a verified-yours card when a long run from a user turn appears in the draft", async () => {
    const phrase = "her hands always smelled like garlic";
    const res = await POST(
      jsonRequest({
        guide_id: VALID_GUIDE,
        draft: `${phrase} and orange peel.`,
        turns: [{ id: "t1", role: "user", text: phrase }],
      }) as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { cards: Array<{ kind: string; line_ref?: string }> };
    const verified = body.cards.find((c) => c.kind === "verified");
    expect(verified).toBeDefined();
    expect(verified!.line_ref).toContain("garlic");
  });

  it("falls through to a generic question card when nothing else matches", async () => {
    const res = await POST(
      jsonRequest({
        guide_id: VALID_GUIDE,
        draft: "Quiet evenings by the window.",
        turns: [],
      }) as never,
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      cards: Array<{ kind: string; body: string }>;
    };
    expect(body.cards.length).toBeGreaterThanOrEqual(1);
    expect(body.cards.every((c) => ["cliche", "question", "verified"].includes(c.kind))).toBe(true);
  });

  it("does not echo the BYO-key header back into the response", async () => {
    const res = await POST(
      jsonRequest(
        { guide_id: VALID_GUIDE, draft: "anything" },
        { "X-Anthropic-Key": "sk-ant-byo-secret" },
      ) as never,
    );
    const text = await res.text();
    expect(text).not.toContain("sk-ant-byo-secret");
  });
});
