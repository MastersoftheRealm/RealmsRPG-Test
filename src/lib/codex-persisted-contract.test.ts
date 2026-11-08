import { describe, expect, it } from 'vitest';
import { COLUMNAR_COLLECTIONS } from '@/lib/codex/collections';
import {
  codexAdminCamelBodyShapeError,
  codexPersistedFieldShapeError,
} from '@/lib/codex-persisted-contract';

describe('codexPersistedFieldShapeError', () => {
  it('accepts legacy numeric strings on feat level fields', () => {
    expect(codexPersistedFieldShapeError('codex_feats', 'featLvl', '2')).toBeNull();
  });

  it('rejects non-finite numeric strings on feat level fields', () => {
    expect(codexPersistedFieldShapeError('codex_feats', 'featLvl', 'Infinity')).toMatch(/numeric/i);
  });

  it('accepts feat ability string arrays', () => {
    expect(codexPersistedFieldShapeError('codex_feats', 'ability', ['strength'])).toBeNull();
  });

  it('accepts comma-separated feat ability text from spreadsheet cells', () => {
    expect(codexPersistedFieldShapeError('codex_feats', 'ability', 'strength, agility')).toBeNull();
    expect(codexPersistedFieldShapeError('codex_feats', 'abilReqVal', '2')).toBeNull();
    expect(codexPersistedFieldShapeError('codex_feats', 'abilReqVal', 2)).toBeNull();
    expect(codexPersistedFieldShapeError('codex_feats', 'abilReqVal', '2, 4')).toBeNull();
  });

  it('rejects feat number lists with invalid tokens', () => {
    expect(codexPersistedFieldShapeError('codex_feats', 'abilReqVal', '2, Infinity')).toMatch(
      /numbers/i,
    );
  });

  it('keeps skill ability scalar for codex_skills', () => {
    expect(codexPersistedFieldShapeError('codex_skills', 'ability', 'strength')).toBeNull();
    expect(codexPersistedFieldShapeError('codex_skills', 'ability', ['strength'])).toMatch(
      /scalar/i,
    );
  });

  it('accepts part defense lists including empty arrays', () => {
    expect(codexPersistedFieldShapeError('codex_parts', 'defense', [])).toBeNull();
    expect(codexPersistedFieldShapeError('codex_parts', 'defense', ['reflex'])).toBeNull();
  });

  it('accepts species adulthood lifespan tuples', () => {
    expect(
      codexPersistedFieldShapeError('codex_species', 'adulthoodLifespan', [20, 750]),
    ).toBeNull();
    expect(
      codexPersistedFieldShapeError('codex_species', 'adulthoodLifespan', '20, 750'),
    ).toBeNull();
  });

  it('rejects species lifespan strings that include non-finite tokens', () => {
    expect(
      codexPersistedFieldShapeError('codex_species', 'adulthoodLifespan', '20, Infinity'),
    ).toMatch(/numeric range/i);
    expect(
      codexPersistedFieldShapeError('codex_species', 'adulthoodLifespan', [20, Infinity]),
    ).toMatch(/numeric range/i);
  });

  it('rejects invalid catalogListing values', () => {
    expect(codexPersistedFieldShapeError('codex_species', 'catalogListing', 'public')).toMatch(
      /listed or unlisted/i,
    );
  });

  it('rejects JSON-string scalar loadouts', () => {
    expect(codexPersistedFieldShapeError('codex_archetypes', 'level1Loadouts', 'false')).toMatch(
      /JSON object or array/i,
    );
  });

  it('accepts archetype metadata objects for loadouts', () => {
    expect(
      codexPersistedFieldShapeError('codex_archetypes', 'level1Loadouts', {
        armorStep: 'optional',
      }),
    ).toBeNull();
  });

  it('rejects nested archetype JSON that read parsers would drop', () => {
    expect(
      codexPersistedFieldShapeError('codex_archetypes', 'level1GuidanceGroups', [false]),
    ).toMatch(/must be an object/i);
    expect(
      codexPersistedFieldShapeError('codex_archetypes', 'level1RecommendedAbilities', {
        strength: {},
      }),
    ).toMatch(/finite number/i);
    expect(
      codexPersistedFieldShapeError('codex_archetypes', 'level1Loadouts', {
        sharedEquipment: [false],
      }),
    ).toMatch(/must be an object/i);
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

  it('accepts a feat payload with ability lists', () => {
    expect(
      codexAdminCamelBodyShapeError('codex_feats', {
        name: 'Quick Reflexes',
        featLvl: 1,
        charFeat: false,
        ability: ['agility'],
        abilReqVal: [2],
      }),
    ).toBeNull();
  });
});
