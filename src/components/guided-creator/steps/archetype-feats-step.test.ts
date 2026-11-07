import { describe, expect, it } from 'vitest';
import type { CoreRulesMap } from '@/types/core-rules';
import { guidedLevel1ArchetypeFeatCap } from './archetype-feats-step';

describe('guidedLevel1ArchetypeFeatCap', () => {
  it('uses code defaults when rules are omitted', () => {
    expect(guidedLevel1ArchetypeFeatCap('power')).toBe(1);
    expect(guidedLevel1ArchetypeFeatCap('martial')).toBe(3);
  });

  it('honors DB ARCHETYPES featLimit override for powered-martial at level 1', () => {
    const rules = {
      ARCHETYPES: {
        configs: {
          'powered-martial': {
            featLimit: 4,
            armamentMax: 8,
            innateEnergy: 6,
            innateThreshold: 6,
            innatePools: 1,
            proficiency: { martial: 1, power: 1 },
            trainingPointBonus: 0,
          },
        },
      },
    } as unknown as Partial<CoreRulesMap>;
    expect(guidedLevel1ArchetypeFeatCap('powered-martial', rules)).toBe(5);
    expect(guidedLevel1ArchetypeFeatCap('powered-martial')).toBe(2);
  });
});
