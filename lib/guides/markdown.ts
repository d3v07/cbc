import matter from "gray-matter";
import type { Guide } from "./schema";

/**
 * Serialize a `Guide` back into the canonical `guide.md` format —
 * YAML frontmatter + a long-form description body. Matches the shape
 * the loader (`parseGuide`) consumes.
 *
 * The `description` field is moved out of frontmatter and into the
 * body content, since that's where it lives in the source files
 * under `prompts/guides/*.guide.md`.
 */
export function guideToMarkdown(guide: Guide): string {
  // Drop fields that aren't carried in frontmatter — `description` is the
  // body content, and `source` is provenance metadata that doesn't belong
  // in the file format.
  const {
    description,
    source: _source,
    ...frontmatter
  } = guide;
  void _source;

  const body =
    `# ${guide.name}\n\n${description?.trim() || ""}\n`.replace(
      /\n{3,}/g,
      "\n\n",
    );

  return matter.stringify(body, frontmatter);
}
