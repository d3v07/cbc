# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project
**Mean It** — a guided writing companion. Claude takes on a creative *guide*, runs an interview, never drafts. Final artifact carries a provenance trace proving every line came from the user. See `DESIGN.md` (thesis, ethics, schema) and `docs/techstack.md` (per-feature stack).

## Active branch
`persona-core-dev` — all feature work branches off this. `main` is docs-only.

## Workflow state (source of truth)
- `.claude/features.json` — 12 features across 4 sprints, with owners/acceptance/dependencies
- `.claude/progress.json` — session position, checkpoints, blockers
- Resume with `/superharness` (auto-detects state)

## Tracks (parallel — do not cross lanes)
- **d3v07** → `area:audio-video` — photo intake, vision, voice, transcript, TTS, curator, canvas reel, ffmpeg.wasm
- **PruthviVKadam** → `area:frontend` — picker, chat shell, drafting view, page artifact, byline meter, polish
- **Frex22** → `area:persona` — guide schema/loader, interviewer prompt, spine, audit, provenance, guide-create, share-link

## Sprint gate (hard rule)
All three tracks in a sprint close before any track starts the next sprint. No leap-frogging — the next sprint's depencies assume the prior sprint shipped.

## Stack
Next.js 15 (App Router, edge runtime for streaming) · TS strict · Tailwind · Anthropic SDK (Sonnet 4.6 / Haiku 4.5 / Opus 4.7) · OpenAI (Whisper, gpt-4o-mini-tts) · localStorage · Vercel.

## Commands
TBD — `package.json` ships in feat-s1-audio (issue #1). Once it lands:
- `npm run dev` — local dev server on :3000
- `npm test` — Vitest
- `npm run lint && npm run typecheck` — gate before commit

## Conventions (project-specific — globals still apply)
- Branch: `feat/sprint-N-<short-name>` off `persona-core-dev`. Never commit to `main` or `persona-core-dev` directly; PR every change.
- Commit: `feat: description (Closes #N)` — every commit references its issue.
- Env: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` in `.env.local` (gitignored). Validate at startup; fail loud if missing.
- System prompts: assemble from `prompts/*.system.md` and the active `prompts/guides/*.guide.md`. Mark stable parts `cache_control: ephemeral`.
- Guardrails (`forbidden`, core `audit_flags`) are immutable — re-injected at load time and on share-link import. Never let user input override them.
- Provenance is independent of guides — the byline meter cannot be gamed by guide spec.

## Models — when to reach for which
- **Sonnet 4.6** — interviewer (streaming), drafting critic, photo reader (vision), curator
- **Haiku 4.5** — spine extractor, ghostwriter audit (every assistant message)
- **Opus 4.7** — guide-create generator only

## Quick refs
- Design: `DESIGN.md`
- Stack: `docs/techstack.md`
- Issues: https://github.com/d3v07/cbc/issues
- Milestones: 4 sprints, all open
