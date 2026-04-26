"use client";

import { useMemo, useState } from "react";
import { SCRIPT } from "@/lib/demo";
import { actions, useAppStore } from "@/lib/store";
import { ModalShell, StampMark } from "@/components/modals/shared";

type ImageFormat = "1x1" | "4x5" | "9x16" | "16x9" | "letter";
type ImageLayout = "paper" | "hero" | "photo" | "carousel";

interface FormatOption {
  id: ImageFormat;
  name: string;
  sub: string;
  ratio: number;
  output: string;
}

interface LayoutOption {
  id: ImageLayout;
  name: string;
  sub: string;
}

const FORMATS: readonly FormatOption[] = [
  { id: "1x1", name: "1 : 1", sub: "instagram feed", ratio: 1, output: "1080 x 1080" },
  { id: "4x5", name: "4 : 5", sub: "instagram portrait", ratio: 4 / 5, output: "1080 x 1350" },
  { id: "9x16", name: "9 : 16", sub: "stories · tiktok", ratio: 9 / 16, output: "1080 x 1920" },
  { id: "16x9", name: "16 : 9", sub: "wide social", ratio: 16 / 9, output: "1920 x 1080" },
  { id: "letter", name: "letter", sub: "artifact photo", ratio: 8.5 / 11, output: "2550 x 3300" },
];
const DEFAULT_FORMAT = FORMATS[0]!;

const LAYOUTS: readonly LayoutOption[] = [
  { id: "paper", name: "letter on paper", sub: "verbatim text · postmark" },
  { id: "hero", name: "single hero line", sub: "one line · big type" },
  { id: "photo", name: "photo + caption", sub: "image field · line overlaid" },
  { id: "carousel", name: "carousel", sub: "multiple slides · trace" },
];
const DEFAULT_LAYOUT = LAYOUTS[0]!;

