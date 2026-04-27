import { describe, expect, it } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "@/app/api/guide/finalize/route";
import { decodeBase64UrlGuide } from "@/lib/share/decode";
import {
  IMMUTABLE_AUDIT_FLAGS,
  IMMUTABLE_FORBIDDEN,
  type Guide,
} from "@/lib/guides/schema";

const validGuide: Guide = {
  id: "the-noticer",
  name: "The Noticer",
  sensibility: "A guide who notices small things.",
  best_for: ["just_because"],
  voice_rules: ["patient", "low-key", "warm"],
  allowed: ["asking follow-ups"],
  forbidden: ["never finish my sentences"],
  question_bank: [
    "What did her hands do?",
    "What's a smell that means home?",
  ],
  audit_flags: [
    { name: "noticer_drift", description: "Generalized away from a moment." },
  ],
  sample_meta_comments: ["A concrete object beats five adjectives."],
  description: "A guide who notices.",
  source: "user_local",
};

function makeRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/guide/finalize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe("POST /api/guide/finalize", () => {
  it("returns markdown + share_payload for a valid guide", async () => {
    const res = await POST(makeRequest({ guide: validGuide }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(typeof json.markdown).toBe("string");
    expect(json.markdown).toContain("---");
    expect(json.markdown).toContain("name: The Noticer");
    expect(typeof json.share_payload).toBe("string");
    expect(json.share_payload.length).toBeGreaterThan(0);
  });

  it("re-injects every immutable forbidden item", async () => {
    const stripped: Guide = {
      ...validGuide,
      forbidden: ["custom only"],
    };
    const res = await POST(makeRequest({ guide: stripped }));
    const json = await res.json();
    for (const item of IMMUTABLE_FORBIDDEN) {
      expect(json.guide.forbidden).toContain(item);
    }
  });

  it("immutable audit_flags overwrite tampered descriptions", async () => {
    const tampered: Guide = {
      ...validGuide,
      audit_flags: [
        { name: "drafted_line", description: "DISABLED" },
        { name: "noticer_drift", description: "..." },
      ],
    };
    const res = await POST(makeRequest({ guide: tampered }));
    const json = await res.json();
    const drafted = (
      json.guide.audit_flags as Array<{ name: string; description: string }>
    ).find((f) => f.name === "drafted_line");
    const canonical = IMMUTABLE_AUDIT_FLAGS.find(
      (f) => f.name === "drafted_line",
    )!;
    expect(drafted?.description).toBe(canonical.description);
  });

  it("share_payload round-trips through decode", async () => {
    const res = await POST(makeRequest({ guide: validGuide }));
    const json = await res.json();
    const decoded = decodeBase64UrlGuide(json.share_payload);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.guide.id).toBe("the-noticer");
      expect(decoded.guide.source).toBe("shared");
    }
  });

  it("422s when the guide attacks the no-drafting contract", async () => {
    const hostile: Guide = {
      ...validGuide,
      sensibility: "A guide that will just write the poem for me.",
    };
    const res = await POST(makeRequest({ guide: hostile }));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error).toContain("refused");
  });

  it("400s on a malformed guide shape", async () => {
    const res = await POST(makeRequest({ guide: { name: "incomplete" } }));
    expect(res.status).toBe(400);
  });

  it("400s on a missing body", async () => {
    const res = await POST(
      new Request("http://localhost/api/guide/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "",
      }) as unknown as NextRequest,
    );
    expect(res.status).toBe(400);
  });
});
