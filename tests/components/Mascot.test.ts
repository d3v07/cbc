import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  EMOTIONS,
  MASCOT_IDS,
  Mascot,
  type Emotion,
  type MascotId,
} from "@/components/mascots";

const render = (props: { id: MascotId; emotion?: Emotion; size?: number }) =>
  renderToStaticMarkup(createElement(Mascot, props));

describe("Mascot", () => {
  it("renders an SVG for every (id × emotion) combination", () => {
    for (const id of MASCOT_IDS) {
      for (const emo of EMOTIONS) {
        const html = render({ id, emotion: emo, size: 64 });
        expect(html, `${id}/${emo}`).toContain("<svg");
        expect(html, `${id}/${emo}`).toContain('viewBox="0 0 68 68"');
      }
    }
  });

  it("returns empty markup for an unknown id", () => {
    const html = render({
      id: "unknown" as MascotId,
      emotion: "listening",
    });
    expect(html).toBe("");
  });

  it("propagates the size prop to the SVG width and height", () => {
    const html = render({ id: "wren", emotion: "listening", size: 128 });
    expect(html).toContain('width="128"');
    expect(html).toContain('height="128"');
  });

  it("wren defaults to the listening emotion when none is supplied", () => {
    const html = render({ id: "wren" });
    expect(html).toContain('aria-label="Wren mascot, listening"');
  });

  it("pip defaults to the curious emotion", () => {
    const html = render({ id: "pip" });
    expect(html).toContain('aria-label="Pip mascot, curious"');
  });

  it("cassio defaults to the moved emotion", () => {
    const html = render({ id: "cassio" });
    expect(html).toContain('aria-label="Cassio mascot, moved"');
  });

  it("renders the sad emotion with the accent-colored tear stroke", () => {
    const html = render({ id: "wren", emotion: "sad" });
    expect(html).toContain("var(--t-accent)");
  });
});
