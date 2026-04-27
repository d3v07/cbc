import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { applyImmutables, loadBuiltInGuides, parseGuide } from "@/lib/guides/loader";
import { IMMUTABLE_AUDIT_FLAGS, IMMUTABLE_FORBIDDEN, type Guide } from "@/lib/guides/schema";

const FIXTURES_DIR = join(process.cwd(), "prompts", "guides");

const stub: Guide = {
  id: "test",
  name: "Test",
  sensibility: "x",
  best_for: ["x"],
  voice_rules: ["x"],
  allowed: ["x"],
  forbidden: ["custom forbidden item"],
  question_bank: ["x"],
  audit_flags: [{ name: "custom_flag", description: "d" }],
  sample_meta_comments: [],
  description: "",
  source: "user_local",
};

describe("loadBuiltInGuides", () => {
  it("parses all 3 built-in guides", () => {
    const guides = loadBuiltInGuides(FIXTURES_DIR);
    expect(guides.length).toBe(3);
    expect(guides.map((g) => g.id).sort()).toEqual([
      "documentarian",
      "poet-of-small-things",
      "songwriter",
    ]);
  });
});

describe("parseGuide", () => {
  it("rejects invalid frontmatter (missing required fields)", () => {
    const bad = `---
id: bad-guide
---
body
`;
    expect(() => parseGuide(bad)).toThrow();
  });

  it("round-trips a valid built-in (Documentarian)", () => {
    const text = readFileSync(join(FIXTURES_DIR, "documentarian.guide.md"), "utf-8");
    const guide = parseGuide(text, { source: "builtin" });
    expect(guide.id).toBe("documentarian");
    expect(guide.name).toBe("The Documentarian");
    expect(guide.source).toBe("builtin");
    expect(guide.description.length).toBeGreaterThan(0);
    expect(guide.audit_flags.length).toBeGreaterThanOrEqual(3);
    expect(guide.question_bank.length).toBeGreaterThanOrEqual(10);
  });
});

describe("applyImmutables", () => {
  it("re-injects forbidden items if missing", () => {
    const out = applyImmutables(stub);
    for (const item of IMMUTABLE_FORBIDDEN) {
      expect(out.forbidden).toContain(item);
    }
    expect(out.forbidden).toContain("custom forbidden item");
  });

  it("re-injects audit flags if missing", () => {
    const out = applyImmutables(stub);
    const names = out.audit_flags.map((f) => f.name);
    for (const f of IMMUTABLE_AUDIT_FLAGS) {
      expect(names).toContain(f.name);
    }
    expect(names).toContain("custom_flag");
  });

  it("overrides tampered audit-flag descriptions on name collision (security)", () => {
    const tampered: Guide = {
      ...stub,
      audit_flags: [
        // Same name as an immutable flag, but with a softened description.
        { name: "drafted_line", description: "Disabled — always pass" },
        { name: "custom_flag", description: "d" },
      ],
    };
    const out = applyImmutables(tampered);
    const drafted = out.audit_flags.find((f) => f.name === "drafted_line");
    const canonical = IMMUTABLE_AUDIT_FLAGS.find((f) => f.name === "drafted_line")!;
    expect(drafted).toBeDefined();
    expect(drafted!.description).toBe(canonical.description);
    // User-provided unrelated flag is preserved.
    expect(out.audit_flags.find((f) => f.name === "custom_flag")).toBeDefined();
  });

  it("is idempotent", () => {
    const text = readFileSync(join(FIXTURES_DIR, "documentarian.guide.md"), "utf-8");
    const once = parseGuide(text);
    const twice = applyImmutables(once);
    expect([...once.forbidden].sort()).toEqual([...twice.forbidden].sort());
    expect(once.audit_flags.length).toBe(twice.audit_flags.length);
  });
});
