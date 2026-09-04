import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { RULEBOOK_CHAPTERS } from './rulebook';
import { mdxToSearchChunks, type RulebookSearchChunk } from './rulebook-search';

/** Build-time / RSC only — reads MDX from the repo, not imported by client modules. */
export function loadRulebookSearchChunks(): RulebookSearchChunk[] {
  const dir = join(process.cwd(), 'src/content/rules');
  return RULEBOOK_CHAPTERS.flatMap((chapter) => {
    const source = readFileSync(join(dir, `${chapter.slug}.mdx`), 'utf8');
    return mdxToSearchChunks(chapter.slug, chapter.title, source);
  });
}
