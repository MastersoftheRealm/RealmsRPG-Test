import { describe, expect, it } from 'vitest';
import {
  catalogFromCodexRows,
  findLevel1LegalityViolations,
  mapCodexBaseSkillToId,
  shouldCheckLevel1Legality,
} from './character-legality';

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
    defenseVals: { might: 0, fortitude: 0, reflex: 0, discernment: 0, mentalFortitude: 0, resolve: 0 },
    archetype: { id: 'a1', type: 'power' },
    archetypeFeats: [{ id: 'f1', name: 'Feat One' }],
    feats: [{ id: 'c1', name: 'Character Feat' }],
    currency: 12,
    healthPoints: 10,
    energyPoints: 8,
  };
}

describe('shouldCheckLevel1Legality', () => {
  it('checks level 1 and payloads with no level', () => {
    expect(shouldCheckLevel1Legality({ level: 1 })).toBe(true);
    expect(shouldCheckLevel1Legality({})).toBe(true);
  });

  it('skips higher levels, whose level-up spend the document cannot show', () => {
    expect(shouldCheckLevel1Legality({ level: 2 })).toBe(false);
    expect(shouldCheckLevel1Legality({ level: 20 })).toBe(false);
  });
});

describe('findLevel1LegalityViolations', () => {
  it('accepts a legal level-1 build', () => {
    expect(findLevel1LegalityViolations(legalBuild())).toEqual([]);
  });

  it('accepts an empty payload — absent fields are not treated as violations', () => {
    expect(findLevel1LegalityViolations({})).toEqual([]);
  });

  it('accepts an under-filled build so a partial save is never refused', () => {
    expect(
      findLevel1LegalityViolations({
        ...legalBuild(),
        abilities: { strength: 1, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
        skills: [],
        archetypeFeats: [],
        feats: [],
        healthPoints: 0,
        energyPoints: 0,
      })
    ).toEqual([]);
  });

  it('rejects ability spend over the level-1 budget', () => {
    const violations = findLevel1LegalityViolations({
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 3, acuity: 0, intelligence: 0, charisma: 0 },
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/Ability points spent \(9\).*budget \(7\)/);
  });

  it('rejects scores below the floor, closing the refund-farming hole', () => {
    const violations = findLevel1LegalityViolations({
      ...legalBuild(),
      abilities: { strength: 8, vitality: -5, agility: 0, acuity: 0, intelligence: 0, charisma: 0 },
    });
    expect(violations.some((v) => /cannot go below -2/.test(v))).toBe(true);
  });

  it('rejects skill allocation over the level-1 budget', () => {
    const violations = findLevel1LegalityViolations({
      ...legalBuild(),
      skills: [
        { id: '1', skill_val: 3, prof: true },
        { id: '2', skill_val: 3, prof: true },
      ],
    });
    expect(violations).toHaveLength(1);
    expect(violations[0]).toMatch(/Skill points spent \(6\).*budget \(3\)/);
  });

  it('counts defense bonuses against the skill budget', () => {
    const violations = findLevel1LegalityViolations({
      ...legalBuild(),
      skills: [{ id: '1', skill_val: 1, prof: true }],
      defenseVals: { might: 2, fortitude: 0, reflex: 0, discernment: 0, mentalFortitude: 0, resolve: 0 },
    });
    expect(violations[0]).toMatch(/Skill points spent \(5\)/);
  });

  it('reads a skills record as well as saved rows', () => {
    expect(
      findLevel1LegalityViolations({ ...legalBuild(), skills: { '1': 1, '2': 1, '3': 1 } })
    ).toEqual([]);
    expect(
      findLevel1LegalityViolations({ ...legalBuild(), skills: { '1': 3, '2': 3 } })[0]
    ).toMatch(/Skill points spent \(6\)/);
  });

  it('rejects more archetype feats than the archetype allows', () => {
    const violations = findLevel1LegalityViolations({
      ...legalBuild(),
      archetypeFeats: [{ id: 'f1' }, { id: 'f2' }],
    });
    expect(violations[0]).toMatch(/Archetype feats \(2\).*maximum \(1\)/);
  });

  it('allows a martial archetype its bonus feats', () => {
    expect(
      findLevel1LegalityViolations({
        ...legalBuild(),
        archetype: { id: 'a1', type: 'martial' },
        archetypeFeats: [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }],
      })
    ).toEqual([]);
  });

  it('rejects more than one character feat at level 1', () => {
    const violations = findLevel1LegalityViolations({
      ...legalBuild(),
      feats: [{ id: 'c1' }, { id: 'c2' }],
    });
    expect(violations[0]).toMatch(/Character feats \(2\).*maximum \(1\)/);
  });

  it('rejects negative currency', () => {
    const violations = findLevel1LegalityViolations({ ...legalBuild(), currency: -30 });
    expect(violations[0]).toMatch(/Currency cannot be negative/);
  });

  it('rejects Health + Energy over the level-1 pool', () => {
    const violations = findLevel1LegalityViolations({
      ...legalBuild(),
      healthPoints: 18,
      energyPoints: 18,
    });
    expect(violations[0]).toMatch(/Health \+ Energy allocation \(36\).*pool \(18\)/);
  });

  it('rejects negative Health or Energy allocation', () => {
    expect(
      findLevel1LegalityViolations({ ...legalBuild(), healthPoints: -4 })[0]
    ).toMatch(/cannot be negative/);
  });

  it('reports every violation at once', () => {
    const violations = findLevel1LegalityViolations({
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 3, acuity: 0, intelligence: 0, charisma: 0 },
      currency: -1,
      feats: [{ id: 'c1' }, { id: 'c2' }],
    });
    expect(violations).toHaveLength(3);
  });

  it('takes the more permissive of rules override and code default', () => {
    const overBudgetByDefaults = {
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 2, acuity: 0, intelligence: 0, charisma: 0 },
    };
    expect(findLevel1LegalityViolations(overBudgetByDefaults)).toHaveLength(1);
    // A rules edit that raises the budget must not be overruled by the code default.
    expect(
      findLevel1LegalityViolations(overBudgetByDefaults, {
        PROGRESSION_PLAYER: { baseAbilityPoints: 12 },
      } as never)
    ).toEqual([]);
    // A rules edit that lowers it must not retroactively reject a legal build.
    expect(
      findLevel1LegalityViolations(legalBuild(), {
        PROGRESSION_PLAYER: { baseAbilityPoints: 1 },
      } as never)
    ).toEqual([]);
  });
});

