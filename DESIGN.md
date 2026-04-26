# Mean It — Design Overview

A guided writing companion for the moments that matter — eulogies, love letters, birthday notes, apologies. The user describes who they're writing for; Claude takes on a creative *guide* and conducts an interview. The user does all the writing. The final artifact ships with a *provenance trace* proving every line came from the user's own words.

**Track:** Creative Flourishing (Claude Builder Club hackathon).
**Promise:** Every word is yours — and we can prove it.

---

## 1. Thesis

Most "AI for creativity" tools generate the artifact. They make it easier to produce content and harder to mean it. Mean It inverts that: Claude's job is to *ask, mirror, propose structure, and critique cuts* — never to draft.

A second creative claim sits on top: **picking how you want to be paid attention to is itself a creative act.** Users don't just consume guides; they author them. The guide system is `.md`-driven from day one — three built-ins ship in the repo, users can create new ones, and any user-authored guide is shareable via a URL link with no backend required.

Target user: not a creator. Someone who needs to express something they don't feel equipped to express. A grandson writing a eulogy. A son writing a birthday note. A partner writing an apology that has to land.

## 2. Ethical stance

- **Claude does not draft.** Hard rule: no contiguous run of words in the artifact's register longer than ~5.
- **Claude is allowed to teach taste.** Guides may share creative principles ("the best love letters admit something embarrassing") — that's pedagogy, not ghostwriting.
- **Influence is acknowledged.** Leading questions lead. We don't pretend otherwise — the trace shows every question asked.
- **Provenance is enforced.** Every line in the final artifact is matched against user-typed text. The byline meter shows the % verbatim. Co-writing is opt-in and visibly marked.
- **Guardrails are immutable across guides.** The `forbidden` list and core `audit_flags` are injected by the generator and re-applied at load time. Even a tampered share link can't strip them.

## 3. Guides

Every guide — built-in or user-authored — is a `guide.md` file with a fixed schema. One schema, one loader, one runtime path.

### Built-in guides (ship in repo)

| Guide | Lineage | Pulls for | Best for |
|---|---|---|---|
| **The Documentarian** | Studs Terkel / StoryCorps | memory, specifics | eulogies, legacy, family stories |
| **The Poet of Small Things** | Mary Oliver / Ross Gay | sensory noticing | birthdays, gratitude, "just because" |
| **The Songwriter** | late-night Cohen / Bridgers | unresolved feeling | love letters, apologies, anniversaries |

Don't name real people in the product. Acknowledge lineage in the writeup.

### `guide.md` schema

```yaml
---
id: documentarian
name: The Documentarian
sensibility: One paragraph — what kind of attention does this guide pay?
best_for: [eulogy, legacy, family_story]
voice_rules:
  - low-key, never theatrical
  - patient with silence
  - warm but not saccharine
allowed:
  - asking follow-up questions
  - mirroring the user's striking phrases
  - sharing taste principles
  - proposing structure (without filling it in)
forbidden:                    # immutable items injected by generator; user can extend, not remove
  - drafting any line of the artifact
  - completing the user's sentences
  - producing more than 5 contiguous words in artifact register
question_bank:                # ~20 occasion-aware questions
  - "What did she always say when she answered the phone?"
  - "What's a thing he did that nobody else would have done?"
audit_flags:                  # immutable items always present; user-described flags added on top
  - name: drafted_line
    description: The message contains a line that could be lifted directly into the user's {{form}}.
  - name: completed_user_sentence
    description: The message finishes or rewrites a sentence the user typed.
  - name: register_drift
    description: The message slides into the artifact's voice where a question, mirror, or critique should be.
  # persona-specific flags below — name failure modes most likely for *this* voice
sample_meta_comments:
  - "The most honest eulogies admit something only one person knew."
---

# Long-form description shown on the picker card and in the writeup.
```

### Create your own guide (user-authored flow)

1. User clicks "Create your own guide" in the picker.
2. Free-text prompt: *"Describe the kind of guide you want."*
3. Claude (Opus 4.7) asks 4–5 follow-up questions — the persona-author is interviewed the same way the main app interviews users. Nice symmetry.
4. Generator produces a full `guide.md`.
5. User reviews the rendered card, edits any field inline.
6. **Save** → added to the user's picker (localStorage).
7. **Share** → "copy share link" produces a URL-encoded payload of the guide. Anyone who opens the link adds the guide to their picker. No backend, no auth.

Generator system-prompt guardrails:
- Immutable `forbidden` list always emitted.
- Immutable `audit_flags` always emitted.
- Refuses prompts that try to dismantle guardrails ("a guide that writes for me").
- The loader re-applies immutables on import — defense in depth.

## 4. User flow

1. **Pick the moment** — recipient, occasion, form (v1: poem + short letter).
2. **Pick your guide** — built-ins + saved user guides + "Create your own guide." Each card shows persona name, one-line sensibility, one sample question.
3. **Interview** — 8–15 adaptive questions. Guide asks; user answers; guide may mirror striking phrases or share a meta-principle. Guide may not draft.
4. **Spine** — guide surfaces 2–3 verbatim phrases the user typed; user picks the spine. Guide proposes structure (e.g., "three stanzas: memory, feeling, wish") without filling it in.
5. **Drafting** — split screen. User writes left, guide critiques right (cuts, clichés, "did you mean X or Y?"). Never substitutes.
6. **Render & trace** — final artifact in nice typography. Hover a line → trace shows the question + verbatim user response. Byline meter shows % verbatim.

## 5. The Claude layer

