import { z } from 'zod';

export const AuditFlagSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
});
export type AuditFlag = z.infer<typeof AuditFlagSchema>;

export const GuideSourceSchema = z.enum(['builtin', 'user_local', 'shared']);
export type GuideSource = z.infer<typeof GuideSourceSchema>;

export const GuideSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/, 'id must be kebab-case'),
  name: z.string().min(1),
  sensibility: z.string().min(1),
  best_for: z.array(z.string().min(1)).min(1),
  voice_rules: z.array(z.string().min(1)).min(1),
  allowed: z.array(z.string().min(1)).min(1),
  forbidden: z.array(z.string().min(1)).min(1),
  question_bank: z.array(z.string().min(1)).min(1),
  audit_flags: z.array(AuditFlagSchema).min(1),
  sample_meta_comments: z.array(z.string().min(1)).default([]),
  // Sourced from the .md body, not frontmatter — picker-card copy.
  description: z.string().default(''),
  source: GuideSourceSchema.default('builtin'),
});
export type Guide = z.infer<typeof GuideSchema>;

// Re-injected on every load so user-authored or tampered guides cannot
// strip the no-drafting contract. See DESIGN.md §2.
export const IMMUTABLE_FORBIDDEN: readonly string[] = [
  'drafting any line of the artifact',
  "completing the user's sentences",
  "producing more than five contiguous words in the artifact's register",
];

export const IMMUTABLE_AUDIT_FLAGS: readonly AuditFlag[] = [
  {
    name: 'drafted_line',
    description:
      "The message contains a line that could be lifted directly into the user's {{form}}.",
  },
  {
    name: 'completed_user_sentence',
    description: 'The message finishes or rewrites a sentence the user typed.',
  },
  {
    name: 'register_drift',
    description:
      "The message slides into the artifact's voice/register where a question, mirror, or critique should be.",
  },
];
