import Anthropic from "@anthropic-ai/sdk";
import { env } from "./env";

let envSingleton: Anthropic | null = null;

/**
 * Env-keyed singleton. Use for routes that always read from
 * `ANTHROPIC_API_KEY` and never accept a per-request key.
 */
export function anthropic(): Anthropic {
  if (envSingleton) return envSingleton;
  envSingleton = new Anthropic({ apiKey: env().ANTHROPIC_API_KEY });
  return envSingleton;
}

/**
 * Per-request client for BYO-key flows. Do not cache — different requests
 * may carry different keys. Pair with `readKey(req)` from `lib/byo-key/server`.
 */
export function anthropicForKey(key: string): Anthropic {
  return new Anthropic({ apiKey: key });
}
