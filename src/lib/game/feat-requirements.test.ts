import { describe, expect, it } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types';
import { characterToFeatRequirementCharacter, checkFeatRequirements } from './feat-requirements';
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
