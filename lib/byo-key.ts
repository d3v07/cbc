// Bring-your-own-key client helper. Reads/writes the user's Anthropic key
// to localStorage. Server-side counterpart at lib/byo-key/server.ts reads
// the key off the X-Anthropic-Key header (with env() fallback) so the key
// never persists on the server.

const STORAGE_KEY = "mean_it_anthropic_key";
const HEADER_NAME = "X-Anthropic-Key";

export function getKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (!trimmed) {
    clearKey();
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, trimmed);
}

export function clearKey(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Mask a key for UI display: returns `sk-...last4` so the value isn't shown. */
export function maskKey(key: string | null | undefined): string {
  if (!key) return "";
  const k = key.trim();
  if (k.length <= 4) return "sk-…";
  return `sk-…${k.slice(-4)}`;
}

/** Header name to attach the key to outgoing requests. */
export const ANTHROPIC_KEY_HEADER = HEADER_NAME;

/** Build a fetch RequestInit headers patch carrying the BYO key, if present. */
export function withKeyHeader(init: HeadersInit = {}): HeadersInit {
  const key = getKey();
  if (!key) return init;
  if (init instanceof Headers) {
    const next = new Headers(init);
    next.set(HEADER_NAME, key);
    return next;
  }
  if (Array.isArray(init)) {
    return [...init, [HEADER_NAME, key]];
  }
  return { ...init, [HEADER_NAME]: key };
}
