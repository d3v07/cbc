# Tech Stack

Per-feature breakdown, grouped by flow phase. Anything in the *AI* column is a Claude agent unless prefixed with another vendor.

## Core flow

| # | Feature | Frontend | Backend / API route | AI / Model | Storage / External |
|---|---|---|---|---|---|
| 1 | Pick the moment | React form, Tailwind | none (client state only) | — | localStorage `Session` |
| 2 | Pick a guide | Card picker, schema-validated `guide.md` loader | `/api/guides/list` (reads `.md` from repo + localStorage) | — | repo `.md` files + localStorage |
| 3 | Interview | Streaming chat shell (SSE / Vercel streaming) | `/api/interview/turn` (POST, streamed) | **Sonnet 4.6** — Interviewer; system prompt assembled from active `guide.md`, prompt-cached | Anthropic SDK; localStorage `Turn[]` |
| 4 | Find the spine | "Surface my spine" button → 3 verbatim phrase cards | `/api/spine` | **Haiku 4.5** — Spine Extractor; structured JSON, exact substrings only | Anthropic SDK; spine[] in `Session` |
| 5 | Drafting + critique | Split-pane editor (CodeMirror or contentEditable); streaming critique pane right | `/api/draft/critique` (POST, streamed) | **Sonnet 4.6** — Interviewer in critic mode | Anthropic SDK; draft text in localStorage |
| 6 | Page artifact render | Serif typography view, hover-trace, byline meter | `/api/render` (deterministic) | — | localStorage `Artifact` w/ provenance[] |
| 7 | Provenance matcher + byline | Hover popovers, byline meter component | `/api/provenance` (deterministic; edit-distance matching) | optional: **Anthropic Citations API** for Claude-issued links | provenance[] embedded in Artifact |
| 8 | Ghostwriter audit (invisible layer) | none — runs server-side before reply ships | `/api/audit` (called from middleware on every assistant message) | **Haiku 4.5** — Auditor; flag-driven JSON yes/no + reason | audit logs in `Session` for trace |

## Guide system

| # | Feature | Frontend | Backend / API route | AI / Model | Storage / External |
|---|---|---|---|---|---|
| 9 | Built-in guides | three `.md` files committed to repo | static read at build time | — | repo |
| 10 | Create-your-own guide | Multi-turn chat UI for guide-author interview | `/api/guide/create` (turn) → `/api/guide/finalize` (emit `.md`) | **Opus 4.7** — Generator; multi-turn (4–5 follow-ups), guardrails immutably injected | localStorage `source: user_local` |
| 11 | Share via URL link | "Copy share link" button | none — pure client encode (JSON → gzip → base64url) | — | URL params (~<2KB) |
| 12 | Import shared guide | URL param decoder + schema validator | none — runs client-side on load | — | re-injects immutable `forbidden` + `audit_flags`; adds to picker |

## Reel pipeline (the vertical 9:16 MP4)

| # | Feature | Frontend | Backend / API route | AI / Model | Storage / External |
|---|---|---|---|---|---|
| 13 | Photo upload | Drag-drop uploader, gallery | `/api/photos/upload` → forwards to **Anthropic Files API** | — | Anthropic Files (`file_id`); thumbnails as blob URLs |
| 14 | Photo Reader | invisible (runs after upload) | `/api/photos/describe` | **Sonnet 4.6 vision** — Photo Reader; returns subject/setting/mood per photo | descriptions in `Session.photos[]` |
| 15 | Voice recording | `MediaRecorder` UI w/ live waveform + retake | none (in-browser) | — | blob URL only; not uploaded |
| 15b | TTS fallback (no recording) | "Use synthesized voice" button | `/api/tts` | **OpenAI `gpt-4o-mini-tts`** | blob URL; tagged "Voice: synthesized" |
| 15c | Voice transcript (line timestamps) | invisible — needed to sync captions | `/api/transcribe` | **OpenAI Whisper** *or* browser `SpeechRecognition` (free) | line-by-line timestamps in `Session` |
| 16 | Curator / Storyboarder | trigger on "Render reel" | `/api/curator` | **Sonnet 4.6** — Curator; takes (poem, photo descriptions, voice duration + timestamps) → Storyboard JSON | storyboard in `Session.reel` |
| 17 | Canvas renderer | `<canvas>` 1080×1920 @ 30fps; Web Animations API for Ken Burns + caption fades | none — pure client | — | renders to MediaRecorder stream |
| 18 | Capture + transcode | `canvas.captureStream(30)` + audio track → webm; **`ffmpeg.wasm`** webm→mp4 | none | — | output blob URL |
| 19 | Download | `<a download>` link | none | — | client download |

## Shared infrastructure

| Concern | Choice | Notes |
|---|---|---|
| Framework | Next.js 15 (App Router) | server components for static, route handlers for API, edge for streaming |
| Language | TypeScript strict | |
| Styling | Tailwind CSS | no UI lib; hand-rolled components |
| Persistence | localStorage only | no DB, no auth, no accounts in v1 |
| Auth | none | URL link sharing keeps it backend-free |
| Streaming | Vercel Edge runtime + SSE for assistant turns | extended-thinking deltas surfaced in trace toggle |
| Prompt caching | Anthropic `cache_control: ephemeral` on guide system prompts | ~90% token reduction on repeated turns |
| Files | Anthropic Files API for user photos | `file_id` referenced across Photo Reader + Curator + page render |
| Observability | Vercel Analytics + console-only logs for hackathon | skip Sentry/PostHog |
| Deploy | Vercel hobby tier | one `vercel.json`, push-to-deploy |
| Env vars | `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | OpenAI key only needed if TTS or Sora used |

## Per-call cost reference (rough)

| Call | Model | Approx cost / call | Frequency |
|---|---|---|---|
| Interview turn | Sonnet 4.6 (cached system) | ~$0.003 | ~12× per session |
| Drafting critique | Sonnet 4.6 (cached) | ~$0.003 | ~5× per session |
| Spine extract | Haiku 4.5 | ~$0.0005 | 1× per session |
| Audit (every assistant msg) | Haiku 4.5 | ~$0.0003 | ~17× per session |
| Photo Reader | Sonnet 4.6 vision | ~$0.005 / photo | 3–8× per reel |
| Curator | Sonnet 4.6 | ~$0.01 | 1× per reel |
| Guide Generator (Create flow) | Opus 4.7 | ~$0.05 | 1× per new guide |
| TTS fallback | OpenAI mini-tts | ~$0.03 | 0–1× per reel |
| Whisper transcript | OpenAI Whisper | ~$0.005 / min | 1× per reel |

**Realistic cost per full session (interview → page → reel):** ~$0.15.