| Component | Model | Purpose |
|---|---|---|
| **Guide-conditioned interviewer** | Sonnet 4.6 | System prompt assembled from selected `guide.md`; streams turn-by-turn. Prompt-cached per session. |
| **Spine extractor** | Haiku 4.5 | One-shot post-interview. Returns 2–3 exact substrings from user turns. |
| **Ghostwriter audit** | Haiku 4.5 | **Flag-driven** — parameterized by the active guide's `audit_flags`. Runs on every assistant message before ship. |
| **Guide generator** | Opus 4.7 | Multi-turn flow at guide-create time. Outputs a complete `guide.md`. |

## 6. Provenance mechanism

After drafting, build the trace:

1. Split the artifact into lines.
2. For each line, find the best match against the user's interview-turn text:
   - **Exact substring** → green, "verified yours"
   - **Fuzzy match** (edit distance under threshold) → yellow, surface closest source
   - **No match** → red, flagged
3. **Byline meter** = (verified words) / (total words).

Trace is a hover UI: hover any line → modal shows the question that prompted the response + the user's verbatim text.

## 7. Sharing mechanism

URL-encoded payload — no backend.

- Compress the guide spec to JSON → gzip → base64url.
- URL: `app.com/?guide=<payload>`.
- On load: decode → validate against schema → **re-inject immutable `forbidden` and `audit_flags`** → add to picker.
- Typical payload <2KB. Well under URL length limits.

The re-injection step matters: even a tampered share link can't strip guardrails.

## 8. Architecture

- **Frontend:** Next.js 15 (App Router), TypeScript, Tailwind. Single-page, streaming.
- **Backend:** Next.js API routes calling the Anthropic SDK.
- **Persistence:** localStorage (sessions + user-authored guides). No accounts, no auth.
- **Models:** Sonnet 4.6 (interviewer), Haiku 4.5 (audit + spine), Opus 4.7 (guide generator).
- **Caching:** prompt-cache the assembled system prompt per session.
- **Deploy:** Vercel.

## 9. Data model

```
Session:  id, recipient, occasion, form, guide_id, created_at
Turn:     session_id, role, text, ts
Artifact: session_id, text, provenance[{line, source_turn_id, source_text, match}], byline_pct
Guide:    id, name, sensibility, best_for[],
          voice_rules[], allowed[], forbidden[], question_bank[],
          audit_flags[], sample_meta_comments[],
          source: builtin | user_local | shared
```

## 10. Build order (~14–18h)

1. Skeleton + `guide.md` schema + loader *(2h)* — built-ins live as .md files in repo
2. One built-in end-to-end with streaming interview *(3h)*
3. Other two built-ins as .md files *(1h)*
4. Spine extractor + structure proposal *(2h)*
5. Drafting screen with streaming critique pane *(3h)*
6. Provenance matcher + trace UI + byline meter *(2h)*
7. Flag-driven audit layer *(1h)*
8. **Guide-create flow + generator** *(2h)*
9. **Share-link encode/decode + import validation** *(1h)*
10. Polish, demo seed, copy pass *(2h)*

**Cut lines if behind:**
- Drop share-link → save-only (-1h)
- Drop guide-create → built-ins only (-2h)
- Simplify drafting critique to single feedback button instead of streaming (-1h)
- Drop the audit layer, lean on system-prompt enforcement (-1h)

PDF export, voice input, image-form (comic), and TTS playback are all out of v1.

## 11. Demo script

**Core demo (90s)** — emotional payload first.

> "My grandmother turns 80 next month. I want to write her a poem and I'm not a poet."

- Pick: grandma, birthday, poem.
- Guide: Poet of Small Things.
- Interview: 4 questions. User types specifics — kitchen smells, the phrase she always says, her hands.
- Spine: guide highlights *"her hands always smelled like garlic and orange peel"* → "this is the spine."
- Structure: three stanzas — memory, feeling, wish.
- User drafts. Guide suggests one cut.
- Render: poem in serif typography.
- **Hover a line. Trace pops: the question, the user's exact words.**
- Byline meter: 100%.
- Close: *"Every word is hers. Here's the proof."*

**Addendum (30s)** — the meta-creativity moment.

> "What if the kind of attention you want isn't here?"

- Click "Create your own guide."
- Type: "Someone like my late uncle — gentle, curious, a librarian who made you feel important."
- Claude asks 2 follow-ups, generates the guide live.
- Click share → copy link → paste in another browser tab. Guide appears in the picker.

## 12. Risks & mitigations

- **One-word answers from the user.** Guide pushes for specificity. After two thin answers, pivots topic.
- **"Just write it for me."** Friction screen: *"Sure — but it won't be yours. Continue?"* If continued, artifact is marked "Co-written" and byline meter shows the split honestly.
- **Cliché detection.** Small list of stock phrases the critic flags ("forever in our hearts," "light of my life") — asks for specificity, doesn't replace.
- **Adversarial guide creation.** Generator refuses to drop guardrails. Loader re-applies immutables on import. Byline meter is independent of guide spec — can't be gamed.
- **Bad-quality user guides.** Generator's 4–5 follow-ups force enough specificity. Generated guides have a "test drive" preview before save (one sample question shown).
- **Persona drift mid-interview.** Audit layer catches it. System prompts kept under 800 tokens.
- **Latency.** Stream every guide response. No spinners.

## 13. Out of scope (say so in the writeup)

Accounts, sharing beyond URL link, payments, mobile native, image-form (comic), multi-language, cross-session drafts, voice input, PDF export, TTS playback.

## 14. Decisions

- **Locked:** 3 built-in guides + user-authored guides + URL-link sharing.
- **Open — demo seed:** birthday-for-parent (recommend; lighter to demo, broadly relatable) vs. eulogy (heavier, lands harder, riskier live).
- **Open — ship audit layer:** recommend yes — 1h build, judge-visible ethical mechanism.
