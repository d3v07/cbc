# Mean It

A guided writing companion. The user brings the moment; Claude takes on a creative *guide*, runs an interview, and never drafts. The artifact ships with a provenance trace proving every line came from the user's own words.

See `DESIGN.md` for the thesis and ethical stance, and `docs/techstack.md` for the per-feature stack. Active branch: `persona-core-dev`.

## Setup

```bash
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npm install
npm run dev                  # http://localhost:3000
```

## Environment

| Var | Required? | Used by |
|---|---|---|
| `ANTHROPIC_API_KEY` | yes | Claude calls + Anthropic Files API |
| `OPENAI_API_KEY` | only Sprint 3+ | Whisper transcript + TTS fallback |

`.env.local` is gitignored — never commit secrets.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run lint` | ESLint (next config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest run |
