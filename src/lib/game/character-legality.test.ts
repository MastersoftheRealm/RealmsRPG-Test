import { describe, expect, it } from 'vitest';
import {
  catalogFromCodexRows,
  findCharacterLegalityViolations,
  legalityLevelForSave,
  mapCodexBaseSkillToId,
  resolveCharacterPatchLegality,
  shouldBlockCharacterSaveAtLevel,
  type CharacterLegalityRulesStatus,
} from './character-legality';

const LOADED: CharacterLegalityRulesStatus = 'loaded';

function evaluate(
  candidate: Parameters<typeof findCharacterLegalityViolations>[0],
  rules?: Parameters<typeof findCharacterLegalityViolations>[2],
  featCatalog?: Parameters<typeof findCharacterLegalityViolations>[3],
) {
  return findCharacterLegalityViolations(candidate, LOADED, rules, featCatalog);
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

describe('level 1 blocking vs level 2+ structured warnings', () => {
  it('blocks level 1 over-budget abilities in blocking details', () => {
    const result = evaluate({
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 3, acuity: 0, intelligence: 0, charisma: 0 },
    });
    expect(result.warnings).toEqual([]);
    expect(result.blocking).toHaveLength(1);
    expect(result.blocking[0]).toMatch(/Ability points spent \(9\).*budget \(7\)/);
    expect(shouldBlockCharacterSaveAtLevel(1, result)).toBe(true);
  });

  it('warns with structured codes at level 20 (prevention gate)', () => {
    const result = evaluate({
      level: 20,
      abilities: {
        strength: 50,
        vitality: 50,
        agility: 50,
        acuity: 0,
        intelligence: 0,
        charisma: 0,
      },
    });
    expect(result.blocking).toEqual([]);
    expect(
      result.warnings.some((w) => w.code === 'ability_points_over_budget' && w.level === 20),
    ).toBe(true);
    expect(shouldBlockCharacterSaveAtLevel(20, result)).toBe(false);
  });

  it('returns core_rules_unavailable without inventing warnings', () => {
    const result = findCharacterLegalityViolations(legalBuild(), 'missing');
    expect(result.blocking).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.uncomputable).toEqual(['core_rules_unavailable']);
  });

  it('still blocks level 1 against code defaults when core_rules is missing', () => {
    const result = findCharacterLegalityViolations(
      {
        ...legalBuild(),
        abilities: {
          strength: 3,
          vitality: 3,
          agility: 3,
          acuity: 0,
          intelligence: 0,
          charisma: 0,
        },
      },
      'missing',
    );
    expect(result.uncomputable).toContain('core_rules_unavailable');
    expect(result.blocking.some((d) => /Ability points/.test(d))).toBe(true);
  });
});

describe('findCharacterLegalityViolations level-1 blocking', () => {
  it('accepts a legal level-1 build', () => {
    expect(evaluate(legalBuild()).blocking).toEqual([]);
  });

  it('accepts an under-filled build', () => {
    expect(
      evaluate({
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
      }).blocking,
    ).toEqual([]);
  });

  it('blocks skill allocation over the level-1 budget', () => {
    const result = evaluate({
      ...legalBuild(),
      skills: [
        { id: '1', skill_val: 3, prof: true },
        { id: '2', skill_val: 3, prof: true },
      ],
    });
    expect(result.blocking[0]).toMatch(/Skill points spent \(6\).*budget \(3\)/);
  });

  it('blocks negative currency at level 1 with legacy copy', () => {
    const result = evaluate({ ...legalBuild(), currency: -30 });
    expect(result.blocking[0]).toMatch(/Currency cannot be negative/);
  });

  it('uses structured currency_negative at level 2 without prose copy', () => {
    const result = evaluate({ ...legalBuild(), level: 2, currency: -30 });
    expect(result.blocking).toEqual([]);
    expect(result.warnings).toEqual([{ code: 'currency_negative', level: 2 }]);
  });

  it('takes the more permissive of rules override and code default', () => {
    const overBudgetByDefaults = {
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 2, acuity: 0, intelligence: 0, charisma: 0 },
    };
    expect(evaluate(overBudgetByDefaults).blocking).toHaveLength(1);
    expect(
      evaluate(overBudgetByDefaults, {
        PROGRESSION_PLAYER: { baseAbilityPoints: 12 },
      } as never).blocking,
    ).toEqual([]);
  });
});

describe('findCharacterLegalityViolations feat requirements', () => {
  const catalog = {
    feats: [
      { id: 'f1', name: 'Open Feat' },
      { id: 'c1', name: 'Needs Level 4', lvl_req: 4 },
    ],
    skills: [],
  };

  it('blocks level 1 when a catalog feat fails requirements', () => {
    const result = evaluate(legalBuild(), undefined, catalog);
    expect(result.blocking.some((d) => /Needs Level 4/.test(d))).toBe(true);
  });

  it('structured feat_requirements_unmet at level 5', () => {
    const catalogL10 = {
      feats: [{ id: 'c1', name: 'Needs Level 10', lvl_req: 10 }],
      skills: [],
    };
    const result = evaluate(
      { ...legalBuild(), level: 5, feats: [{ id: 'c1' }], archetypeFeats: [] },
      undefined,
      catalogL10,
    );
    expect(result.warnings).toContainEqual({
      code: 'feat_requirements_unmet',
      level: 5,
      featId: 'c1',
    });
  });
});

describe('mapCodexBaseSkillToId / catalogFromCodexRows (TASK-754)', () => {
  it('maps columnar base_skill onto app-layer base_skill_id', () => {
    const catalog = catalogFromCodexRows(
      [],
      [{ id: '11', name: 'Climb', base_skill: '10', ability: 'strength' }],
    );
    expect(catalog.skills[0]?.base_skill_id).toBe(10);
  });

  it('maps empty/null TEXT to undefined', () => {
    expect(mapCodexBaseSkillToId('')).toBeUndefined();
    expect(mapCodexBaseSkillToId('10')).toBe(10);
  });
});

describe('legalityLevelForSave', () => {
  it('defaults missing level to 1', () => {
    expect(legalityLevelForSave({})).toBe(1);
  });
});

describe('resolveCharacterPatchLegality', () => {
  it('returns 400 details only for newly introduced level-1 violations', () => {
    const stored = evaluate(legalBuild());
    const merged = evaluate({
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 3, acuity: 0, intelligence: 0, charisma: 0 },
    });
    const resolved = resolveCharacterPatchLegality(stored, merged, 1);
    expect(resolved.status400Details?.length).toBeGreaterThan(0);
  });

  it('surfaces pre-existing level-1 violations as warnings on 200', () => {
    const illegal = evaluate({
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 3, acuity: 0, intelligence: 0, charisma: 0 },
    });
    const resolved = resolveCharacterPatchLegality(illegal, illegal, 1);
    expect(resolved.status400Details).toBeNull();
    expect(resolved.legality.warnings.some((w) => w.code === 'level_1_preexisting_violation')).toBe(
      true,
    );
  });
});
