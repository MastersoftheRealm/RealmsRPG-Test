/**
 * Character Creator — Shared Step Validation
 * ===========================================
 * Single source of truth for "what's missing" on each step.
 * Used by: Finalize step (aggregate all), Tab bar (warn when leaving step with issues).
 */

import type { CharacterDraft, CharacterPower, CharacterTechnique, Item } from '@/types';
import type { CreatorStep } from '@/stores/character-creator-store';
import { isCreatorStepSkipped } from '@/stores/character-creator-store';
import type { CoreRulesMap } from '@/types/core-rules';
import { getChoiceOptionIds } from '@/lib/choice-trait';
import { calculateAbilityPoints, calculateAbilityScoreCost, calculateHealthEnergyPool, calculateSkillPointsForEntity, calculateTrainingPoints } from '@/lib/game/formulas';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import { calculateSimpleSkillPointsSpent, resolveSkillAllocationRules } from '@/lib/game/skill-allocation';
import { buildRequiredProficiencies, calculateProficiencyTP, dedupeHighestProficiencies } from '@/lib/proficiencies';

export interface ValidationIssue {
  emoji: string;
  message: string;
  severity: 'error' | 'warning';
}

/**
 * Per-step completion descriptor (REALMS_PRODUCT_OVERVIEW.md Appendix D).
 * Powers a "2 of 3 picks made" style indicator on the tab bar and step footer,
 * rather than surfacing errors only on Continue.
 */
export interface StepCompletion {
  /** No outstanding errors or incompleteness for this step. */
  done: boolean;
  /** Choices/points made so far (where countable). */
  made: number;
  /** Choices/points required (where countable; 0 when not countable). */
  required: number;
  /** Short human label, e.g. "2 / 3 feats" or "Complete". */
  label: string;
  /** Step has no hard requirement (e.g. powers/equipment in path mode). */
  optional?: boolean;
}

export interface ValidationContext {
  allSpecies: Array<{
    id: string;
    name?: string;
    skills?: (string | number)[];
    species_traits?: (string | number)[];
  }>;
  codexSkills: Array<{ id: string; base_skill_id?: number }> | null;
  /** Used to validate species trait choice picks (option_trait_ids). */
  allTraits?: Array<{ id: string | number; option_trait_ids?: string[] }> | null;
  /** Core rules for skill soft-cap / past-cap costs (optional; defaults match SKILLS_AND_DEFENSES seed). */
  rules?: Partial<CoreRulesMap>;
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
  const { allSpecies, codexSkills, rules } = context;

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

