import { describe, expect, it } from 'vitest';
import {
  codexDetailHref,
  codexEntrySlug,
  isCodexDetailCollection,
  parseCodexEntrySlug,
  slugifyCodexName,
} from './detail-href';

describe('codex detail slugs (TASK-796)', () => {
  it('builds a stable name--id slug and parses the id back', () => {
    const id = '550e8400-e29b-41d4-a716-446655440000';
    const slug = codexEntrySlug('Mighty Blow', id);
    expect(slug).toBe(`mighty-blow--${id}`);
    expect(parseCodexEntrySlug(slug)).toEqual({ nameSlug: 'mighty-blow', id });
    expect(codexDetailHref('feats', 'Mighty Blow', id)).toBe(`/codex/feats/${slug}`);
  });

  it('rejects slugs without an id separator', () => {
    expect(parseCodexEntrySlug('mighty-blow')).toBeNull();
    expect(parseCodexEntrySlug('')).toBeNull();
  });

  it('slugifies punctuation and allows known collection segments', () => {
    expect(slugifyCodexName("Flavor 'Rules!'")).toBe('flavor-rules');
    expect(isCodexDetailCollection('creature-feats')).toBe(true);
    expect(isCodexDetailCollection('powers')).toBe(false);
  });
});
