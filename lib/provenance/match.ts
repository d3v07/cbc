import type { ProvenanceLine, Turn } from "@/lib/types/session";

export interface ProvenanceMatchResult {
  provenance: ProvenanceLine[];
  byline_pct: number;
}

/**
 * Deterministic provenance matcher. For each line of `artifact`, decide:
 *
 * - `'exact'` — line is a verbatim substring of one of the user's turns.
 * - `'fuzzy'` — line approximately matches a window of words in a turn,
 *   with each word within 2 edits of its counterpart (Levenshtein).
 * - `'none'` — neither (paraphrase or fabrication).
 *
 * `byline_pct = (verified_words / total_words) * 100`, where verified =
 * exact + fuzzy. Blank lines are recorded as `'none'` but contribute zero
 * to both numerator and denominator.
 *
 * Only `role: 'user'` turns are considered as sources — guide turns are
 * the questions, not the user's words.
 */
export function matchProvenance(
  artifact: string,
  turns: ReadonlyArray<Turn>,
): ProvenanceMatchResult {
  const userTurns = turns.filter((t) => t.role === "user");
  const lines = artifact.split("\n");
  const provenance: ProvenanceLine[] = [];
  let totalWords = 0;
  let verifiedWords = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      provenance.push({
        line: rawLine,
        source_turn_id: "",
        source_text: "",
        match: "none",
      });
      continue;
    }

    const wordCount = wordsForMatch(line).length;
    totalWords += wordCount;

    let matched: ProvenanceLine | null = null;
    for (const turn of userTurns) {
      if (normalizedText(turn.text).includes(normalizedText(line))) {
        matched = {
          line: rawLine,
          source_turn_id: turn.id,
          source_text: turn.text,
          match: "exact",
        };
        break;
      }
    }

    if (!matched) {
      for (const turn of userTurns) {
        if (fuzzyContains(line, turn.text)) {
          matched = {
            line: rawLine,
            source_turn_id: turn.id,
            source_text: turn.text,
            match: "fuzzy",
          };
          break;
        }
      }
    }

    let partialVerifiedWords = 0;
    if (!matched) {
      const partial = bestPartialRun(line, userTurns);
      if (partial) {
        partialVerifiedWords = partial.wordCount;
        matched = {
          line: rawLine,
          source_turn_id: partial.turn.id,
          source_text: partial.turn.text,
          match: "fuzzy",
        };
      }
    }

    if (matched) {
      provenance.push(matched);
      verifiedWords += partialVerifiedWords || wordCount;
    } else {
      provenance.push({
        line: rawLine,
        source_turn_id: "",
        source_text: "",
        match: "none",
      });
    }
  }

  const byline_pct =
    totalWords > 0 ? Math.round((verifiedWords / totalWords) * 100) : 0;

  return { provenance, byline_pct };
}

function normalizedText(text: string): string {
  return wordsForMatch(text).join(" ");
}

function wordsForMatch(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .split(/\s+/)
    .map((word) => word.replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, ""))
    .filter(Boolean);
}

function bestPartialRun(
  line: string,
  turns: ReadonlyArray<Turn>,
): { turn: Turn; wordCount: number } | null {
  const lineWords = wordsForMatch(line);
  let best: { turn: Turn; wordCount: number } | null = null;

  for (const turn of turns) {
    const turnWords = wordsForMatch(turn.text);
    const run = longestCommonRun(lineWords, turnWords);
    if (run >= 3 && (!best || run > best.wordCount)) {
      best = { turn, wordCount: run };
    }
  }

  return best;
}

function longestCommonRun(a: string[], b: string[]): number {
  let best = 0;
  let prev = new Array<number>(b.length + 1).fill(0);
  let curr = new Array<number>(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      curr[j] = a[i - 1] === b[j - 1] ? prev[j - 1]! + 1 : 0;
      if (curr[j]! > best) best = curr[j]!;
    }
    [prev, curr] = [curr, prev];
    curr.fill(0);
  }

  return best;
}

/**
 * True when `haystack` contains a window of words that approximately
 * matches `needle` — each word within 2 Levenshtein edits.
 */
function fuzzyContains(needle: string, haystack: string): boolean {
  const needleWords = wordsForMatch(needle);
  const hayWords = wordsForMatch(haystack);
  if (needleWords.length === 0 || hayWords.length === 0) return false;
  if (needleWords.length > hayWords.length) return false;

  for (let i = 0; i + needleWords.length <= hayWords.length; i++) {
    let allMatch = true;
    for (let j = 0; j < needleWords.length; j++) {
      const a = needleWords[j]!;
      const b = hayWords[i + j]!;
      if (Math.abs(a.length - b.length) > 2) {
        allMatch = false;
        break;
      }
      if (levenshtein(a, b) > 2) {
        allMatch = false;
        break;
      }
    }
    if (allMatch) return true;
  }
  return false;
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = new Array<number>(n + 1);
  let curr = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        curr[j - 1]! + 1,
        prev[j]! + 1,
        prev[j - 1]! + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n]!;
}
