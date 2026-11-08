import { describe, expect, it } from 'vitest';
import { COLUMNAR_COLLECTIONS } from '@/lib/codex/collections';
import {
  codexAdminCamelBodyShapeError,
  codexPersistedFieldShapeError,
} from '@/lib/codex-persisted-contract';

describe('codexPersistedFieldShapeError', () => {
  it('accepts legacy numeric strings on feat level fields', () => {
    expect(codexPersistedFieldShapeError('featLvl', '2')).toBeNull();
  });

  it('rejects non-boolean char_feat flags', () => {
    expect(codexPersistedFieldShapeError('charFeat', 'yes')).toMatch(/boolean/i);
  });

  it('accepts comma-list species skills as a string', () => {
    expect(codexPersistedFieldShapeError('skills', 'Athletics, Stealth')).toBeNull();
  });

  it('rejects object-valued species skills', () => {
    expect(codexPersistedFieldShapeError('skills', { bad: true })).toMatch(/string or array/i);
  });

  it('rejects invalid catalogListing values', () => {
    expect(codexPersistedFieldShapeError('catalogListing', 'public')).toMatch(
      /listed or unlisted/i,
    );
  });

  it('accepts archetype JSON columns as objects', () => {
    expect(codexPersistedFieldShapeError('level1Loadouts', [{ id: '1' }])).toBeNull();
  });
});

describe('codexAdminCamelBodyShapeError', () => {
  it.each(COLUMNAR_COLLECTIONS.filter((c) => c !== 'core_rules'))(
    'rejects unknown keys on %s',
    (collection) => {
      const err = codexAdminCamelBodyShapeError(collection, {
        name: 'Sample',
        injectedAdminKey: true,
      });
      expect(err).toMatch(/unsupported fields/i);
    },
  );

  it('accepts a minimal valid feat payload', () => {
    expect(
      codexAdminCamelBodyShapeError('codex_feats', {
        name: 'Quick Reflexes',
        featLvl: 1,
        charFeat: false,
      }),
    ).toBeNull();
  });

  it('accepts legacy string sources lists', () => {
    expect(
      codexAdminCamelBodyShapeError('codex_parts', {
        name: 'Spark',
        sources: 'Core, Playtest',
      }),
    ).toBeNull();
  });
});
