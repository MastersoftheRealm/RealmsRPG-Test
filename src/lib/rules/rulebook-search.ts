import { getRulebookChapterHref } from './rulebook';

export type RulebookSearchChunk = {
  slug: string;
  chapterTitle: string;
  headingId: string;
  headingTitle: string;
  text: string;
};

export type RulebookSearchHit = RulebookSearchChunk & {
  href: string;
  snippet: string;
};

const HEADING_RE = /<h[2-4]\s+id="([^"]+)">([^<]+)<\/h[2-4]>/gi;

export function stripMdx(source: string): string {
  return source
    .replace(/<[^>]+>/g, ' ')
    .replace(/\|/g, ' ')
    .replace(/[#*_`>~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mdxToSearchChunks(
  slug: string,
  chapterTitle: string,
  source: string,
): RulebookSearchChunk[] {
  const parts: { id: string; title: string; start: number }[] = [
    { id: '', title: chapterTitle, start: 0 },
  ];
  HEADING_RE.lastIndex = 0;
  let match = HEADING_RE.exec(source);
  while (match) {
    parts.push({
      id: match[1] ?? '',
      title: (match[2] ?? '').replace(/\s+/g, ' ').trim(),
      start: match.index,
    });
    match = HEADING_RE.exec(source);
  }

  return parts.map((part, index) => {
    const next = parts[index + 1];
    const end = next ? next.start : source.length;
    return {
      slug,
      chapterTitle,
      headingId: part.id,
      headingTitle: part.title,
      text: stripMdx(source.slice(part.start, end)),
    };
  });
}

function snippetAround(text: string, terms: string[], maxLength = 140): string {
  const lower = text.toLowerCase();
  const firstHit = terms.reduce((earliest, term) => {
    const at = lower.indexOf(term);
    if (at < 0) return earliest;
    return earliest < 0 || at < earliest ? at : earliest;
  }, -1);
  const start = firstHit < 0 ? 0 : Math.max(0, firstHit - 40);
  const slice = text.slice(start, start + maxLength).trim();
  const prefix = start > 0 ? '…' : '';
  const suffix = start + maxLength < text.length ? '…' : '';
  return `${prefix}${slice}${suffix}`;
}

export function searchRulebook(
  chunks: readonly RulebookSearchChunk[],
  query: string,
  limit = 8,
): RulebookSearchHit[] {
  const terms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);
  if (terms.length === 0 || (terms.length === 1 && (terms[0]?.length ?? 0) < 2)) {
    return [];
  }

  const scored = chunks
    .map((chunk) => {
      const haystack = `${chunk.headingTitle} ${chunk.chapterTitle} ${chunk.text}`.toLowerCase();
      if (!terms.every((term) => haystack.includes(term))) return null;
      const titleHits = terms.filter((term) =>
        chunk.headingTitle.toLowerCase().includes(term),
      ).length;
      const chapterHits = terms.filter((term) =>
        chunk.chapterTitle.toLowerCase().includes(term),
      ).length;
      return {
        hit: {
          ...chunk,
          href: getRulebookChapterHref(chunk.slug, chunk.headingId || undefined),
          snippet: snippetAround(chunk.text, terms),
        },
        score: titleHits * 8 + chapterHits * 3 + 1,
      };
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => b.score - a.score || a.hit.chapterTitle.localeCompare(b.hit.chapterTitle));

  return scored.slice(0, limit).map((row) => row.hit);
}
