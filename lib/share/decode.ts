import { ungzip } from "pako";
import { applyImmutables } from "@/lib/guides/loader";
import { GuideSchema, type Guide } from "@/lib/guides/schema";

export type DecodeResult =
  | { ok: true; guide: Guide }
  | { ok: false; error: string };

/**
 * Decode a base64url-gzipped JSON share-link payload back into a `Guide`.
 *
 * Defense in depth:
 *   1. base64url → bytes
 *   2. gunzip → JSON string
 *   3. JSON.parse → unknown
 *   4. Zod validate against `GuideSchema` (rejects malformed shapes)
 *   5. `applyImmutables` re-injects the immutable forbidden list and core
 *      audit_flags so a tampered share link cannot weaken the guardrails
 *   6. `source` is forced to `'shared'` regardless of what the payload claimed.
 *
 * Errors at any step yield `{ ok: false, error }` — never throws.
 */
export function decodeBase64UrlGuide(payload: string): DecodeResult {
  try {
    const bytes = base64UrlDecode(payload);
    const json = ungzip(bytes, { to: "string" });
    const candidate = JSON.parse(json) as unknown;

    const parsed = GuideSchema.safeParse(candidate);
    if (!parsed.success) {
      return { ok: false, error: "invalid guide schema in payload" };
    }

    const fortified = applyImmutables({
      ...parsed.data,
      source: "shared",
    });

    return { ok: true, guide: fortified };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "decode failed",
    };
  }
}

function base64UrlDecode(s: string): Uint8Array {
  const padLen = (4 - (s.length % 4)) % 4;
  const padded = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