describe('findLevel1LegalityViolations feat requirements', () => {
  const catalog = {
    feats: [
      { id: 'f1', name: 'Open Feat' },
      { id: 'c1', name: 'Needs Level 4', lvl_req: 4 },
      { id: 'gated', name: 'Needs Strength 3', ability_req: ['strength'], abil_req_val: [3] },
    ],
    skills: [],
  };

  it('skips requirement checks when no catalog is passed (budget tests stay independent)', () => {
    expect(findLevel1LegalityViolations(legalBuild())).toEqual([]);
  });

  it('skips requirement checks when the catalog is empty', () => {
    expect(findLevel1LegalityViolations(legalBuild(), undefined, { feats: [], skills: [] })).toEqual(
      []
    );
  });

  it('accepts catalog feats the build qualifies for', () => {
    expect(
      findLevel1LegalityViolations(
        { ...legalBuild(), feats: [{ id: 'f1' }], archetypeFeats: [{ id: 'f1' }] },
        undefined,
        catalog
      )
    ).toEqual([]);
  });

  it('refuses a catalog feat whose requirements the build does not meet', () => {
    const violations = findLevel1LegalityViolations(legalBuild(), undefined, catalog);
    expect(violations.some((v) => /Needs Level 4/.test(v) && /level 4/i.test(v))).toBe(true);
  });

  it('names the ability gate in the player-facing detail', () => {
    const violations = findLevel1LegalityViolations(
      {
        ...legalBuild(),
        archetypeFeats: [{ id: 'gated' }],
        feats: [{ id: 'f1' }],
      },
      undefined,
      catalog
    );
    expect(violations.some((v) => /Needs Strength 3/.test(v) && /strength 3/i.test(v))).toBe(true);
  });

  it('does not 400 an id that is not in the catalog', () => {
    expect(
      findLevel1LegalityViolations(
        { ...legalBuild(), feats: [{ id: 'custom-1' }], archetypeFeats: [{ id: 'f1' }] },
        undefined,
        catalog
      )
    ).toEqual([]);
  });

  it('parses TEXT requirement columns from columnar codex rows', () => {
    const fromRows = catalogFromCodexRows(
      [{ id: 'g', name: 'Gated', ability_req: 'strength', abil_req_val: '3' }],
      []
    );
    const violations = findLevel1LegalityViolations(
      { ...legalBuild(), archetypeFeats: [{ id: 'g' }], feats: [] },
      undefined,
      fromRows
    );
    expect(violations.some((v) => /Gated/.test(v) && /strength 3/i.test(v))).toBe(true);
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
      ]
    );
    expect(catalog.skills).toEqual([
      { id: '10', name: 'Athletics', base_skill_id: undefined, ability: 'strength' },
      { id: '11', name: 'Climb', base_skill_id: 10, ability: 'strength' },
      { id: '12', name: 'Empty', base_skill_id: undefined, ability: 'strength' },
    ]);
  });
});
