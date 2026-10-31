import { describe, expect, it } from 'vitest';
import {
  catalogFromCodexRows,
  findCharacterLegalityViolations,
  mapCodexBaseSkillToId,
  type CharacterLegalityRulesStatus,
} from './character-legality';

const LOADED: CharacterLegalityRulesStatus = 'loaded';

function warnings(
  candidate: Parameters<typeof findCharacterLegalityViolations>[0],
  rules?: Parameters<typeof findCharacterLegalityViolations>[2],
  featCatalog?: Parameters<typeof findCharacterLegalityViolations>[3],
) {
  return findCharacterLegalityViolations(candidate, LOADED, rules, featCatalog).warnings;
}

/** A legal level-1 guided build: 7 ability points, 3 skill points, 1 of each feat kind. */
function legalBuild() {
  return {
    level: 1,
    abilities: { strength: 2, vitality: 2, agility: 1, acuity: 1, intelligence: 1, charisma: 0 },
    skills: [
      { id: '1', skill_val: 1, prof: true },
      { id: '2', skill_val: 1, prof: true },
      { id: '3', skill_val: 1, prof: true },
    ],
    defenseVals: {
      might: 0,
      fortitude: 0,
      reflex: 0,
      discernment: 0,
      mentalFortitude: 0,
      resolve: 0,
    },
    archetype: { id: 'a1', type: 'power' },
    archetypeFeats: [{ id: 'f1', name: 'Feat One' }],
    feats: [{ id: 'c1', name: 'Character Feat' }],
    currency: 12,
    healthPoints: 10,
    energyPoints: 8,
  };
}

describe('findCharacterLegalityViolations (B5 all levels)', () => {
  it('warns on level 20 over-budget ability spend (prevention gate 1dfe8wf2g9k)', () => {
    const result = findCharacterLegalityViolations(
      {
        level: 20,
        abilities: {
          strength: 50,
          vitality: 50,
          agility: 50,
          acuity: 0,
          intelligence: 0,
          charisma: 0,
        },
      },
      LOADED,
    );
    expect(result.warnings.some((w) => /level 20 budget/.test(w))).toBe(true);
    expect(result.uncomputable).toEqual([]);
  });

  it('returns uncomputable when core_rules was unavailable', () => {
    const result = findCharacterLegalityViolations(legalBuild(), 'missing');
    expect(result.warnings).toEqual([]);
    expect(result.uncomputable[0]).toMatch(/Core rules data was unavailable/);
  });

  it('accepts a legal level-1 build', () => {
    expect(warnings(legalBuild())).toEqual([]);
  });

  it('accepts an empty payload — absent fields are not treated as violations', () => {
    expect(warnings({})).toEqual([]);
  });

  it('accepts an under-filled build so a partial save is never refused', () => {
    expect(
      warnings({
        ...legalBuild(),
        abilities: {
          strength: 1,
          vitality: 0,
          agility: 0,
          acuity: 0,
          intelligence: 0,
          charisma: 0,
        },
        skills: [],
        archetypeFeats: [],
        feats: [],
        healthPoints: 0,
        energyPoints: 0,
      }),
    ).toEqual([]);
  });

  it('warns on ability spend over the level budget', () => {
    const v = warnings({
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 3, acuity: 0, intelligence: 0, charisma: 0 },
    });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/Ability points spent \(9\).*budget \(7\)/);
  });

  it('warns on scores below the floor, closing the refund-farming hole', () => {
    const v = warnings({
      ...legalBuild(),
      abilities: { strength: 8, vitality: -5, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
    });
    expect(v.some((line) => /cannot go below -2/.test(line))).toBe(true);
  });

  it('warns on skill allocation over the level budget', () => {
    const v = warnings({
      ...legalBuild(),
      skills: [
        { id: '1', skill_val: 3, prof: true },
        { id: '2', skill_val: 3, prof: true },
      ],
    });
    expect(v).toHaveLength(1);
    expect(v[0]).toMatch(/Skill points spent \(6\).*budget \(3\)/);
  });

  it('counts defense bonuses against the skill budget', () => {
    const v = warnings({
      ...legalBuild(),
      skills: [{ id: '1', skill_val: 1, prof: true }],
      defenseVals: {
        might: 2,
        fortitude: 0,
        reflex: 0,
        discernment: 0,
        mentalFortitude: 0,
        resolve: 0,
      },
    });
    expect(v[0]).toMatch(/Skill points spent \(5\)/);
  });

  it('reads a skills record as well as saved rows', () => {
    expect(warnings({ ...legalBuild(), skills: { '1': 1, '2': 1, '3': 1 } })).toEqual([]);
    expect(warnings({ ...legalBuild(), skills: { '1': 3, '2': 3 } })[0]).toMatch(
      /Skill points spent \(6\)/,
    );
  });

  it('warns on more archetype feats than the archetype allows', () => {
    const v = warnings({
      ...legalBuild(),
      archetypeFeats: [{ id: 'f1' }, { id: 'f2' }],
    });
    expect(v[0]).toMatch(/Archetype feats \(2\).*maximum \(1\)/);
  });

  it('allows a martial archetype its bonus feats', () => {
    expect(
      warnings({
        ...legalBuild(),
        archetype: { id: 'a1', type: 'martial' },
        archetypeFeats: [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }],
      }),
    ).toEqual([]);
  });

  it('warns on more than one character feat at level 1', () => {
    const v = warnings({
      ...legalBuild(),
      feats: [{ id: 'c1' }, { id: 'c2' }],
    });
    expect(v[0]).toMatch(/Character feats \(2\).*maximum \(1\)/);
  });

  it('warns on negative currency', () => {
    const v = warnings({ ...legalBuild(), currency: -30 });
    expect(v[0]).toMatch(/Currency cannot be negative/);
  });

  it('warns on Health + Energy over the level pool', () => {
    const v = warnings({
      ...legalBuild(),
      healthPoints: 18,
      energyPoints: 18,
    });
    expect(v[0]).toMatch(/Health \+ Energy allocation \(36\).*pool \(18\)/);
  });

  it('warns on negative Health or Energy allocation', () => {
    expect(warnings({ ...legalBuild(), healthPoints: -4 })[0]).toMatch(/cannot be negative/);
  });

  it('reports every violation at once', () => {
    const v = warnings({
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 3, acuity: 0, intelligence: 0, charisma: 0 },
      currency: -1,
      feats: [{ id: 'c1' }, { id: 'c2' }],
    });
    expect(v).toHaveLength(3);
  });

  it('takes the more permissive of rules override and code default', () => {
    const overBudgetByDefaults = {
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 2, acuity: 0, intelligence: 0, charisma: 0 },
    };
    expect(warnings(overBudgetByDefaults)).toHaveLength(1);
    expect(
      warnings(overBudgetByDefaults, {
        PROGRESSION_PLAYER: { baseAbilityPoints: 12 },
      } as never),
    ).toEqual([]);
    expect(
      warnings(legalBuild(), {
        PROGRESSION_PLAYER: { baseAbilityPoints: 1 },
      } as never),
    ).toEqual([]);
  });
});

