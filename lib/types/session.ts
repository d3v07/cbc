import { z } from "zod";

// Theme — visual register the page artifact and reel renderer adopt.
export const ThemeSchema = z.enum(["cute", "warm", "quiet", "noir", "gothic"]);
export type Theme = z.infer<typeof ThemeSchema>;

// Form — the artifact form being authored. v1 scope per DESIGN.md §4.
export const FormSchema = z.enum(["poem", "letter"]);
export type Form = z.infer<typeof FormSchema>;

// Populated by Photo Reader (#4); subject/setting/mood land after the
// vision call returns.
export const PhotoMetaSchema = z.object({
  file_id: z.string().min(1),
  mime: z.string().min(1),
  size: z.number().int().nonnegative(),
  subject: z.string().optional(),
  setting: z.string().optional(),
  mood: z.string().optional(),
});
export type PhotoMeta = z.infer<typeof PhotoMetaSchema>;

// Appended whenever the audit layer (#9) inspects an assistant message.
// `blocked` defaults to false so the audit can run in log-only mode.
export const AuditEntrySchema = z.object({
  ts: z.number().int(),
  message_id: z.string().min(1),
  flags_tripped: z.array(z.string()).min(1),
  reason: z.string(),
  blocked: z.boolean().default(false),
});
export type AuditEntry = z.infer<typeof AuditEntrySchema>;

// Top-level state container. Persisted to localStorage; never round-trips
// the network as a whole (routes consume slices).
export const SessionSchema = z.object({
  id: z.string().min(1),
  recipient: z.string().min(1),
  occasion: z.string().min(1),
  form: FormSchema,
  guide_id: z.string().min(1),
  theme: ThemeSchema,
  photos: z.array(PhotoMetaSchema).default([]),
  audit: z.array(AuditEntrySchema).default([]),
  created_at: z.number().int(),
});
export type Session = z.infer<typeof SessionSchema>;

export const TurnRoleSchema = z.enum(["guide", "user"]);
export type TurnRole = z.infer<typeof TurnRoleSchema>;

// `phrases_held` is populated by the spine extractor (#6) for user turns
// whose phrases became candidates for the artifact's spine.
export const TurnSchema = z.object({
  id: z.string().min(1),
  session_id: z.string().min(1),
  role: TurnRoleSchema,
  text: z.string(),
  ts: z.number().int(),
  phrases_held: z.array(z.string()).optional(),
});
export type Turn = z.infer<typeof TurnSchema>;

export const ProvenanceMatchSchema = z.enum(["exact", "fuzzy", "none"]);
export type ProvenanceMatch = z.infer<typeof ProvenanceMatchSchema>;

// Output of the deterministic provenance matcher (#9). One per artifact line.
export const ProvenanceLineSchema = z.object({
  line: z.string(),
  source_turn_id: z.string(),
  source_text: z.string(),
  match: ProvenanceMatchSchema,
});
export type ProvenanceLine = z.infer<typeof ProvenanceLineSchema>;

// Final rendered piece + provenance trace + byline meter input.
export const ArtifactSchema = z.object({
  session_id: z.string().min(1),
  text: z.string(),
  provenance: z.array(ProvenanceLineSchema),
  byline_pct: z.number().min(0).max(100),
  created_at: z.number().int(),
});
export type Artifact = z.infer<typeof ArtifactSchema>;

export const CritiqueKindSchema = z.enum(["cliche", "question", "verified"]);
export type CritiqueKind = z.infer<typeof CritiqueKindSchema>;

// Emitted by the drafting critic (#8). `line_ref` ties the card to a
// specific line of the user's draft when applicable.
export const CritiqueCardSchema = z.object({
  kind: CritiqueKindSchema,
  line_ref: z.string().optional(),
  body: z.string().min(1),
});
export type CritiqueCard = z.infer<typeof CritiqueCardSchema>;
