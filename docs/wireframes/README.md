# Wireframes — design source of truth

Drop the whole folder into a static host (or `python -m http.server`) and open `Mean It Wireframes.html`.

## Picked direction (per `Mean It Wireframes.html` thesis card)

| Screen | Picked variant | Notes |
|---|---|---|
| 01 · Pick the moment | **A** — form-first | recipient input + occasion pills + form cards (poem / short letter) |
| 02 · Guide picker | **A** — typography-only | three guide cards; **no mascot** (mascot Variation B was deemed risky for eulogies) |
| 03 · Interview | **B** — chat + holding pane | turn-by-turn left, "phrases the guide is holding" right; mid-fi treatment is serif italic |
| 04 · Spine | single design | three verbatim-phrase cards; picked one gets the terracotta border |
| 05 · Drafting | **A** — streaming critique | three card buckets right pane: **cliché flag · question · verified** |
| 06 · Render | single design (mid-fi) | full-bleed serif italic; hover any line → trace popover |
| 07 · Theme spectrum | slider with 5 readings | cute · warm · quiet · noir · gothic — guide tone shifts too |
| 08 · Create-your-own / Share import | dual flow | symmetrical interview to author guide; URL-encoded import re-applies guardrails |

## Design tokens (lift from `styles.css`)

```
--ink:       #1a1612    --paper:        #f6f1e8
--ink-soft:  #4a4038    --paper-card:   #fbf7ef
--ink-faint: rgba(26,22,18,0.45)
--accent:    #c4533a    (warm terracotta — single accent)
--highlight: #f5e36b    (yellow pen — verbatim phrases mid-interview)
--verified:  #6b8a4f    (green underline on artifact lines)
--flag:      #c4533a    (cliché / register-drift flags)
```

Type pair:
- `Cormorant Garamond` (serif italic) — artifact, mid-fi screens
- `Caveat`, `Kalam` (hand) — early/exploratory copy, hand-drawn feel
- `IBM Plex Mono` — chrome, eyebrows, metadata

Anti-defaults applied: no Inter, no purple→blue gradient, no shadcn defaults. Hand feel for ideation, serif italic for delivery.

## Theme spectrum (`07 · Theme spectrum`)

```
.theme-cute    --t-bg #fef0f3  --t-ink #5a3a48  --t-accent #e88aa3
.theme-warm    --t-bg #f6f1e8  --t-ink #1a1612  --t-accent #c4533a   (default)
.theme-quiet   --t-bg #f1f1ee  --t-ink #2a2a26  --t-accent #6b8a4f
.theme-noir    --t-bg #1a1814  --t-ink #e8e3d8  --t-accent #a89058
.theme-gothic  --t-bg #16131a  --t-ink #d8d3e0  --t-accent #7a6b8f
```

A single user-controlled slider drives the value. Front of house = palette/typography swap; back of house = guide system prompt picks tonal phrasing. Same words, different reading.

## Implementation plan

- Pruthvi (`area:frontend`) ports `styles.css` → `tailwind.config.ts` tokens; rebuilds wireframe screens as real React components consuming the route contracts shipped by S1 / S2 backend work.
- Frex22 (`area:persona`) extends interview prompts with `theme` parameter; adds incremental "phrases held" stream; factors `/api/draft/critique` returning 3 buckets.
- d3v07 (`area:audio-video`) adds `theme` param to curator so reel pacing/captions shift to match.
