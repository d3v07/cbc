import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import {
  GuideSchema,
  IMMUTABLE_AUDIT_FLAGS,
  IMMUTABLE_FORBIDDEN,
  type AuditFlag,
  type Guide,
  type GuideSource,
} from './schema';

export interface ParseGuideOptions {
  source?: GuideSource;
}

export function applyImmutables(guide: Guide): Guide {
  const forbiddenSet = new Set(guide.forbidden);
  for (const item of IMMUTABLE_FORBIDDEN) forbiddenSet.add(item);

  const flagsByName = new Map<string, AuditFlag>();
  for (const f of guide.audit_flags) flagsByName.set(f.name, f);
  for (const f of IMMUTABLE_AUDIT_FLAGS) {
    if (!flagsByName.has(f.name)) flagsByName.set(f.name, f);
  }

  return {
    ...guide,
    forbidden: Array.from(forbiddenSet),
    audit_flags: Array.from(flagsByName.values()),
  };
}

export function parseGuide(text: string, opts: ParseGuideOptions = {}): Guide {
  const parsed = matter(text);
  const candidate = {
    ...parsed.data,
    description: parsed.content.trim(),
    source: opts.source ?? 'builtin',
  };
  const validated = GuideSchema.parse(candidate);
  return applyImmutables(validated);
}

export function loadBuiltInGuides(guidesDir: string): Guide[] {
  const files = readdirSync(guidesDir)
    .filter((f) => f.endsWith('.guide.md'))
    .sort();
  const guides: Guide[] = [];
  for (const file of files) {
    const text = readFileSync(join(guidesDir, file), 'utf-8');
    try {
      guides.push(parseGuide(text, { source: 'builtin' }));
    } catch (e) {
      throw new Error(`Failed to load guide ${file}: ${(e as Error).message}`);
    }
  }
  return guides;
}
