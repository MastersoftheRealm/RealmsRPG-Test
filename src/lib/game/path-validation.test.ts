import { describe, expect, it } from 'vitest';
import {
  validateLevel1Skills,
  validatePathDataForPublish,
} from '@/lib/game/path-validation';

describe('validateLevel1Skills (TASK-515)', () => {
  it('warns when more than 3 skills without blocking', () => {
    const issues = validateLevel1Skills(['a', 'b', 'c', 'd']);
    expect(issues.every((i) => i.severity === 'warning')).toBe(true);
    expect(issues.some((i) => i.message.includes('4 skills'))).toBe(true);
  });

  it('warns on sub-skills when resolver provided', () => {
    const issues = validateLevel1Skills(['base-1', 'sub-1'], {
      isSubSkill: (id) => id === 'sub-1',
    });
    expect(issues.some((i) => i.message.includes('sub-skill'))).toBe(true);
  });

  it('treats base_skill_id === 0 as sub-skill via resolver (any-base)', () => {
    const byId = new Map([
      ['base-1', { base_skill_id: undefined as number | undefined }],
      ['any-base', { base_skill_id: 0 as number | undefined }],
    ]);
    const issues = validateLevel1Skills(['base-1', 'any-base'], {
      isSubSkill: (id) => {
        const skill = byId.get(id);
        if (!skill) return null;
        return skill.base_skill_id != null;
      },
    });
    expect(issues.some((i) => i.message.includes('sub-skill'))).toBe(true);
  });

  it('stays quiet for up to 3 base skills', () => {
    const issues = validateLevel1Skills(['a', 'b', 'c'], {
      isSubSkill: () => false,
    });
    expect(issues).toEqual([]);
  });
});

describe('validatePathDataForPublish loadouts', () => {
  it('errors when legacy loadout exceeds TP budget', () => {
    const issues = validatePathDataForPublish(
      {
        level1: {
          loadouts: [
            {
              id: 'heavy',
              title: 'Heavy kit',
              armaments: [
                { id: 'a', quantity: 1 },
                { id: 'b', quantity: 1 },
              ],
            },
          ],
        },
      },
      {
        resolveItemTrainingPoints: (id) => (id === 'a' ? 3 : 4),
        trainingPointLimit: 5,
      }
    );
    expect(issues.some((i) => i.severity === 'error' && i.message.includes('Heavy kit'))).toBe(true);
  });
});
