export interface VerbatimResult {
  ok: string[];
  bad: string[];
}

/**
 * Partition `candidates` by whether each is an exact substring of the
 * concatenated user-turn text. Case-sensitive after `.trim()` per #26.
 *
 * - The needle is `c.trim()`. Empty needles are bad.
 * - The haystack is each turn `.trim()`-ed and joined with a single space,
 *   so substrings that span turn boundaries are *not* matched (returning
 *   them would let the model paraphrase across turns and pretend it's
 *   verbatim).
 * - Returned `ok`/`bad` entries are the original candidate strings (with
 *   any leading/trailing whitespace preserved) so callers can echo them.
 */
export function verbatimOnly(
  candidates: readonly string[],
  turnsText: readonly string[],
): VerbatimResult {
  const haystacks = turnsText.map((t) => t.trim()).filter((t) => t.length > 0);
  const ok: string[] = [];
  const bad: string[] = [];
  for (const c of candidates) {
    const needle = c.trim();
    if (needle.length === 0) {
      bad.push(c);
      continue;
    }
    const found = haystacks.some((h) => h.includes(needle));
    if (found) ok.push(c);
    else bad.push(c);
  }
  return { ok, bad };
}
