import { z } from "zod";
import { ThemeSchema } from "./theme";

// Photo Reader output — written into Session.photos[].
export const PhotoMetaSchema = z.object({
  file_id: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().int().nonnegative(),
  subject: z.string().optional(),
  setting: z.string().optional(),
  mood: z.string().optional(),
});
export type PhotoMeta = z.infer<typeof PhotoMetaSchema>;

// Whisper output — line-level timestamps drive caption sync in the reel.
export const TranscriptLineSchema = z.object({
  line: z.string(),
  start: z.number().nonnegative(),
  end: z.number().nonnegative(),
});
export type TranscriptLine = z.infer<typeof TranscriptLineSchema>;

// Curator output — drives the canvas reel renderer.
export const KenBurnsSchema = z.object({
  // Pan/zoom is normalized to the photo's bounding box [0,1].
  start: z.object({ x: z.number(), y: z.number(), scale: z.number() }),
  end: z.object({ x: z.number(), y: z.number(), scale: z.number() }),
});
export type KenBurns = z.infer<typeof KenBurnsSchema>;

export const ClipSchema = z.object({
  file_id: z.string(),
  start_ms: z.number().int().nonnegative(),
  duration_ms: z.number().int().positive(),
  ken_burns: KenBurnsSchema,
  caption: z.string().optional(),
});
export type Clip = z.infer<typeof ClipSchema>;

export const CaptionPresetSchema = z.enum([
  "serif-italic",
  "serif-bold",
  "mono",
  "hand",
]);
export type CaptionPreset = z.infer<typeof CaptionPresetSchema>;

export const StoryboardSchema = z.object({
  theme: ThemeSchema,
  total_duration_ms: z.number().int().positive(),
  caption_preset: CaptionPresetSchema,
  clips: z.array(ClipSchema).min(1),
});
export type Storyboard = z.infer<typeof StoryboardSchema>;
