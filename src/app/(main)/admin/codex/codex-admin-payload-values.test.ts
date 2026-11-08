import { describe, expect, it } from 'vitest';
import { assertCodexAdminPayloadKeys } from './codex-column-map';

describe('assertCodexAdminPayloadKeys value checks', () => {
  it('rejects a non-numeric feat level', () => {
    expect(() =>
      assertCodexAdminPayloadKeys('codex_feats', {
        name: 'Test feat',
        feat_lvl: 'not-a-number',
      }),
    ).toThrow(/numeric/i);
  });

  it('rejects an oversized codex name', () => {
    expect(() =>
      assertCodexAdminPayloadKeys('codex_feats', {
        name: 'x'.repeat(201),
      }),
    ).toThrow(/exceeds/i);
  });

  it('rejects non-boolean char_feat spreadsheet cells', () => {
    expect(() =>
      assertCodexAdminPayloadKeys('codex_feats', {
        name: 'Sample',
        char_feat: 'yes',
      }),
    ).toThrow(/boolean/i);
  });

  it('rejects invalid species catalog listing values', () => {
    expect(() =>
      assertCodexAdminPayloadKeys('codex_species', {
        name: 'Elf',
        catalog_listing: 'public',
      }),
    ).toThrow(/listed or unlisted/i);
  });

  it('rejects object-valued species skill lists', () => {
    expect(() =>
      assertCodexAdminPayloadKeys('codex_species', {
        name: 'Elf',
        skills: [{ name: 'Athletics' }],
      }),
    ).toThrow(/string or array/i);
  });
});