        const anc = draft.ancestry;
        const traitsDb = context.allTraits;
        if (anc?.mixed === true && anc.speciesIds?.length === 2) {
          if (!anc.selectedSize) {
            issues.push({
              emoji: '📏',
              message: 'Choose a size for your mixed species.',
              severity: 'error',
            });
          }
          if (!anc.selectedSpeciesSkillIds || anc.selectedSpeciesSkillIds.length !== 2) {
            issues.push({
              emoji: '📚',
              message: 'Select one base skill from each parent species.',
              severity: 'error',
            });
          }
          const speciesTraits = anc.selectedSpeciesTraits;
          if (!speciesTraits?.[0] || !speciesTraits?.[1]) {
            issues.push({
              emoji: '🧬',
              message: 'Select one species trait from each parent species.',
              severity: 'error',
            });
          }
        } else if (
          anc?.id &&
          anc.mixed !== true &&
          traitsDb?.length &&
          !String(anc.id).startsWith('mixed:')
        ) {
          const rawSpeciesTraitIds =
            (species as { species_traits?: (string | number)[] } | undefined)?.species_traits || [];
          const choices = anc.selectedSpeciesTraitChoices ?? {};
          for (const tid of rawSpeciesTraitIds) {
            const trait = traitsDb.find((t) => String(t.id) === String(tid));
            const opts = getChoiceOptionIds(trait || {});
            if (opts.length === 0) continue;
            const picked = choices[String(tid)];
            if (!picked || !opts.includes(String(picked))) {
              issues.push({
                emoji: '🧬',
                message: 'Choose an option for each species trait that offers variants.',
                severity: 'error',
              });
              break;
            }
          }
        }
      }
      break;

    case 'abilities': {
      const maxAbilityPoints = calculateAbilityPoints(level);
      const usedAbilityPoints = draft.abilities
        ? Object.values(draft.abilities).reduce((sum, val) => sum + calculateAbilityScoreCost(val || 0), 0)
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
      const ancestry = draft.ancestry;
      if (!ancestry?.id && !ancestry?.speciesIds?.length) break;
      let speciesSkillIds: Set<string>;
      const isMixed = ancestry?.mixed === true && ancestry?.speciesIds?.length === 2;
      if (isMixed && Array.isArray(ancestry?.selectedSpeciesSkillIds) && ancestry.selectedSpeciesSkillIds.length === 2) {
        speciesSkillIds = new Set(ancestry.selectedSpeciesSkillIds.map((id) => String(id)));
      } else if (isMixed && ancestry?.speciesIds?.length === 2) {
        const a = allSpecies.find((s) => s.id === ancestry.speciesIds![0]);
        const b = allSpecies.find((s) => s.id === ancestry.speciesIds![1]);
        const combined = new Set<string>();
        (a?.skills || []).forEach((id: string | number) => combined.add(String(id)));
        (b?.skills || []).forEach((id: string | number) => combined.add(String(id)));
        speciesSkillIds = combined;
      } else {
        const species = allSpecies.find(
          (s) => s.id === ancestry?.id || String(s.name ?? '').toLowerCase() === String(draft.ancestry?.name ?? '').toLowerCase()
        );
        speciesSkillIds = new Set<string>((species?.skills || []).map((id) => String(id)));
      }
      const extraSkillPoints = speciesSkillIds.has('0') ? 1 : 0;
      const maxSkillPoints = calculateSkillPointsForEntity(level, 'character') + extraSkillPoints;
      const skillMeta = new Map<string, { isSubSkill: boolean }>();
      (codexSkills || []).forEach((s) => {
        skillMeta.set(String(s.id), { isSubSkill: s.base_skill_id !== undefined });
      });
      const totalUsedSkillPoints = calculateSimpleSkillPointsSpent(
        (draft.skills || {}) as Record<string, number>,
        speciesSkillIds,
        skillMeta,
        draft.defenseVals || draft.defenseSkills,
        resolveSkillAllocationRules(rules)
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
      const abilities = draft.abilities || {};
      const getAbility = (key: string | undefined): number =>
        key ? Number((abilities as Record<string, unknown>)[key] ?? 0) || 0 : 0;
      const highestAbility = Math.max(
        ...Object.values(abilities).filter((v): v is number => typeof v === 'number'),
        0
      );
      const archetypeAbility = Math.max(getAbility(draft.pow_abil), getAbility(draft.mart_abil), highestAbility);
      const trainingPoints = calculateTrainingPoints(level, archetypeAbility);

      const inventory = draft.equipment?.inventory || [];
      const weapons = inventory.filter((item) => item.type === 'weapon');
      const shields = inventory.filter((item) => item.type === 'shield');
      const armor = inventory.filter((item) => item.type === 'armor');
      const requiredProficiencies = buildRequiredProficiencies({
        powers: (draft.powers || []) as CharacterPower[],
        techniques: (draft.techniques || []) as CharacterTechnique[],
        weapons: weapons as Item[],
        shields: shields as Item[],
        armor: armor as Item[],
      });
      const spentTP = dedupeHighestProficiencies(requiredProficiencies).reduce(
        (sum, prof) => sum + calculateProficiencyTP(prof),
        0
      );
      const remainingTP = trainingPoints - spentTP;
      if (remainingTP < 0) {
        issues.push({
          emoji: '🎯',
          message: `Proficiency TP is over the limit by ${Math.abs(remainingTP)} (${spentTP}/${trainingPoints}).`,
          severity: 'warning',
        });
      }
      const baseCurrency = CHARACTER_STARTING_CURRENCY;
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

    case 'finalize': {
      if (!draft.name?.trim()) {
        issues.push({
          emoji: '📝',
          message: "Your hero needs a name! Give them something legendary.",
          severity: 'error',
        });
      }
      const hePool = calculateHealthEnergyPool(level, 'PLAYER', false);
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
      } else if (remainingHEPoints < 0) {
        issues.push({
          emoji: '❤️',
          message: `You've overspent Health-Energy by ${Math.abs(remainingHEPoints)} point${Math.abs(remainingHEPoints) === 1 ? '' : 's'}.`,
          severity: 'error',
        });
      }
      break;
    }
  }

  return issues;
}

