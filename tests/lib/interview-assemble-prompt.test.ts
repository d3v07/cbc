import { afterEach, describe, expect, it } from "vitest";
import {
  _resetTemplateCache,
  assemblePrompt,
} from "@/lib/interview/assemble-prompt";
import type { Guide } from "@/lib/guides/schema";

const stubGuide: Guide = {
  id: "test-guide",
  name: "The Tester",
  sensibility: "Sensible.",
  best_for: ["test"],
  voice_rules: ["be brief", "ask questions"],
  allowed: ["ask follow-ups"],
  forbidden: ["draft any line of the artifact"],
  question_bank: ["Why?", "How so?"],
  audit_flags: [{ name: "drafted_line", description: "..." }],
  sample_meta_comments: ["pithy"],
  description: "",
  source: "builtin",
};

afterEach(() => _resetTemplateCache());

describe("assemblePrompt", () => {
  it("substitutes form / recipient / occasion into the template", () => {
    const out = assemblePrompt({
      guide: stubGuide,
      recipient: "Tomas",
      occasion: "eulogy",
      form: "letter",
    });
    expect(out).toContain("**Tomas**");
    expect(out).toContain("**eulogy**");
    expect(out).toContain("**letter**");
  });

  it("substitutes guide.name and guide.sensibility", () => {
    const out = assemblePrompt({
      guide: stubGuide,
      recipient: "x",
      occasion: "x",
      form: "letter",
    });
    expect(out).toContain("The Tester");
    expect(out).toContain("Sensible.");
  });

  it("expands each-blocks for every guide array field", () => {
    const out = assemblePrompt({
      guide: stubGuide,
      recipient: "x",
      occasion: "x",
      form: "letter",
    });
    // voice_rules
    expect(out).toContain("- be brief");
    expect(out).toContain("- ask questions");
    // allowed
    expect(out).toContain("- ask follow-ups");
    // forbidden
    expect(out).toContain("- draft any line of the artifact");
    // sample_meta_comments
    expect(out).toContain("- pithy");
    // question_bank
    expect(out).toContain("- Why?");
    expect(out).toContain("- How so?");
  });

  it("strips the doc preamble (everything before ---)", () => {
    const out = assemblePrompt({
      guide: stubGuide,
      recipient: "x",
      occasion: "x",
      form: "letter",
    });
    // The preamble describes the placeholders themselves, so its presence
    // would mean we forgot to strip it.
    expect(out).not.toContain("Render placeholders:");
  });

  it("appends a theme voice block; differs by theme", () => {
    const gothic = assemblePrompt({
      guide: stubGuide,
      recipient: "x",
      occasion: "x",
      form: "letter",
      theme: "gothic",
    });
    const cute = assemblePrompt({
      guide: stubGuide,
      recipient: "x",
      occasion: "x",
      form: "letter",
      theme: "cute",
    });
    expect(gothic).toContain("Theme voice");
    expect(cute).toContain("Theme voice");
    expect(gothic).not.toEqual(cute);
  });

  it("defaults to the warm theme voice when theme is omitted", () => {
    const omitted = assemblePrompt({
      guide: stubGuide,
      recipient: "x",
      occasion: "x",
      form: "letter",
    });
    const warm = assemblePrompt({
      guide: stubGuide,
      recipient: "x",
      occasion: "x",
      form: "letter",
      theme: "warm",
    });
    expect(omitted).toEqual(warm);
  });

  it("leaves no unresolved {{ placeholders }}", () => {
    const out = assemblePrompt({
      guide: stubGuide,
      recipient: "x",
      occasion: "x",
      form: "letter",
      theme: "quiet",
    });
    expect(out).not.toMatch(/\{\{[^}]+\}\}/);
  });
});
