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

    const wordCount = line.split(/\s+/).filter(Boolean).length;
    totalWords += wordCount;

    let matched: ProvenanceLine | null = null;
    for (const turn of userTurns) {
      if (turn.text.includes(line)) {
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

    if (matched) {
      provenance.push(matched);
      verifiedWords += wordCount;
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

/**
 * True when `haystack` contains a window of words that approximately
 * matches `needle` — each word within 2 Levenshtein edits.
 */
function fuzzyContains(needle: string, haystack: string): boolean {
  const needleWords = needle.split(/\s+/).filter(Boolean);
  const hayWords = haystack.split(/\s+/).filter(Boolean);
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
