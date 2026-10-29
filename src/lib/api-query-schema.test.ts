import { describe, expect, it } from 'vitest';

import {
  adminChangelogsQuerySchema,
  campaignsListQuerySchema,
  campaignCharacterViewQuerySchema,
  codexGetQuerySchema,
  imagesListQuerySchema,
  includeUnlistedQuerySchema,
  libraryListQuerySchema,
  officialItemIdQuerySchema,
  uuidQuerySchema,
} from './api-validation';

function expectStrictRejectsUnknown(schema: { safeParse: (v: unknown) => { success: boolean } }) {
  const result = schema.safeParse({ legit: '1', extra: 'nope' });
  expect(result.success).toBe(false);
}

describe('strict API query schemas', () => {
  it('campaigns list: client ?full=true passes; unknown key fails', () => {
    expect(campaignsListQuerySchema.safeParse({ full: 'true' }).success).toBe(true);
    expect(campaignsListQuerySchema.safeParse({}).success).toBe(true);
    expectStrictRejectsUnknown(campaignsListQuerySchema);
  });

  it('codex: client includeUnlisted/debug/collection shapes pass', () => {
    expect(codexGetQuerySchema.safeParse({ includeUnlisted: '1' }).success).toBe(true);
    expect(codexGetQuerySchema.safeParse({ debug: '1' }).success).toBe(true);
    expect(codexGetQuerySchema.safeParse({ collection: 'feats' }).success).toBe(true);
    expectStrictRejectsUnknown(codexGetQuerySchema);
  });

  it('official includeUnlisted query passes for listed client paths', () => {
    expect(includeUnlistedQuerySchema.safeParse({}).success).toBe(true);
    expect(includeUnlistedQuerySchema.safeParse({ includeUnlisted: '1' }).success).toBe(true);
    expectStrictRejectsUnknown(includeUnlistedQuerySchema);
  });

  it('images list query matches /api/images?category=&q=', () => {
    expect(imagesListQuerySchema.safeParse({ category: 'weapon,power', q: 'dagger' }).success).toBe(
      true,
    );
    expectStrictRejectsUnknown(imagesListQuerySchema);
  });

  it('library name dedupe query', () => {
    expect(libraryListQuerySchema.safeParse({ name: 'Firebolt' }).success).toBe(true);
    expectStrictRejectsUnknown(libraryListQuerySchema);
  });

  it('admin changelogs query', () => {
    expect(
      adminChangelogsQuerySchema.safeParse({ entityType: 'codex_feats', limit: '50' }).success,
    ).toBe(true);
    expectStrictRejectsUnknown(adminChangelogsQuerySchema);
  });

  it('campaign character encounter scope query', () => {
    expect(campaignCharacterViewQuerySchema.safeParse({ scope: 'encounter' }).success).toBe(true);
    expect(campaignCharacterViewQuerySchema.safeParse({}).success).toBe(true);
    expectStrictRejectsUnknown(campaignCharacterViewQuerySchema);
  });

  it('official delete id accepts codex numeric ids; enhanced-items stay UUID', () => {
    expect(officialItemIdQuerySchema.safeParse({ id: '7' }).success).toBe(true);
    expect(officialItemIdQuerySchema.safeParse({ id: '  abc  ' }).success).toBe(true);
    expectStrictRejectsUnknown(officialItemIdQuerySchema);

    expect(uuidQuerySchema.safeParse({ id: '7' }).success).toBe(false);
    expect(uuidQuerySchema.safeParse({ id: '11111111-1111-4111-8111-111111111111' }).success).toBe(
      true,
    );
  });
});
