import { env } from "@/lib/env";

const ENDPOINT = "https://api.openai.com/v1/audio/speech";
const MAX_INPUT_CHARS = 4096;

export type TtsVoice = "alloy" | "nova" | "shimmer" | "echo" | "fable" | "onyx";
export type TtsFormat = "mp3" | "wav" | "opus" | "aac" | "flac";

export interface TtsOptions {
  voice?: TtsVoice;
  format?: TtsFormat;
}

export interface TtsResult {
  audio: ArrayBuffer;
  mime: string;
}

const MIME_BY_FORMAT: Record<TtsFormat, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  opus: "audio/ogg; codecs=opus",
  aac: "audio/aac",
  flac: "audio/flac",
};

export async function synthesizeSpeech(text: string, opts: TtsOptions = {}): Promise<TtsResult> {
  const apiKey = env().OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("OPENAI_API_KEY not configured"), { status: 503 });
  }
  if (!text.trim()) {
    throw Object.assign(new Error("text is empty"), { status: 400 });
  }
  if (text.length > MAX_INPUT_CHARS) {
    throw Object.assign(new Error(`text exceeds ${MAX_INPUT_CHARS} chars`), { status: 413 });
  }

  const voice: TtsVoice = opts.voice ?? "alloy";
  const format: TtsFormat = opts.format ?? "mp3";

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice,
      input: text,
      response_format: format,
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw Object.assign(new Error(`tts failed: ${res.status} ${detail.slice(0, 200)}`), {
      status: res.status,
    });
  }

  return { audio: await res.arrayBuffer(), mime: MIME_BY_FORMAT[format] };
}