function svgDataUrl(format: FormatOption, layout: ImageLayout): string {
  const verifiedLines = SCRIPT.draft.filter((line) => line.verified);
  const line =
    layout === "hero"
      ? "the world is wide and the kitchen is small."
      : layout === "photo"
        ? "I tune the dial the same way now."
        : verifiedLines[0]?.text ?? SCRIPT.draft[0]?.text ?? "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${Math.round(1200 / format.ratio)}" viewBox="0 0 1200 ${Math.round(1200 / format.ratio)}"><rect width="100%" height="100%" fill="#f5ecd9"/><circle cx="1080" cy="120" r="72" fill="none" stroke="#8b2418" stroke-width="8"/><text x="1080" y="132" text-anchor="middle" font-family="serif" font-size="28" fill="#8b2418">100%</text><text x="600" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="64" fill="#1d150c">${line.replace(/[<&>]/g, "")}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function ImageCard() {
  const [state, dispatch] = useAppStore();
  const [format, setFormat] = useState<ImageFormat>("1x1");
  const [layout, setLayout] = useState<ImageLayout>("hero");
  const [done, setDone] = useState(false);

  const open = state.modal === "imagecard";
  const dismiss = () => dispatch(actions.setModal(null));
  const selectedFormat = FORMATS.find((item) => item.id === format) ?? DEFAULT_FORMAT;
  const selectedLayout = LAYOUTS.find((item) => item.id === layout) ?? DEFAULT_LAYOUT;

  const preview = useMemo(() => {
    const width = selectedFormat.ratio >= 1 ? 260 : 260 * selectedFormat.ratio;
    const height = selectedFormat.ratio >= 1 ? 260 / selectedFormat.ratio : 260;
    return { width, height };
  }, [selectedFormat]);

  const download = () => {
    if (typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = svgDataUrl(selectedFormat, layout);
    link.download = `mean-it-${format}-${layout}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setDone(true);
  };

  return (
    <ModalShell open={open} onClose={dismiss} title="Image card" maxWidth={920}>
      <div className="eyebrow accent">image card · shareable</div>
      <p
        className="body-prose"
        style={{ fontSize: 15, marginTop: 8, marginBottom: 22, color: "var(--t-ink)" }}
      >
        Pick the size and layout. The trace badge stays in the corner.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) 320px",
          gap: 30,
          alignItems: "start",
        }}
      >
        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            format
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 22 }}>
            {FORMATS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setFormat(item.id)}
                className={`card ${format === item.id ? "selected" : "outlined"}`}
                style={{
                  cursor: "pointer",
                  padding: "10px 14px",
                  minWidth: 92,
                  fontFamily: "inherit",
                  color: "inherit",
                  textAlign: "center",
                }}
              >
                <div className="serif-italic" style={{ fontSize: 17, color: "var(--t-ink)" }}>
                  {item.name}
                </div>
                <div
                  className="muted"
                  style={{ fontFamily: "var(--t-mono)", fontSize: 9, marginTop: 2, letterSpacing: "0.12em" }}
                >
                  {item.sub}
                </div>
              </button>
            ))}
          </div>

          <div className="eyebrow" style={{ marginBottom: 10 }}>
            layout
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 22 }}>
            {LAYOUTS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLayout(item.id)}
                className={`card ${layout === item.id ? "selected" : "outlined"}`}
                style={{ cursor: "pointer", padding: "12px 14px", textAlign: "left", fontFamily: "inherit", color: "inherit" }}
              >
                <div className="serif-italic" style={{ fontSize: 16, color: "var(--t-ink)" }}>
                  {item.name}
                </div>
                <div
                  className="muted"
                  style={{ fontFamily: "var(--t-mono)", fontSize: 9, marginTop: 2, letterSpacing: "0.12em" }}
                >
                  {item.sub}
                </div>
              </button>
            ))}
          </div>

          <div className="plate deep" style={{ padding: "12px 16px", fontFamily: "var(--t-mono)", fontSize: 11, color: "var(--t-ink-soft)" }}>
            output · {selectedFormat.output} px · image
          </div>
        </div>

        <div>
          <div className="eyebrow" style={{ marginBottom: 10 }}>
            preview
          </div>
          <div
            style={{
              width: 300,
              height: 320,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "var(--t-paper-warm)",
              border: "1px dashed var(--t-ink-faint)",
              borderRadius: "var(--t-radius)",
            }}
          >
            <div
              data-testid="image-card-preview"
              data-format={format}
              data-layout={layout}
              style={{
                width: preview.width,
                height: preview.height,
                background:
                  layout === "photo"
                    ? "linear-gradient(155deg, color-mix(in srgb, var(--t-accent) 60%, var(--t-paper)), color-mix(in srgb, var(--t-ink-soft) 60%, var(--t-paper-warm)))"
                    : "var(--t-paper)",
                borderRadius: layout === "paper" ? 1 : 4,
                position: "relative",
                overflow: "hidden",
                boxShadow: "0 8px 24px var(--t-paper-shadow), inset 0 1px 0 var(--t-paper-highlight)",
                border: layout === "paper" ? "1px solid var(--t-ink-ghost)" : "none",
                fontFamily: "var(--t-body)",
                color: layout === "photo" ? "var(--t-paper)" : "var(--t-ink)",
              }}
            >
              <div style={{ position: "absolute", top: 8, right: 8, transform: "rotate(8deg)" }}>
                <StampMark label="100%" size={40} />
              </div>
              <div
                style={{
                  padding: 18,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  textAlign: "center",
                }}
              >
                <div className="eyebrow" style={{ fontSize: 6, marginBottom: 8 }}>
                  {selectedLayout.name}
                </div>
                <div style={{ fontFamily: "var(--t-display)", fontStyle: "italic", fontSize: 18, lineHeight: 1.15 }}>
                  {layout === "carousel"
                    ? SCRIPT.draft.filter((line) => line.verified)[0]?.text
                    : layout === "photo"
                      ? "I tune the dial the same way now."
                      : "the world is wide and the kitchen is small."}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider-flourish" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span className="muted" style={{ fontFamily: "var(--t-mono)", fontSize: 10 }}>
          rendered locally · trace badge always on
        </span>
        <button type="button" className="btn primary" onClick={download}>
          download {format} image
        </button>
      </div>

      {done && (
        <div
          role="status"
          aria-live="polite"
          style={{ marginTop: 14, fontFamily: "var(--t-mono)", fontSize: 11, color: "var(--t-verified)" }}
        >
          image prepared
        </div>
      )}
    </ModalShell>
  );
}
