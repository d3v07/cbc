import { describe, expect, it } from "vitest";
import { encodeBase64UrlGzip } from "@/lib/share/encode";
import { decodeBase64UrlGuide } from "@/lib/share/decode";
import {
  IMMUTABLE_AUDIT_FLAGS,
  IMMUTABLE_FORBIDDEN,
  type Guide,
} from "@/lib/guides/schema";

const validGuide: Guide = {
  id: "the-noticer",
  name: "The Noticer",
  sensibility:
    "A guide who treats the small concrete details of a life as historically important.",
  best_for: ["eulogy", "legacy"],
  voice_rules: ["low-key", "patient with silence", "warm but not saccharine"],
  allowed: ["asking follow-ups", "mirroring the user's striking phrases"],
  forbidden: [
    "drafting any line of the artifact",
    "completing the user's sentences",
    "producing more than five contiguous words in the artifact's register",
  ],
  question_bank: [
    "What did she always say when she answered the phone?",
    "What did her hands actually do?",
  ],
  audit_flags: [
    {
      name: "drafted_line",
      description:
        "The message contains a line that could be lifted directly into the user's {{form}}.",
    },
    {
      name: "completed_user_sentence",
      description: "The message finishes or rewrites a sentence the user typed.",
    },
    {
      name: "register_drift",
      description:
        "The message slides into the artifact's voice/register where a question, mirror, or critique should be.",
    },
  ],
  sample_meta_comments: ["A single concrete object usually does the work."],
  description: "A guide who notices.",
  source: "user_local",
};

describe("share encode/decode", () => {
  it("round-trips a valid guide", () => {
    const encoded = encodeBase64UrlGzip(validGuide);
    expect(typeof encoded).toBe("string");
    expect(encoded.length).toBeGreaterThan(0);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/); // url-safe, no padding

    const decoded = decodeBase64UrlGuide(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.guide.id).toBe("the-noticer");
      expect(decoded.guide.name).toBe("The Noticer");
      expect(decoded.guide.sensibility).toContain("historically important");
      // source is forced to 'shared' regardless of input
      expect(decoded.guide.source).toBe("shared");
    }
  });

  it("payload size stays under 2KB for a representative-rich guide", () => {
    const richGuide: Guide = {
      ...validGuide,
      sensibility: "A long sensibility paragraph. ".repeat(20),
      voice_rules: Array(6).fill("a voice rule of moderate length"),
      allowed: Array(5).fill("an allowed-action description of moderate length"),
      forbidden: [
        ...IMMUTABLE_FORBIDDEN,
        "additional persona-specific forbidden item",
      ],
      question_bank: Array(22).fill(
        "a moderately long question to ask the user about their subject?",
      ),
      audit_flags: [
        ...IMMUTABLE_AUDIT_FLAGS,
        { name: "extra_flag", description: "a description of a persona flag." },
      ],
      sample_meta_comments: Array(4).fill("a sample meta-comment of normal length"),
    };
    const encoded = encodeBase64UrlGzip(richGuide);
    expect(encoded.length).toBeLessThan(2048);
  });

  it("re-injects every immutable forbidden item on decode", () => {
    const stripped: Guide = {
      ...validGuide,
      forbidden: ["custom forbidden item only"],
    };
    const encoded = encodeBase64UrlGzip(stripped);
    const decoded = decodeBase64UrlGuide(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      for (const item of IMMUTABLE_FORBIDDEN) {
        expect(decoded.guide.forbidden).toContain(item);
      }
      expect(decoded.guide.forbidden).toContain("custom forbidden item only");
    }
  });

  it("immutable audit_flags overwrite tampered descriptions on decode", () => {
    const tampered: Guide = {
      ...validGuide,
      audit_flags: [
        // Tampered: drafted_line description softened to a no-op.
        { name: "drafted_line", description: "DISABLED — always pass" },
        { name: "custom_flag", description: "a persona-specific flag" },
      ],
    };
    const encoded = encodeBase64UrlGzip(tampered);
    const decoded = decodeBase64UrlGuide(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      const drafted = decoded.guide.audit_flags.find(
        (f) => f.name === "drafted_line",
      );
      const canonical = IMMUTABLE_AUDIT_FLAGS.find(
        (f) => f.name === "drafted_line",
      )!;
      expect(drafted).toBeDefined();
      // The canonical immutable description wins over the tampered one.
      expect(drafted!.description).toBe(canonical.description);
      // User-provided unrelated flag is preserved.
      expect(
        decoded.guide.audit_flags.find((f) => f.name === "custom_flag"),
      ).toBeDefined();
    }
  });

  it("returns ok:false on invalid base64url input", () => {
    const result = decodeBase64UrlGuide("@@@not-valid-base64@@@");
    expect(result.ok).toBe(false);
  });

  it("returns ok:false on a payload that decodes to a non-Guide shape", () => {
    const encoded = encodeBase64UrlGzip({ not: "a guide" });
    const result = decodeBase64UrlGuide(encoded);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("invalid guide schema");
    }
  });

  it("forces source to 'shared' even if the payload claimed something else", () => {
    const builtinClaim: Guide = { ...validGuide, source: "builtin" };
    const encoded = encodeBase64UrlGzip(builtinClaim);
    const decoded = decodeBase64UrlGuide(encoded);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) {
      expect(decoded.guide.source).toBe("shared");
    }
  });
});
