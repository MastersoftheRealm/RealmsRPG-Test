import { describe, expect, it } from 'vitest';
import type { Skill } from '@/hooks';
import type { GuidedSpeciesContext } from '@/lib/guided-creator/guided-species-resolve';
import {
  calculateGuidedSkillPointBudget,
  pruneUnresolvedSkillAllocations,
} from '@/lib/guided-creator/skill-reconcile';
import { DEFAULT_DEFENSE_SKILLS } from '@/types';

const emptySpecies: GuidedSpeciesContext = {
  isMixed: false,
  species: null,
  speciesA: null,
  speciesB: null,
  displayName: null,
  ready: false,
};

const athletics = { id: '10', name: 'Athletics' } as Skill;

describe('pruneUnresolvedSkillAllocations', () => {
  it('keeps resolved keys and lists removed ids', () => {
    const result = pruneUnresolvedSkillAllocations({ '10': 1, gone: 1 }, new Set(['10']));
    expect(result.skills).toEqual({ '10': 1 });
    expect(result.removedIds).toEqual(['gone']);
  });
});

describe('calculateGuidedSkillPointBudget', () => {
  it('charges proficiency for a picked skill and leaves leftover points', () => {
    const budget = calculateGuidedSkillPointBudget({
      allocations: { '10': 0 },
      defenseVals: DEFAULT_DEFENSE_SKILLS,
      selectedSpeciesSkillIds: [],
      speciesContext: emptySpecies,
      catalog: [athletics],
    });
    expect(budget.remainingPoints).toBe(2);
  });

  it('does not treat leftover as 0 when the Codex catalog is still empty', () => {
    const budget = calculateGuidedSkillPointBudget({
      allocations: { '10': 0 },
      defenseVals: DEFAULT_DEFENSE_SKILLS,
      selectedSpeciesSkillIds: [],
      speciesContext: emptySpecies,
      catalog: [],
    });
    expect(budget.remainingPoints).toBe(2);
  });

  it('adds a species extra Skill point for grant id 0', () => {
    const speciesGrant: GuidedSpeciesContext = {
      ...emptySpecies,
      species: { id: 'sp-1', name: 'Elf', skills: ['0'] } as GuidedSpeciesContext['species'],
      ready: true,
    };
    const budget = calculateGuidedSkillPointBudget({
      allocations: {},
      defenseVals: DEFAULT_DEFENSE_SKILLS,
      selectedSpeciesSkillIds: [],
      speciesContext: speciesGrant,
      catalog: [athletics],
    });
    expect(budget.extraSkillPoints).toBe(1);
    expect(budget.totalPoints).toBe(4);
    expect(budget.remainingPoints).toBe(4);
  });
});
