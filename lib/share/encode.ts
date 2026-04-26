import { gzip } from "pako";

/**
 * Encode an object as a base64url-encoded gzipped JSON string.
 *
 * Used for share-link payloads. Output is URL-safe (no padding, no `+`/`/`)
 * so it can sit directly after `?guide=` without further encoding.
 *
 * Round-trip: `decodeBase64UrlGzip(encodeBase64UrlGzip(x))` returns a
 * JSON-equivalent value of `x`.
 */
export function encodeBase64UrlGzip(payload: unknown): string {
  const json = JSON.stringify(payload);
  const compressed = gzip(json);
  return base64UrlEncode(compressed);
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  // String.fromCharCode in chunks to avoid blowing the stack on large inputs.
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(
      ...bytes.subarray(i, Math.min(i + chunk, bytes.length)),
    );
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
