# Design — letterpress / stationery identity

Hi-fi prototype for Mean It, exported from Claude Design. Reference for the production port on `feat/sprint-1-design-refresh`. **Replaces the older lo-fi pack at `docs/wireframes/` (Pruthvi's PR #19) — the live components driven by that pack will be torn out as part of the refresh.**

## Identity in one paragraph

Letterpress / postal stationery. Display: Playfair Display (italic-leaning), Body: EB Garamond, UI: JetBrains Mono, Stamps: Special Elite. Five themes (cute → warm → quiet → noir → gothic) override ~30 CSS vars each — color, typography, ornament, animation speed, paper texture. Cards are debossed *plates*; buttons are stamped impressions; the byline is a wax seal pip; the artifact ships with a circular postmark. Real paper grain via layered SVG fractal noise.

## Files

| Path | Purpose |
|---|---|
| `hifi/Mean It Prototype.html` | Entry point. Loads React + Babel inline; mounts `<App/>`. Six-step flow + modal stack. |
| `hifi/theme.css` | Design vocabulary. 5 theme blocks × ~30 vars each + the letterpress / postal patterns. |
| `hifi/screens-1.jsx` | `PickMoment`, `GuidePicker`, `Interview` + the **SCRIPT** eulogy demo data (Tomas / the radio / "world is wide and the kitchen is small"). |
| `hifi/screens-2.jsx` | `Spine`, `Drafting`, `Render`. |
| `hifi/screens-3.jsx` | `CreateGuideDialog` — guided 5-question interview → preview/edit → stamp & share. |
| `hifi/modals.jsx` | `DownloadDialog`, `SaveDialog`, `ShareDialog`, `StartOverDialog`, `ImageCardDialog`. |
| `hifi/reel.jsx` | Reel composer (5-step). **Reference only — lives under d3v07's track (#10, area:audio-video).** |
| `hifi/mascots.jsx` | Wren / Pip / Cassio — hand-drawn ink-line, 6 emotions each (`listening`, `curious`, `moved`, `sad`, `hopeful`, `silence`). |
| `chat-transcript.md` | Full back-and-forth with the design assistant — read for intent and locked decisions. |

## Locked design decisions (from chat-transcript.md)

- **Theme = (e) full theatrical** — color + type + texture + ornament + ambient motion
- **Mascot = hand-drawn ink-line**, 6 emotions, 3 built-ins paired with the 3 guides but decoupled (any mascot with any guide)
- **PickMoment** = B+C hybrid (feeling cards → conversational textarea → AI-parsed pills)
- **GuidePicker** = variant C (abstract glyph card with mascot inside)
- **Interview** = variant A (classic split, mascot left + textarea right)
- **Drafting** = variant A (streaming critique pane right)
- **Render** = full-bleed centered, hover-only trace, postmark + wax seal
- **Demo seed** = eulogy (heavier, lands harder, gothic/quiet theme spotlight)

## Reading order

1. `chat-transcript.md` — skim for the decisions table above.
2. `hifi/theme.css` — internalize the tokens (5 themes × ~30 vars each + letterpress patterns).
3. `hifi/screens-1.jsx` → `screens-2.jsx` → `screens-3.jsx` → `modals.jsx` — walk the flow.
4. `hifi/mascots.jsx` — single SVG per creature, eyes/mouth shift per emotion.
5. `hifi/reel.jsx` — only if reviewing the reel pipeline (d3v07's scope).

## Notes for the port

- The prototype uses React + Babel-in-browser and global `window` pollution (`Object.assign(window, ...)`). The production port uses Next.js components + ES module imports.
- The `SCRIPT` object in `screens-1.jsx` is hardcoded demo data — the port should keep it as a fallback / demo seed but render real session state when available.
- Theme is applied as a `theme-{id}` class on the `<App>` root; CSS vars cascade. The port keeps this approach (no JS theme math).
- Mascot art lives in client-side SVG components; server emits `Guide.id` and the client maps to a mascot.
