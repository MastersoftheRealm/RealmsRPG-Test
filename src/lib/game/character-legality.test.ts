import { describe, expect, it } from 'vitest';
import {
  catalogFromCodexRows,
  findCharacterLegalityViolations,
  legalityLevelForSave,
  mapCodexBaseSkillToId,
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

describe('structured legality warnings at all levels', () => {
  it('warns on level 1 over-budget abilities with structured codes', () => {
    const result = evaluate({
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 3, acuity: 0, intelligence: 0, charisma: 0 },
    });
    expect(
      result.warnings.some(
        (w) => w.code === 'ability_points_over_budget' && w.level === 1 && w.spent === 9,
      ),
    ).toBe(true);
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
    expect(
      result.warnings.some((w) => w.code === 'ability_points_over_budget' && w.level === 20),
    ).toBe(true);
  });

  it('returns core_rules_unavailable without inventing warnings for a legal build', () => {
    const result = findCharacterLegalityViolations(legalBuild(), 'missing');
    expect(result.warnings).toEqual([]);
    expect(result.uncomputable).toEqual(['core_rules_unavailable']);
  });

  it('still warns level 1 against code defaults when core_rules is missing', () => {
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
    expect(
      result.warnings.some((w) => w.code === 'ability_points_over_budget' && w.level === 1),
    ).toBe(true);
  });
});

describe('findCharacterLegalityViolations', () => {
  it('accepts a legal level-1 build', () => {
    expect(evaluate(legalBuild()).warnings).toEqual([]);
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
      }).warnings,
    ).toEqual([]);
  });

  it('warns on skill allocation over the level-1 budget', () => {
    const result = evaluate({
      ...legalBuild(),
      skills: [
        { id: '1', skill_val: 3, prof: true },
        { id: '2', skill_val: 3, prof: true },
      ],
    });
    expect(result.warnings[0]?.code).toBe('skill_points_over_budget');
    expect(result.warnings[0]?.level).toBe(1);
  });

  it('uses structured currency_negative at level 1', () => {
    const result = evaluate({ ...legalBuild(), currency: -30 });
    expect(result.warnings).toEqual([{ code: 'currency_negative', level: 1 }]);
  });

  it('uses structured currency_negative at level 2', () => {
    const result = evaluate({ ...legalBuild(), level: 2, currency: -30 });
    expect(result.warnings).toEqual([{ code: 'currency_negative', level: 2 }]);
  });

  it('takes the more permissive of rules override and code default', () => {
    const overBudgetByDefaults = {
      ...legalBuild(),
      abilities: { strength: 3, vitality: 3, agility: 2, acuity: 0, intelligence: 0, charisma: 0 },
    };
    expect(evaluate(overBudgetByDefaults).warnings.length).toBeGreaterThan(0);
    expect(
      evaluate(overBudgetByDefaults, {
        PROGRESSION_PLAYER: { baseAbilityPoints: 12 },
      } as never).warnings,
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

  it('warns at level 1 when a catalog feat fails requirements', () => {
    const result = evaluate(legalBuild(), undefined, catalog);
    expect(result.warnings).toContainEqual({
      code: 'feat_requirements_unmet',
      level: 1,
      featId: 'c1',
    });
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