describe('findCharacterLegalityViolations feat requirements', () => {
  const catalog = {
    feats: [
      { id: 'f1', name: 'Open Feat' },
      { id: 'c1', name: 'Needs Level 4', lvl_req: 4 },
      { id: 'gated', name: 'Needs Strength 3', ability_req: ['strength'], abil_req_val: [3] },
    ],
    skills: [],
  };

  it('skips requirement checks when no catalog is passed (budget tests stay independent)', () => {
    expect(warnings(legalBuild())).toEqual([]);
  });

  it('skips requirement checks when the catalog is empty', () => {
    expect(warnings(legalBuild(), undefined, { feats: [], skills: [] })).toEqual([]);
  });

  it('accepts catalog feats the build qualifies for', () => {
    expect(
      warnings(
        { ...legalBuild(), feats: [{ id: 'f1' }], archetypeFeats: [{ id: 'f1' }] },
        undefined,
        catalog,
      ),
    ).toEqual([]);
  });

  it('warns on a catalog feat whose requirements the build does not meet', () => {
    const v = warnings(legalBuild(), undefined, catalog);
    expect(v.some((line) => /Needs Level 4/.test(line) && /level 4/i.test(line))).toBe(true);
  });

  it('names the ability gate in the player-facing detail', () => {
    const v = warnings(
      {
        ...legalBuild(),
        archetypeFeats: [{ id: 'gated' }],
        feats: [{ id: 'f1' }],
      },
      undefined,
      catalog,
    );
    expect(v.some((line) => /Needs Strength 3/.test(line) && /strength 3/i.test(line))).toBe(true);
  });

  it('does not warn on an id that is not in the catalog', () => {
    expect(
      warnings(
        { ...legalBuild(), feats: [{ id: 'custom-1' }], archetypeFeats: [{ id: 'f1' }] },
        undefined,
        catalog,
      ),
    ).toEqual([]);
  });

  it('parses TEXT requirement columns from columnar codex rows', () => {
    const fromRows = catalogFromCodexRows(
      [{ id: 'g', name: 'Gated', ability_req: 'strength', abil_req_val: '3' }],
      [],
    );
    const v = warnings(
      { ...legalBuild(), archetypeFeats: [{ id: 'g' }], feats: [] },
      undefined,
      fromRows,
    );
    expect(v.some((line) => /Gated/.test(line) && /strength 3/i.test(line))).toBe(true);
  });
});

describe('mapCodexBaseSkillToId / catalogFromCodexRows (TASK-754)', () => {
  it('maps empty/null TEXT to undefined and numeric text to an id', () => {
    expect(mapCodexBaseSkillToId(null)).toBeUndefined();
    expect(mapCodexBaseSkillToId(undefined)).toBeUndefined();
    expect(mapCodexBaseSkillToId('')).toBeUndefined();
    expect(mapCodexBaseSkillToId('10')).toBe(10);
    expect(mapCodexBaseSkillToId(0)).toBe(0);
    expect(mapCodexBaseSkillToId('not-an-id')).toBeUndefined();
  });

  it('maps columnar base_skill onto app-layer base_skill_id', () => {
    const catalog = catalogFromCodexRows(
      [],
      [
        { id: '10', name: 'Athletics', base_skill: null, ability: 'strength' },
        { id: '11', name: 'Climb', base_skill: '10', ability: 'strength' },
        { id: '12', name: 'Empty', base_skill: '', ability: 'strength' },
      ],
    );
    expect(catalog.skills).toEqual([
      { id: '10', name: 'Athletics', base_skill_id: undefined, ability: 'strength' },
      { id: '11', name: 'Climb', base_skill_id: 10, ability: 'strength' },
      { id: '12', name: 'Empty', base_skill_id: undefined, ability: 'strength' },
    ]);
  });
});
