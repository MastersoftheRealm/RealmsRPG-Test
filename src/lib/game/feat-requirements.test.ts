import { describe, expect, it } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types';
import {
  applyTempModifiersForFeatRequirements,
  characterToFeatRequirementCharacter,
  checkFeatRequirements,
  getSheetFeatRequirementWarning,
} from './feat-requirements';
import type { Character } from '@/types';

const emptyCatalog = { skills: [], feats: [] };

describe('checkFeatRequirements level gates (M10)', () => {
  it('lets lvl_req win over feat level', () => {
    const feat = { id: 'f5', name: 'High Rank', feat_lvl: 5, lvl_req: 2 };
    const at2 = checkFeatRequirements(
      feat,
      { level: 2, abilities: DEFAULT_ABILITIES },
      emptyCatalog.skills,
      emptyCatalog.feats,
    );
    const at1 = checkFeatRequirements(
      feat,
      { level: 1, abilities: DEFAULT_ABILITIES },
      emptyCatalog.skills,
      emptyCatalog.feats,
    );
    expect(at2.met).toBe(true);
    expect(at1.met).toBe(false);
    expect(at1.reason).toMatch(/level 2/i);
  });

  it('without lvl_req requires character level ≥ 2 × feat level', () => {
    const feat = { id: 'f5', name: 'Rank Five', feat_lvl: 5 };
    const tooLow = checkFeatRequirements(
      feat,
      { level: 9, abilities: DEFAULT_ABILITIES },
      emptyCatalog.skills,
      emptyCatalog.feats,
    );
    const ok = checkFeatRequirements(
      feat,
      { level: 10, abilities: DEFAULT_ABILITIES },
      emptyCatalog.skills,
      emptyCatalog.feats,
    );
    expect(tooLow.met).toBe(false);
    expect(tooLow.reason).toMatch(/character level 10/i);
    expect(ok.met).toBe(true);
  });

  it('allows feat level 1 with no lvl_req at character level 1', () => {
    const feat = { id: 'open', name: 'Open Feat' };
    const result = checkFeatRequirements(
      feat,
      { level: 1, abilities: DEFAULT_ABILITIES },
      emptyCatalog.skills,
      emptyCatalog.feats,
    );
    expect(result.met).toBe(true);
  });
});

describe('characterToFeatRequirementCharacter numeric skills (T7 / N3)', () => {
  it('resolves Record<id, number> allocations as proficient for skill_req', () => {
    const character = characterToFeatRequirementCharacter({
      id: 'c1',
      name: 'Test',
      level: 3,
      abilities: { ...DEFAULT_ABILITIES, strength: 3 },
      skills: { '10': 2 },
    } as unknown as Character);
    const feat = {
      id: 'gated',
      name: 'Needs Athletics',
      skill_req: ['10'],
      skill_req_val: [5],
    };
    const skillsDb = [{ id: '10', name: 'Athletics', ability: 'strength' }];
    const result = checkFeatRequirements(feat, character, skillsDb, []);
    expect(result.met).toBe(true);
  });
});

describe('checkFeatRequirements leveled-feat prerequisite (TASK-889)', () => {
  it('names the previous rank with Roman suffix, not (Level N)', () => {
    const allFeats = [
      { id: '1', name: 'Speedy', feat_lvl: 1 },
      { id: '2', name: 'Speedy', feat_lvl: 2, base_feat_id: '1' },
    ];
    const result = checkFeatRequirements(
      allFeats[1]!,
      { level: 10, abilities: DEFAULT_ABILITIES },
      emptyCatalog.skills,
      allFeats,
    );
    expect(result.met).toBe(false);
    expect(result.reason).toBe('Requires Speedy');
  });

  it('uses Roman display name when the previous rank is level 2+', () => {
    const allFeats = [
      { id: '1', name: 'Speedy', feat_lvl: 1 },
      { id: '2', name: 'Speedy', feat_lvl: 2, base_feat_id: '1' },
      { id: '3', name: 'Speedy', feat_lvl: 3, base_feat_id: '1' },
    ];
    const result = checkFeatRequirements(
      allFeats[2]!,
      { level: 10, abilities: DEFAULT_ABILITIES, feats: [{ id: '1', name: 'Speedy' }] },
      emptyCatalog.skills,
      allFeats,
    );
    expect(result.met).toBe(false);
    expect(result.reason).toBe('Requires Speedy II');
    expect(result.reason).not.toContain('(Level');
  });
});

describe('getSheetFeatRequirementWarning (86e3jv9gz)', () => {
  const unwaveringMight = {
    id: 'um',
    name: 'Unwavering Might',
    lvl_req: 20,
    ability_req: ['might'],
    abil_req_val: [1],
  };

  it('returns joined reasons when real stats fail requirements', () => {
    const real = {
      level: 2,
      abilities: { ...DEFAULT_ABILITIES },
      defenseVals: { might: 0 },
    };
    const warning = getSheetFeatRequirementWarning(unwaveringMight, real, [], []);
    expect(warning).toMatch(/level 20/i);
    expect(warning).toMatch(/Might 1/i);
  });

  it('warns when a temp bonus covers a real miss', () => {
    const real = {
      level: 5,
      abilities: { ...DEFAULT_ABILITIES },
      defenseVals: { might: 1 },
    };
    const effective = applyTempModifiersForFeatRequirements(real, {
      defenses: { might: 1 },
    });
    const feat = {
      id: 'gated',
      name: 'Needs Might',
      ability_req: ['might'],
      abil_req_val: [2],
    };
    expect(checkFeatRequirements(feat, real, [], []).met).toBe(false);
    expect(checkFeatRequirements(feat, effective, [], []).met).toBe(true);
    const warning = getSheetFeatRequirementWarning(feat, real, [], [], effective);
    expect(warning).toMatch(/Might 2/i);
  });

  it('withholds the flag when a temp dip is the sole cause of failure', () => {
    const real = {
      level: 5,
      abilities: { ...DEFAULT_ABILITIES },
      defenseVals: { might: 2 },
    };
    const effective = applyTempModifiersForFeatRequirements(real, {
      defenses: { might: -1 },
    });
    const feat = {
      id: 'gated',
      name: 'Needs Might',
      ability_req: ['might'],
      abil_req_val: [2],
    };
    expect(checkFeatRequirements(feat, real, [], []).met).toBe(true);
    expect(checkFeatRequirements(feat, effective, [], []).met).toBe(false);
    expect(getSheetFeatRequirementWarning(feat, real, [], [], effective)).toBeUndefined();
  });
});
