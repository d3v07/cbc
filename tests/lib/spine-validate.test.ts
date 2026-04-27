import { describe, expect, it } from "vitest";
import { verbatimOnly } from "@/lib/spine/validate";

describe("verbatimOnly", () => {
  it("matches exact substrings within a single turn", () => {
    const turns = ["He always said pronto when he answered the phone."];
    const { ok, bad } = verbatimOnly(["pronto", "answered the phone"], turns);
    expect(ok).toEqual(["pronto", "answered the phone"]);
    expect(bad).toEqual([]);
  });

  it("rejects paraphrased candidates", () => {
    const turns = ["He kept a notebook in his coat pocket."];
    const { ok, bad } = verbatimOnly(
      ["He had a notebook", "in his coat pocket"],
      turns,
    );
    expect(ok).toEqual(["in his coat pocket"]);
    expect(bad).toEqual(["He had a notebook"]);
  });

  it("rejects empty / whitespace-only candidates", () => {
    const { ok, bad } = verbatimOnly(["", "  "], ["any text"]);
    expect(ok).toEqual([]);
    expect(bad).toEqual(["", "  "]);
  });

  it("matches across multiple turns (per-turn search)", () => {
    const turns = ["First turn text.", "Second turn with the line."];
    const { ok } = verbatimOnly(["with the line"], turns);
    expect(ok).toEqual(["with the line"]);
  });

  it("does not match strings that span turn boundaries", () => {
    // The candidate is built from words drawn from two different turns;
    // verbatim-only shouldn't accept it since that lets the model fabricate
    // continuity that wasn't actually said.
    const turns = ["Tomas kept a notebook.", "His hands tuned the radio."];
    const { ok, bad } = verbatimOnly(
      ["a notebook. His hands tuned the radio"],
      turns,
    );
    expect(ok).toEqual([]);
    expect(bad).toEqual(["a notebook. His hands tuned the radio"]);
  });

  it("is case-sensitive", () => {
    const turns = ["The world is wide."];
    const { ok, bad } = verbatimOnly(["the world is wide"], turns);
    expect(ok).toEqual([]);
    expect(bad).toEqual(["the world is wide"]);
  });

  it("preserves the original candidate string in the result", () => {
    const turns = ["clean substring here"];
    // Whitespace is trimmed for the search but the original is echoed back.
    const { ok } = verbatimOnly(["  substring  "], turns);
    expect(ok).toEqual(["  substring  "]);
  });

  it("returns empty ok and bad when both inputs are empty", () => {
    const result = verbatimOnly([], []);
    expect(result.ok).toEqual([]);
    expect(result.bad).toEqual([]);
  });
});
