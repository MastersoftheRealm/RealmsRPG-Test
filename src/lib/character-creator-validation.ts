/**
 * Character Creator — Shared Step Validation
 * ===========================================
 * Single source of truth for "what's missing" on each step.
 * Used by: Finalize step (aggregate all), Tab bar (warn when leaving step with issues).
 */

import type { CharacterDraft } from '@/types';
import type { CreatorStep } from '@/stores/character-creator-store';
import { calculateAbilityPoints, calculateSkillPointsForEntity, calculateTrainingPoints } from '@/lib/game/formulas';
import { calculateSimpleSkillPointsSpent } from '@/lib/game/skill-allocation';

const BASE_HE_POOL = 18; // 18 at level 1, +2 per level

export interface ValidationIssue {
  emoji: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationContext {
  allSpecies: Array<{ id: string; name?: string; skills?: (string | number)[] }>;
  codexSkills: Array<{ id: string; base_skill_id?: number }> | null;
}

/**
 * Returns validation issues for a single step (what's missing or wrong on that step).
 * Used when leaving a step via tab: show these if user navigates away incomplete.
 */
export function getValidationIssuesForStep(
  step: CreatorStep,
  draft: CharacterDraft,
  context: ValidationContext
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const level = draft.level || 1;
  const { allSpecies, codexSkills } = context;

  switch (step) {
    case 'archetype':
      if (!draft.archetype?.type) {
        issues.push({
          emoji: '🎭',
          message: "You haven't selected an archetype yet.",
          severity: 'error',
        });
      }
      break;

    case 'species':
      if (!draft.ancestry?.id) {
        issues.push({
          emoji: '🌟',
          message: "You need to choose your species.",
          severity: 'error',
        });
      }
      break;

    case 'ancestry':
      if (!draft.ancestry?.id) {
        issues.push({
          emoji: '🌟',
          message: "Species is required before choosing ancestry traits.",
          severity: 'error',
        });
      } else {
        const selectedTraits = draft.ancestry?.selectedTraits?.length ?? 0;
        const species = allSpecies.find(
          (s) => s.id === draft.ancestry?.id || String(s.name ?? '').toLowerCase() === String(draft.ancestry?.name ?? '').toLowerCase()
        );
        const ancestryTraitCount = (species && 'ancestry_traits' in species && Array.isArray((species as { ancestry_traits?: unknown[] }).ancestry_traits))
          ? (species as { ancestry_traits: unknown[] }).ancestry_traits.length
          : 1;
        if (ancestryTraitCount > 0 && selectedTraits < 1) {
          issues.push({
            emoji: '🧬',
            message: "You need to select at least one ancestry trait.",
            severity: 'error',
          });
        }
      }
      break;

    case 'abilities': {
      const maxAbilityPoints = calculateAbilityPoints(level);
      const usedAbilityPoints = draft.abilities
        ? Object.values(draft.abilities).reduce((sum, val) => sum + (val || 0), 0)
        : 0;
      const remainingAbilityPoints = maxAbilityPoints - usedAbilityPoints;
      if (remainingAbilityPoints > 0) {
        issues.push({
          emoji: '⚡',
          message: `You still have ${remainingAbilityPoints} ability point${remainingAbilityPoints === 1 ? '' : 's'} to spend.`,
          severity: 'warning',
        });
      } else if (remainingAbilityPoints < 0) {
        issues.push({
          emoji: '⚡',
          message: `You've overspent ability points by ${Math.abs(remainingAbilityPoints)}.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'skills': {
      if (!draft.ancestry?.id) break;
      const species = allSpecies.find(
        (s) => s.id === draft.ancestry?.id || String(s.name ?? '').toLowerCase() === String(draft.ancestry?.name ?? '').toLowerCase()
      );
      const speciesSkillIds = new Set<string>((species?.skills || []).map((id) => String(id)));
      const extraSkillPoints = speciesSkillIds.has('0') ? 1 : 0;
      const maxSkillPoints = calculateSkillPointsForEntity(level, 'character') + extraSkillPoints;
      const skillMeta = new Map<string, { isSubSkill: boolean }>();
      (codexSkills || []).forEach((s) => {
        skillMeta.set(s.id, { isSubSkill: s.base_skill_id !== undefined });
      });
      const totalUsedSkillPoints = calculateSimpleSkillPointsSpent(
        (draft.skills || {}) as Record<string, number>,
        speciesSkillIds,
        skillMeta,
        draft.defenseVals || draft.defenseSkills
      );
      const remainingSkillPoints = maxSkillPoints - totalUsedSkillPoints;
      if (remainingSkillPoints > 0) {
        issues.push({
          emoji: '📚',
          message: `You have ${remainingSkillPoints} skill point${remainingSkillPoints === 1 ? '' : 's'} left to spend.`,
          severity: 'warning',
        });
      } else if (remainingSkillPoints < 0) {
        issues.push({
          emoji: '📚',
          message: `You've overspent skill points by ${Math.abs(remainingSkillPoints)}.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'feats': {
      const archetypeType = draft.archetype?.type;
      const allFeats = draft.feats || [];
      const archetypeFeats = allFeats.filter((f: { type?: string }) => f.type === 'archetype');
      const characterFeats = allFeats.filter((f: { type?: string }) => f.type === 'character');
      let expectedArchetypeFeatCount = 0;
      if (archetypeType === 'power') expectedArchetypeFeatCount = 1;
      else if (archetypeType === 'powered-martial') expectedArchetypeFeatCount = 2;
      else if (archetypeType === 'martial') expectedArchetypeFeatCount = 3;
      if (archetypeFeats.length < expectedArchetypeFeatCount) {
        const diff = expectedArchetypeFeatCount - archetypeFeats.length;
        issues.push({
          emoji: '💪',
          message: `You need to select ${diff} more archetype feat${diff === 1 ? '' : 's'}.`,
          severity: 'warning',
        });
      }
      if (characterFeats.length < 1) {
        issues.push({
          emoji: '🌠',
          message: "You need to select a character feat.",
          severity: 'warning',
        });
      }
      break;
    }

    case 'equipment': {
      const highestAbility = draft.abilities
        ? Math.max(...Object.values(draft.abilities).filter((v): v is number => typeof v === 'number'), 0)
        : 0;
      const trainingPoints = calculateTrainingPoints(level, highestAbility);
      const equipmentTP = draft.trainingPointsSpent || 0;
      const remainingTP = trainingPoints - equipmentTP;
      if (remainingTP < 0) {
        issues.push({
          emoji: '🎯',
          message: `You've overspent training points by ${Math.abs(remainingTP)}.`,
          severity: 'error',
        });
      }
      const baseCurrency = 200;
      const equipmentItems = draft.equipment?.items || draft.equipment?.inventory || [];
      const spentCurrency = equipmentItems.reduce((sum: number, item: { cost?: number }) => sum + (item.cost || 0), 0);
      if (spentCurrency > baseCurrency) {
        issues.push({
          emoji: '💰',
          message: `You've overspent currency by ${spentCurrency - baseCurrency}c.`,
          severity: 'error',
        });
      }
      break;
    }

    case 'powers':
      // Optional step; no hard requirements. Could add "must have at least one power" if needed.
      break;

    case 'finalize':
      // Name is only required on finalize; we don't validate name when leaving other steps.
      break;
  }

  return issues;
}

/**
 * Returns all validation issues across every step (for Finalize "Review & Create").
 * Name and HE allocation are finalize-specific.
 */
export function getAllValidationIssues(draft: CharacterDraft, context: ValidationContext): ValidationIssue[] {
  const steps: CreatorStep[] = [
    'archetype',
    'species',
    'ancestry',
    'abilities',
    'skills',
    'feats',
    'equipment',
    'powers',
  ];
  const issues: ValidationIssue[] = [];

  // Name (finalize only)
  if (!draft.name?.trim()) {
    issues.push({
      emoji: '📝',
      message: "Your hero needs a name! Give them something legendary.",
      severity: 'error',
    });
  }

  for (const step of steps) {
    issues.push(...getValidationIssuesForStep(step, draft, context));
  }

  // Health/Energy allocation (abilities/finalize)
  const level = draft.level || 1;
  const hePool = BASE_HE_POOL + (level - 1) * 2;
  const healthAllocation = draft.healthPoints || 0;
  const energyAllocation = draft.energyPoints || 0;
  const usedHEPoints = healthAllocation + energyAllocation;
  const remainingHEPoints = hePool - usedHEPoints;
  if (remainingHEPoints > 0) {
    issues.push({
      emoji: '❤️',
      message: `You have ${remainingHEPoints} Health-Energy point${remainingHEPoints === 1 ? '' : 's'} to allocate.`,
      severity: 'warning',
    });
  }

  return issues;
}
