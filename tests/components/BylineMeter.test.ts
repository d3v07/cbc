import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BylineMeter } from "@/components/BylineMeter";

const render = (props: { pct: number; lines?: number }) =>
  renderToStaticMarkup(createElement(BylineMeter, props));

describe("BylineMeter", () => {
  it("shows the verified glyph at 90 and above", () => {
    const html = render({ pct: 95 });
    expect(html).toContain("✓");
    expect(html).toContain("var(--t-verified)");
    expect(html).toContain("95% verified yours");
  });

  it("shows the partial glyph at 70-89", () => {
    const html = render({ pct: 80 });
    expect(html).toContain("◐");
    expect(html).toContain("var(--t-highlight)");
  });

  it("shows the warning glyph below 70", () => {
    const html = render({ pct: 45 });
    expect(html).toContain("⚠");
    expect(html).toContain("var(--t-accent)");
  });

  it("clamps out-of-range values to [0, 100]", () => {
    const high = render({ pct: 150 });
    expect(high).toContain("100% verified yours");
    const low = render({ pct: -10 });
    expect(low).toContain("0% verified yours");
  });

  it("rounds non-integer percentages", () => {
    const html = render({ pct: 87.6 });
    expect(html).toContain("88% verified yours");
  });

  it("emits an aria-label that includes the tier (not color-only)", () => {
    const verified = render({ pct: 95, lines: 6 });
    expect(verified).toContain("aria-label");
    expect(verified).toContain("verified");

    const partial = render({ pct: 80 });
    expect(partial).toContain("partial");

    const low = render({ pct: 50 });
    expect(low).toContain("low");
  });

  it("includes lines count when provided", () => {
    const html = render({ pct: 100, lines: 5 });
    expect(html).toContain("5 lines");
  });

  it("omits the lines suffix when undefined", () => {
    const html = render({ pct: 100 });
    expect(html).not.toContain("lines");
  });
});
