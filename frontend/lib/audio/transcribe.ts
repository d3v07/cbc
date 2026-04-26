import { env } from "@/lib/env";
import type { TranscriptLine } from "@/lib/types/media";

const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";

interface VerboseSegment {
  text: string;
  start: number;
  end: number;
}

interface VerboseTranscription {
  segments?: VerboseSegment[];
  text?: string;
}

export interface TranscribeResult {
  lines: TranscriptLine[];
  duration_ms: number;
}

export async function transcribeAudio(audio: Blob): Promise<TranscribeResult> {
  const apiKey = env().OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("OPENAI_API_KEY not configured"), { status: 503 });
  }

  const form = new FormData();
  form.set("file", audio, "voice.webm");
  form.set("model", "whisper-1");
  form.set("response_format", "verbose_json");
  form.set("timestamp_granularities[]", "segment");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw Object.assign(new Error(`whisper failed: ${res.status} ${detail.slice(0, 200)}`), {
      status: res.status,
    });
  }

  const data = (await res.json()) as VerboseTranscription;
  const segments = data.segments ?? [];
  const lines: TranscriptLine[] = segments
    .filter((s) => s.text.trim().length > 0)
    .map((s) => ({ line: s.text.trim(), start: s.start, end: s.end }));

  // Fall back to a single-line transcript if Whisper returned no segments.
  if (lines.length === 0 && data.text) {
    lines.push({ line: data.text.trim(), start: 0, end: 0 });
  }

  const duration_ms =
    lines.length > 0
      ? Math.round(((lines.at(-1)?.end ?? 0) as number) * 1000)
      : 0;

  return { lines, duration_ms };
}
