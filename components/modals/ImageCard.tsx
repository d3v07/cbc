"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { SCRIPT } from "@/lib/demo";
import { actions, useAppStore } from "@/lib/store";
import { ModalShell, StampMark } from "@/components/modals/shared";

type ImageFormat = "1x1" | "4x5" | "9x16" | "16x9" | "letter";
type ImageLayout = "paper" | "hero" | "photo" | "carousel";
type ApiImageFormat = "square" | "portrait" | "landscape";

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

interface GeneratedImage {
  image_url: string;
  mime: string;
  model: string;
  format: ApiImageFormat;
  layout: ImageLayout;
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

function apiFormatFor(format: ImageFormat): ApiImageFormat {
  if (format === "16x9") return "landscape";
  if (format === "4x5" || format === "9x16" || format === "letter") {
    return "portrait";
  }
  return "square";
}

function svgDataUrl(
  format: FormatOption,
  layout: ImageLayout,
  lines: readonly string[],
): string {
  const line =
    layout === "hero"
      ? lines[0] ?? ""
      : layout === "photo"
        ? lines[1] ?? lines[0] ?? ""
        : lines[0] ?? "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${Math.round(1200 / format.ratio)}" viewBox="0 0 1200 ${Math.round(1200 / format.ratio)}"><rect width="100%" height="100%" fill="#f5ecd9"/><circle cx="1080" cy="120" r="72" fill="none" stroke="#8b2418" stroke-width="8"/><text x="1080" y="132" text-anchor="middle" font-family="serif" font-size="28" fill="#8b2418">100%</text><text x="600" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="serif" font-size="64" fill="#1d150c">${line.replace(/[<&>]/g, "")}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export default function ImageCard() {
  const [state, dispatch] = useAppStore();
  const [format, setFormat] = useState<ImageFormat>("1x1");
  const [layout, setLayout] = useState<ImageLayout>("hero");
  const [done, setDone] = useState(false);
  const [generated, setGenerated] = useState<GeneratedImage | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = state.modal === "imagecard";
  const dismiss = () => dispatch(actions.setModal(null));
  const selectedFormat = FORMATS.find((item) => item.id === format) ?? DEFAULT_FORMAT;
  const selectedLayout = LAYOUTS.find((item) => item.id === layout) ?? DEFAULT_LAYOUT;
  const lines = useMemo(() => {
    const artifactLines = state.artifact_text
      .split(/\n+/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (artifactLines.length > 0) return artifactLines;
    return SCRIPT.draft.filter((line) => line.verified).map((line) => line.text);
  }, [state.artifact_text]);
  const artifact = lines.join("\n").trim();

  const preview = useMemo(() => {
    const width = selectedFormat.ratio >= 1 ? 260 : 260 * selectedFormat.ratio;
    const height = selectedFormat.ratio >= 1 ? 260 / selectedFormat.ratio : 260;
    return { width, height };
  }, [selectedFormat]);

  const resetGenerated = () => {
    setGenerated(null);
    setDone(false);
    setError(null);
  };

  const downloadLocal = () => {
    if (typeof document === "undefined") return;
    const link = document.createElement("a");
    link.href = svgDataUrl(selectedFormat, layout, lines);
    link.download = `mean-it-${format}-${layout}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setDone(true);
  };

  const generate = async () => {
    if (!artifact) return;
    setGenerating(true);
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/image-card/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          artifact,
          recipient: state.draft.recipient || undefined,
          occasion: state.draft.occasion || undefined,
          theme: state.theme,
          format: apiFormatFor(format),
          layout,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as
        | GeneratedImage
        | { error?: string };
      if (!res.ok || !("image_url" in data)) {
        const message = "error" in data ? data.error : undefined;
        throw new Error(message ?? "image generation failed");
      }
      setGenerated(data);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "image generation failed");
    } finally {
      setGenerating(false);
    }
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
                onClick={() => {
                  setFormat(item.id);
                  resetGenerated();
                }}
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
                onClick={() => {
                  setLayout(item.id);
                  resetGenerated();
                }}
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
            {generated ? (
              <Image
                alt="Generated image card"
                data-testid="image-card-generated"
                height={Math.round(preview.height)}
                src={generated.image_url}
                unoptimized
                width={Math.round(preview.width)}
                style={{
                  width: preview.width,
                  height: preview.height,
                  objectFit: "cover",
                  border: "1px solid var(--t-ink-ghost)",
                  boxShadow: "0 8px 24px var(--t-paper-shadow)",
                }}
              />
            ) : (
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
                      ? lines[0]
                      : layout === "photo"
                        ? lines[1] ?? lines[0]
                        : lines[0]}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="divider-flourish" />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span className="muted" style={{ fontFamily: "var(--t-mono)", fontSize: 10 }}>
          generated from this letter · trace badge stays visible
        </span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" className="btn ghost" onClick={downloadLocal}>
            local svg
          </button>
          {generated && (
            <a
              className="btn ghost"
              download={`mean-it-${format}-${layout}.png`}
              href={generated.image_url}
            >
              download png
            </a>
          )}
          <button
            type="button"
            className="btn primary"
            disabled={generating || !artifact}
            onClick={generate}
          >
            {generating ? "generating" : generated ? "regenerate image" : `generate ${format} image`}
          </button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          style={{ marginTop: 14, fontFamily: "var(--t-mono)", fontSize: 11, color: "var(--t-accent)" }}
        >
          {error}
        </div>
      )}

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
