import { describe, expect, it } from "vitest";
import { matchProvenance } from "@/lib/provenance/match";
import type { Turn } from "@/lib/types/session";

const userTurn = (id: string, text: string): Turn => ({
  id,
  session_id: "s",
  role: "user",
  text,
  ts: 1,
});

describe("matchProvenance", () => {
  it("matches an exact substring as 'exact' and tags the source turn", () => {
    const turns = [
      userTurn("u1", "Her hands always smelled like garlic and orange peel."),
    ];
    const result = matchProvenance("Her hands", turns);
    expect(result.provenance[0]!.match).toBe("exact");
    expect(result.provenance[0]!.source_turn_id).toBe("u1");
    expect(result.provenance[0]!.source_text).toContain("garlic");
  });

  it("byline_pct is 100 when every line exact-matches", () => {
    const turns = [
      userTurn(
        "u1",
        "Her hands smelled like garlic. The kitchen was small.",
      ),
    ];
    const artifact = "Her hands smelled like garlic\nThe kitchen was small";
    const result = matchProvenance(artifact, turns);
    expect(result.byline_pct).toBe(100);
    expect(result.provenance.every((p) => p.match === "exact")).toBe(true);
  });

  it("matches a typoed line within 2 edits per word as 'fuzzy'", () => {
    const turns = [userTurn("u1", "Her hands smelled like garlic")];
    // hnads / smeld are within ≤2 edits of hands / smelled.
    const result = matchProvenance("Her hnads smeld like garlic", turns);
    expect(result.provenance[0]!.match).toBe("fuzzy");
  });

  it("returns 'none' for paraphrased lines (more than 2 edits per word)", () => {
    const turns = [userTurn("u1", "Her hands smelled like garlic")];
    const result = matchProvenance("Her arms reeked of pepper", turns);
    expect(result.provenance[0]!.match).toBe("none");
  });

  it("credits exact user phrases inside longer artifact lines", () => {
    const turns = [
      userTurn(
        "u1",
        'She always answered my calls with "report from the field?" like I was sending dispatches from school.',
      ),
    ];
    const result = matchProvenance(
      'You answered my calls with "report from the field?" and my smallest updates mattered.',
      turns,
    );

    expect(result.provenance[0]!.match).toBe("fuzzy");
    expect(result.provenance[0]!.source_turn_id).toBe("u1");
    expect(result.byline_pct).toBeGreaterThan(0);
  });

  it("preserves blank lines as 'none' without affecting byline_pct", () => {
    const turns = [userTurn("u1", "Hello world")];
    const result = matchProvenance("Hello world\n\nHello world", turns);
    expect(result.provenance).toHaveLength(3);
    expect(result.provenance[0]!.match).toBe("exact");
    expect(result.provenance[1]!.match).toBe("none");
    expect(result.provenance[1]!.line).toBe("");
    expect(result.provenance[2]!.match).toBe("exact");
    // 4 verified words / 4 total → 100
    expect(result.byline_pct).toBe(100);
  });

  it("returns byline_pct 0 on empty input", () => {
    const result = matchProvenance("", []);
    expect(result.byline_pct).toBe(0);
    expect(result.provenance[0]!.match).toBe("none");
  });

  it("ignores guide turns when matching", () => {
    const turns: Turn[] = [
      {
        id: "g1",
        session_id: "s",
        role: "guide",
        text: "What did she say?",
        ts: 1,
      },
      userTurn("u1", "She said pronto"),
    ];
    // The guide's text is an exact substring of the artifact, but guides aren't sources.
    const result = matchProvenance("What did she say?", turns);
    expect(result.provenance[0]!.match).toBe("none");
  });

  it("computes byline_pct correctly for mixed exact/none lines", () => {
    const turns = [userTurn("u1", "First line of user content")];
    const artifact = "First line\nUnrelated paraphrased prose here entirely";
    const result = matchProvenance(artifact, turns);
    expect(result.provenance[0]!.match).toBe("exact");
    expect(result.provenance[1]!.match).toBe("none");
    // 2 verified words ("First line") + 6 unverified ("Unrelated paraphrased prose here entirely") = 8 total.
    // wait, "Unrelated paraphrased prose here entirely" is 5 words. Recompute.
    // verified=2, total=2+5=7, pct=2/7≈29
    expect(result.byline_pct).toBeGreaterThan(20);
    expect(result.byline_pct).toBeLessThan(40);
  });

  it("preserves the original line whitespace in the output", () => {
    const turns = [userTurn("u1", "indented content")];
    const result = matchProvenance("  indented content  ", turns);
    expect(result.provenance[0]!.line).toBe("  indented content  ");
    expect(result.provenance[0]!.match).toBe("exact");
  });

  it("is empty turns => everything is 'none'", () => {
    const result = matchProvenance("Some artifact text\nAnother line", []);
    expect(result.provenance.every((p) => p.match === "none")).toBe(true);
    expect(result.byline_pct).toBe(0);
  });
});
