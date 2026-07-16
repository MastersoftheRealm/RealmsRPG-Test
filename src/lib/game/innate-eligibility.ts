/**
 * Innate Power eligibility (REALMS Appendix G / GAME_RULES).
 * Used by admin path publish validation (TASK-473). Guided creator (TASK-471/472) may reuse.
 *
 * Budget source of truth: calculateArchetypeProgression(...).innateEnergy / innateThreshold.
 * Do NOT use getInnateEnergyMax / ARCHETYPE_CONFIGS.innateEnergy (mislabeled for Power).
 */

import type { ArchetypeCategory } from '@/types/archetype';
import type { PowerPart } from '@/hooks/codex-types';
import { ARCHETYPE_CONFIGS } from '@/lib/game/constants';
import { calculateArchetypeProgression } from '@/lib/game/formulas';
import {
  derivePowerDisplay,
  type PowerDocument,
} from '@/lib/calculators/power-calc';

/** Known healing / energy-gain power part ids (codex_parts). */
const DISALLOWED_INNATE_PART_IDS = new Set([
  '249', // Siphon
  '250', // Damage Siphon
  '307', // Heal
  '308', // True Heal
  '309', // Overheal
  '310', // True Overheal
  '311', // Major Heal
  '312', // Massive Heal
  '313', // Healing Boost
  '315', // Terminal Recovery
]);

export interface InnatePowerSnapshot {
  id: string;
  name?: string;
  /** Energy cost (from derivePowerDisplay). */
  energy: number;
  /** Display or raw action type (e.g. "Basic Action", "basic"). */
  actionType?: string;
  isReaction?: boolean;
  /** Part ids on the power (for healing / energy-gain checks). */
  partIds: string[];
  /** Part names (fallback when ids unknown). */
  partNames: string[];
}

export interface InnateEligibilityIssue {
  severity: 'error' | 'warning';
  message: string;
}

export function isHealingOrEnergyGainPart(part: {
  id?: string | number | null;
  name?: string | null;
}): boolean {
  const id = part.id != null ? String(part.id).trim() : '';
  if (id && DISALLOWED_INNATE_PART_IDS.has(id)) return true;

  const name = (part.name ?? '').trim().toLowerCase();
  if (!name) return false;
  if (name === 'siphon' || name === 'damage siphon') return true;
  if (/\bsuppress\s+healing\b/.test(name)) return false;
  if (/\bhealth\s+summon\b/.test(name)) return false;
  // Heal / Healing / Overheal / True Heal / Major Heal / etc.
  if (/\boverheal\b/.test(name) || /\bheal(ing|s)?\b/.test(name)) return true;
  return false;
}

/**
 * Innate powers must be Basic Action or Basic Reaction (Appendix G).
 * Quick / Free / Long are not eligible.
 */
export function isInnateEligibleActionType(
  actionType?: string | null,
  isReaction?: boolean
): boolean {
  const raw = String(actionType ?? '').trim();
  if (!raw) {
    // Bare reaction flag with no type → treat as Basic Reaction.
    return isReaction === true;
  }
  const lower = raw.toLowerCase();
  if (lower === 'basic') return true;
  if (lower === 'reaction') return true;
  if (/^basic(\s+(action|reaction))?$/.test(lower)) return true;
  return false;
}

export function evaluateInnatePowerEligibility(
  power: InnatePowerSnapshot,
  innateThreshold: number
): InnateEligibilityIssue[] {
  const issues: InnateEligibilityIssue[] = [];
  const label = power.name?.trim() || power.id;

  if (innateThreshold <= 0) {
    issues.push({
      severity: 'error',
      message: `Recommended innate power "${label}" is not allowed: this archetype has no Innate Threshold.`,
    });
    return issues;
  }

  if (power.energy > innateThreshold) {
    issues.push({
      severity: 'error',
      message: `Recommended innate power "${label}" Energy (${power.energy}) exceeds Innate Threshold (${innateThreshold}).`,
    });
  }

  if (!isInnateEligibleActionType(power.actionType, power.isReaction)) {
    const actionLabel =
      formatSavedActionHint(power.actionType, power.isReaction) || 'unknown';
    issues.push({
      severity: 'error',
      message: `Recommended innate power "${label}" Action Type must be Basic or Basic Reaction (got ${actionLabel}).`,
    });
  }

  const disallowedParts: string[] = [];
  const seen = new Set<string>();
  const partCount = Math.max(power.partIds.length, power.partNames.length);
  for (let i = 0; i < partCount; i++) {
    const id = power.partIds[i];
    const name = power.partNames[i];
    if (!isHealingOrEnergyGainPart({ id, name })) continue;
    const key = (name || id || '').toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    disallowedParts.push(name || id);
  }
  if (disallowedParts.length > 0) {
    issues.push({
      severity: 'error',
      message: `Recommended innate power "${label}" includes healing or energy-gain parts: ${disallowedParts.join(', ')}.`,
    });
  }

  return issues;
}

