// Server counterpart to lib/byo-key.ts. Reads the user's BYO Anthropic key
// off the X-Anthropic-Key header. Falls back to env().ANTHROPIC_API_KEY so
// the project still works in dev / for the maintainer.

import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

export const ANTHROPIC_KEY_HEADER = "x-anthropic-key";

interface HeadersLike {
  get(name: string): string | null;
}

interface RequestLike {
  headers: HeadersLike;
}

/**
 * Resolve the Anthropic key for this request.
 * Precedence: X-Anthropic-Key header → env().ANTHROPIC_API_KEY.
 * Returns `null` only when neither is present (caller should 401/503).
 */
export function readKey(req: NextRequest | RequestLike): string | null {
  const header = req.headers.get(ANTHROPIC_KEY_HEADER) ?? req.headers.get("X-Anthropic-Key");
  const trimmed = header?.trim();
  if (trimmed && trimmed.length > 0) return trimmed;
  try {
    return env().ANTHROPIC_API_KEY ?? null;
  } catch {
    return null;
  }
}

/** Diagnostic-safe key prefix for logs. Never log the full key. */
export function keyOriginTag(req: NextRequest | RequestLike): "byo" | "env" | "missing" {
  const header = req.headers.get(ANTHROPIC_KEY_HEADER) ?? req.headers.get("X-Anthropic-Key");
  if (header && header.trim().length > 0) return "byo";
  try {
    return env().ANTHROPIC_API_KEY ? "env" : "missing";
  } catch {
    return "missing";
  }
}
