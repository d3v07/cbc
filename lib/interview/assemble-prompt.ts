import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Guide } from "@/lib/guides/schema";
import type { Form, Theme } from "@/lib/types/session";
import { themeVoiceBlock } from "./theme-voice";

export interface AssemblePromptInput {
  guide: Guide;
  recipient: string;
  occasion: string;
  form: Form;
  theme?: Theme;
}

let templateCache: string | null = null;

function loadTemplate(): string {
  if (templateCache !== null) return templateCache;
  const path = join(process.cwd(), "prompts", "interviewer.system.md");
  templateCache = readFileSync(path, "utf-8");
  return templateCache;
}

// Visible-for-testing — lets test harnesses reset between cases.
export function _resetTemplateCache(): void {
  templateCache = null;
}

/**
 * Render the interviewer system prompt for one session.
 *
 * The template at `prompts/interviewer.system.md` has a doc preamble
 * separated from the actual prompt body by `---`. Everything before the
 * first `---` is documentation; everything after is the prompt.
 *
 * Supports a tiny subset of Handlebars syntax:
 *   - `{{form}}`, `{{recipient_name}}`, `{{occasion}}`
 *   - `{{guide.name}}`, `{{guide.sensibility}}`
 *   - `{{#each guide.<field>}}\n- {{this}}\n{{/each}}` for the guide's
 *     bullet-list arrays
 *
 * The theme voice block is appended after the persona body.
 */
export function assemblePrompt(input: AssemblePromptInput): string {
  let out = loadTemplate();

  // Drop the doc preamble (everything up to and including the first `---`).
  const sepIdx = out.indexOf("---");
  if (sepIdx !== -1) {
    out = out.slice(sepIdx + 3).trimStart();
  }

  // Expand each-blocks for the guide's array fields.
  const arrays: Array<readonly [string, readonly string[]]> = [
    ["voice_rules", input.guide.voice_rules],
    ["allowed", input.guide.allowed],
    ["forbidden", input.guide.forbidden],
    ["sample_meta_comments", input.guide.sample_meta_comments],
    ["question_bank", input.guide.question_bank],
  ];
  for (const [field, items] of arrays) {
    const re = new RegExp(
      `\\{\\{#each guide\\.${field}\\}\\}[\\s\\S]*?\\{\\{/each\\}\\}`,
      "g",
    );
    const bullets = items.map((s) => `- ${s}`).join("\n");
    out = out.replace(re, bullets);
  }

  // Plain placeholder substitutions.
  const replacements: Record<string, string> = {
    "{{form}}": input.form,
    "{{recipient_name}}": input.recipient,
    "{{occasion}}": input.occasion,
    "{{guide.name}}": input.guide.name,
    "{{guide.sensibility}}": input.guide.sensibility,
  };
  for (const [needle, value] of Object.entries(replacements)) {
    out = out.split(needle).join(value);
  }

  // Theme voice as a final block.
  out = `${out.trimEnd()}\n\n## Theme voice\n\n${themeVoiceBlock(input.theme)}\n`;

  return out;
}
