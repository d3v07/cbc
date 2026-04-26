import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { applyImmutables, loadBuiltInGuides, parseGuide } from '../loader';
import {
  IMMUTABLE_AUDIT_FLAGS,
  IMMUTABLE_FORBIDDEN,
  type Guide,
} from '../schema';

const FIXTURES_DIR = join(process.cwd(), 'prompts', 'guides');

test('loadBuiltInGuides parses all 3 built-in guides', () => {
  const guides = loadBuiltInGuides(FIXTURES_DIR);
  assert.equal(guides.length, 3);
  const ids = guides.map((g) => g.id).sort();
  assert.deepEqual(ids, ['documentarian', 'poet-of-small-things', 'songwriter']);
});

test('parseGuide rejects invalid frontmatter (missing required fields)', () => {
  const bad = `---
id: bad-guide
---
body
`;
  assert.throws(() => parseGuide(bad));
});

test('parseGuide round-trips a valid built-in (Documentarian)', () => {
  const text = readFileSync(
    join(FIXTURES_DIR, 'documentarian.guide.md'),
    'utf-8',
  );
  const guide = parseGuide(text, { source: 'builtin' });
  assert.equal(guide.id, 'documentarian');
  assert.equal(guide.name, 'The Documentarian');
  assert.equal(guide.source, 'builtin');
  assert.ok(guide.description.length > 0);
  assert.ok(guide.audit_flags.length >= 3);
  assert.ok(guide.question_bank.length >= 10);
});

test('applyImmutables re-injects forbidden items if missing', () => {
  const stripped: Guide = {
    id: 'test',
    name: 'Test',
    sensibility: 'x',
    best_for: ['x'],
    voice_rules: ['x'],
    allowed: ['x'],
    forbidden: ['custom forbidden item'],
    question_bank: ['x'],
    audit_flags: [{ name: 'custom_flag', description: 'd' }],
    sample_meta_comments: [],
    description: '',
    source: 'user_local',
  };
  const out = applyImmutables(stripped);
  for (const item of IMMUTABLE_FORBIDDEN) {
    assert.ok(
      out.forbidden.includes(item),
      `missing immutable forbidden: ${item}`,
    );
  }
  assert.ok(out.forbidden.includes('custom forbidden item'));
});

test('applyImmutables re-injects audit flags if missing', () => {
  const stripped: Guide = {
    id: 'test',
    name: 'Test',
    sensibility: 'x',
    best_for: ['x'],
    voice_rules: ['x'],
    allowed: ['x'],
    forbidden: ['x'],
    question_bank: ['x'],
    audit_flags: [{ name: 'custom_flag', description: 'd' }],
    sample_meta_comments: [],
    description: '',
    source: 'user_local',
  };
  const out = applyImmutables(stripped);
  const names = out.audit_flags.map((f) => f.name);
  for (const f of IMMUTABLE_AUDIT_FLAGS) {
    assert.ok(
      names.includes(f.name),
      `missing immutable audit flag: ${f.name}`,
    );
  }
  assert.ok(names.includes('custom_flag'));
});

test('applyImmutables is idempotent', () => {
  const text = readFileSync(
    join(FIXTURES_DIR, 'documentarian.guide.md'),
    'utf-8',
  );
  const once = parseGuide(text);
  const twice = applyImmutables(once);
  assert.deepEqual(once.forbidden.sort(), twice.forbidden.sort());
  assert.equal(once.audit_flags.length, twice.audit_flags.length);
});