function formatSavedActionHint(
  actionType?: string | null,
  isReaction?: boolean
): string {
  const raw = String(actionType ?? '').trim();
  if (!raw) return isReaction ? 'Reaction' : '';
  if (/\b(action|reaction)\b/i.test(raw)) return raw;
  const base = raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  return isReaction ? `${base} Reaction` : `${base} Action`;
}

/** L1 progression budget from archetype type + starting profs (not getInnateEnergyMax). */
export function getLevel1InnateBudget(
  archetypeType: ArchetypeCategory,
  powerProfStart?: number | null,
  martialProfStart?: number | null
): { innateThreshold: number; innatePools: number; innateEnergy: number } {
  const defaults = ARCHETYPE_CONFIGS[archetypeType] ?? ARCHETYPE_CONFIGS.power;
  const powerProf =
    powerProfStart != null && Number.isFinite(powerProfStart)
      ? Number(powerProfStart)
      : defaults.proficiency.power;
  const martialProf =
    martialProfStart != null && Number.isFinite(martialProfStart)
      ? Number(martialProfStart)
      : defaults.proficiency.martial;

  const progression = calculateArchetypeProgression(1, martialProf, powerProf);
  return {
    innateThreshold: progression.innateThreshold,
    innatePools: progression.innatePools,
    innateEnergy: progression.innateEnergy,
  };
}

export function snapshotOfficialPowerForInnate(
  power: {
    id?: string | number | null;
    name?: string | null;
    actionType?: string | null;
    isReaction?: boolean | null;
    parts?: Array<{
      id?: string | number | null;
      name?: string | null;
      op_1_lvl?: number;
      op_2_lvl?: number;
      op_3_lvl?: number;
      applyDuration?: boolean;
    }> | null;
  },
  partsDb: PowerPart[]
): InnatePowerSnapshot {
  const id = String(power.id ?? '');
  const doc: PowerDocument = {
    name: power.name ?? undefined,
    parts: (power.parts ?? []) as PowerDocument['parts'],
    actionType: power.actionType ?? undefined,
    isReaction: power.isReaction === true,
  };
  const display = derivePowerDisplay(doc, partsDb);
  const parts = Array.isArray(power.parts) ? power.parts : [];
  return {
    id,
    name: power.name ? String(power.name) : undefined,
    energy: Math.max(0, Math.round(display.energy ?? 0)),
    actionType: power.actionType ?? display.actionType,
    isReaction: power.isReaction === true,
    partIds: parts.map((p) => (p.id != null ? String(p.id) : '')).filter(Boolean),
    partNames: parts.map((p) => (p.name != null ? String(p.name) : '')).filter(Boolean),
  };
}

export function validateRecommendedInnatePowers(
  innatePowerIds: string[],
  options: {
    archetypeType: ArchetypeCategory;
    powerProfStart?: number | null;
    martialProfStart?: number | null;
    resolvePower: (id: string) => InnatePowerSnapshot | null;
  }
): InnateEligibilityIssue[] {
  const issues: InnateEligibilityIssue[] = [];
  const ids = Array.from(new Set(innatePowerIds.map(String).filter(Boolean)));
  if (ids.length === 0) return issues;

  const budget = getLevel1InnateBudget(
    options.archetypeType,
    options.powerProfStart,
    options.martialProfStart
  );

  if (budget.innateEnergy <= 0 || budget.innateThreshold <= 0) {
    issues.push({
      severity: 'error',
      message:
        'Recommended innate powers are only allowed on Power or Powered-Martial paths (Innate Energy > 0).',
    });
    return issues;
  }

  let energySum = 0;
  const unknown: string[] = [];

  for (const id of ids) {
    const snapshot = options.resolvePower(id);
    if (!snapshot) {
      unknown.push(id);
      continue;
    }
    energySum += snapshot.energy;
    issues.push(...evaluateInnatePowerEligibility(snapshot, budget.innateThreshold));
  }

  if (unknown.length > 0) {
    issues.push({
      severity: 'error',
      message: `Recommended innate powers not found in official library: ${unknown.slice(0, 5).join(', ')}${unknown.length > 5 ? '…' : ''}.`,
    });
  }

  if (energySum > budget.innateEnergy) {
    issues.push({
      severity: 'error',
      message: `Recommended innate powers Energy sum (${energySum}) exceeds Innate Energy (${budget.innateEnergy}) for this path at level 1.`,
    });
  }

  return issues;
}
