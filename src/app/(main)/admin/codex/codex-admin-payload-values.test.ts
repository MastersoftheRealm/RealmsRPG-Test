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
});