/**
 * Returns all validation issues across every step (for Finalize "Review & Create").
 * Name and HE allocation are finalize-specific.
 */
export function getAllValidationIssues(
  draft: CharacterDraft,
  context: ValidationContext,
  rules?: Partial<CoreRulesMap>
): ValidationIssue[] {
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
  const hePool = calculateHealthEnergyPool(level, 'PLAYER', false, rules);
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
  } else if (remainingHEPoints < 0) {
    issues.push({
      emoji: '❤️',
      message: `You've overspent Health-Energy by ${Math.abs(remainingHEPoints)} point${Math.abs(remainingHEPoints) === 1 ? '' : 's'}.`,
      severity: 'error',
    });
  }

  return issues;
}

/** Steps with no hard requirement to advance (still validated for overspend). */
const OPTIONAL_STEPS: ReadonlySet<CreatorStep> = new Set<CreatorStep>(['powers']);

/**
 * Completion descriptor for a step: a `done` flag plus a countable
 * `made / required` where it is meaningful (abilities, skills, feats, finalize).
 * `done` is derived from the same validation as Continue, so the indicator
 * never disagrees with the gate.
 */
export function getStepCompletion(
  step: CreatorStep,
  draft: CharacterDraft,
  context: ValidationContext
): StepCompletion {
  const issues = getValidationIssuesForStep(step, draft, context);
  if (isCreatorStepSkipped(step, draft)) {
    return { done: true, made: 1, required: 0, optional: true, label: 'Not needed' };
  }
  const hasError = issues.some((i) => i.severity === 'error');
  const optional = OPTIONAL_STEPS.has(step);
  const done = optional ? !hasError : issues.length === 0;
  const level = draft.level || 1;

  const countable = (made: number, required: number, noun: string): StepCompletion => ({
    done,
    made,
    required,
    optional,
    label: required > 0 ? `${Math.max(0, made)} / ${required} ${noun}` : done ? 'Complete' : 'Incomplete',
  });

  switch (step) {
    case 'archetype':
      return countable(draft.archetype?.type ? 1 : 0, 1, '');

    case 'species':
      return countable(draft.ancestry?.id ? 1 : 0, 1, '');

    case 'abilities': {
      const required = calculateAbilityPoints(level);
      const made = draft.abilities
        ? Object.values(draft.abilities).reduce((sum, val) => sum + calculateAbilityScoreCost(val || 0), 0)
        : 0;
      return countable(made, required, 'points');
    }

    case 'feats': {
      const archetypeType = draft.archetype?.type;
      let expectedArchetypeFeatCount = 0;
      if (archetypeType === 'power') expectedArchetypeFeatCount = 1;
      else if (archetypeType === 'powered-martial') expectedArchetypeFeatCount = 2;
      else if (archetypeType === 'martial') expectedArchetypeFeatCount = 3;
      const required = expectedArchetypeFeatCount + 1; // + 1 character feat
      const all = draft.feats || [];
      const made = Math.min(required, all.length);
      return countable(made, required, 'feats');
    }

    case 'finalize': {
      if (!draft.name?.trim()) {
        return { done: false, made: 0, required: 1, label: 'Name needed' };
      }
      const hePool = calculateHealthEnergyPool(level, 'PLAYER', false);
      const used = (draft.healthPoints || 0) + (draft.energyPoints || 0);
      return countable(used, hePool, 'HE points');
    }

    // ancestry / skills / equipment / powers: binary completion (counts vary too much to be useful).
    default:
      return {
        done,
        made: done ? 1 : 0,
        required: optional ? 0 : 1,
        optional,
        label: optional ? (done ? 'Ready' : 'Optional') : done ? 'Complete' : 'Incomplete',
      };
  }
}
