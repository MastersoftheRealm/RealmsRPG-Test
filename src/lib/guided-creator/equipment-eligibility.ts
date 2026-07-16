/**
 * Guided equipment Layer 2 — eligibility filters and weapon ranking.
 */

import { getArmamentMax } from '@/lib/game/formulas';
import {
  hasTwoHandedProperty,
  weaponMatchesArchetypeAbilities,
  type WeaponPropertyRef,
} from '@/lib/game/weapon-attack-ability';
import {
  GUIDED_GEAR_L2_MAX_UNIT_COST,
  resolveCatalogRowUnitCost,
} from '@/lib/guided-creator/equipment-currency';
import type { Abilities, AbilityName } from '@/types';
import type { ArchetypeCategory } from '@/types/archetype';
import { normalizeId } from '@/lib/utils';

export type EquipmentPhase = 'weapon' | 'armor' | 'gear';

export type ArmorStepMode = 'required' | 'optional' | 'none';

export interface AbilityRequirement {
  name: string;
  level: number;
}

export interface EligibleEquipmentRow {
  id: string;
  name: string;
  type: string;
  rarity?: string | null;
  properties?: WeaponPropertyRef[];
  gold_cost?: number;
  currency?: number;
  cost?: number;
  /** Per-item armament TP from properties */
  trainingPoints?: number | null;
  range?: string | null;
  abilityRequirement?: AbilityRequirement | null;
}

export interface EquipmentEligibilityContext {
  phase: EquipmentPhase;
  abilities: Abilities;
  martAbil: AbilityName | null;
  powAbil: AbilityName | null;
  archetypeType: ArchetypeCategory | null;
  /** IDs path recommends — ranked first in weapon phase */
  pathRecommendedIds?: Set<string>;
  /** Total TP already selected (armaments) */
  selectedTpSpent?: number;
  tpLimit?: number;
  remainingCurrency?: number;
}

function normalizeRarity(rarity: string | null | undefined): string {
  return String(rarity ?? 'common').trim().toLowerCase();
}

export function isCommonRarity(rarity: string | null | undefined): boolean {
  return normalizeRarity(rarity) === 'common';
}

export function deriveAbilityRequirementFromProperties(
  properties: WeaponPropertyRef[] | undefined
): AbilityRequirement | undefined {
  for (const p of properties ?? []) {
    const name = typeof p === 'string' ? p : String(p.name ?? '');
    const op1 = typeof p === 'object' && p != null ? (p.op_1_lvl ?? 0) : 0;
    const level = 1 + (Number(op1) || 0);
    if (level < 1) continue;
    if (name.includes('Strength Requirement')) return { name: 'Strength', level };
    if (name.includes('Agility Requirement')) return { name: 'Agility', level };
    if (name.includes('Vitality Requirement')) return { name: 'Vitality', level };
    if (name.includes('Acuity Requirement')) return { name: 'Acuity', level };
    if (name.includes('Intelligence Requirement')) return { name: 'Intelligence', level };
    if (name.includes('Charisma Requirement')) return { name: 'Charisma', level };
  }
  return undefined;
}

const ABILITY_KEY_MAP: Record<string, keyof Abilities> = {
  strength: 'strength',
  agility: 'agility',
  vitality: 'vitality',
  acuity: 'acuity',
  intelligence: 'intelligence',
  charisma: 'charisma',
};

export function meetsAbilityRequirement(
  req: AbilityRequirement | null | undefined,
  abilities: Abilities
): boolean {
  if (!req) return true;
  const key = ABILITY_KEY_MAP[req.name.toLowerCase()];
  if (!key) return true;
  return (abilities[key] ?? 0) >= req.level;
}

export function resolveArmorStepMode(
  explicit: ArmorStepMode | undefined,
  archetypeType: ArchetypeCategory | null
): ArmorStepMode {
  if (explicit) return explicit;
  if (archetypeType === 'power') return 'none';
  return 'required';
}

export function shouldSkipArmorPhase(mode: ArmorStepMode): boolean {
  return mode === 'none';
}

function matchesPhase(row: EligibleEquipmentRow, phase: EquipmentPhase): boolean {
  const t = row.type.toLowerCase();
  if (phase === 'weapon') return t === 'weapon' || t === 'shield';
  if (phase === 'armor') return t === 'armor';
  if (phase === 'gear') {
    return t === 'equipment' || t === 'item' || t === 'consumable' || t === 'tool';
  }
  return false;
}

export function isEligibleForGuidedEquipmentL2(
  row: EligibleEquipmentRow,
  ctx: EquipmentEligibilityContext
): boolean {
  if (!matchesPhase(row, ctx.phase)) return false;
  if (!isCommonRarity(row.rarity)) return false;

  const req =
    row.abilityRequirement ?? deriveAbilityRequirementFromProperties(row.properties);
  if (!meetsAbilityRequirement(req, ctx.abilities)) return false;

  const armamentMax = getArmamentMax(ctx.archetypeType ?? 'power');
  const itemTp = row.trainingPoints ?? 0;

  if (ctx.phase === 'weapon' || ctx.phase === 'armor') {
    if (itemTp > armamentMax) return false;
    /**
     * selectedTpSpent must be CROSS-PHASE only (e.g. armor TP while browsing weapons).
     * Current-phase draft spend is reclaimable when L2 replaces the selection.
     */
    const spent = ctx.selectedTpSpent ?? 0;
    const limit = ctx.tpLimit ?? Infinity;
    if (spent + itemTp > limit) return false;
  }

  if (ctx.phase === 'gear') {
    const unit = resolveCatalogRowUnitCost(row);
    if (unit > GUIDED_GEAR_L2_MAX_UNIT_COST) return false;
    /** remainingCurrency = gear budget ceiling (starting − arms), not after current gear. */
    if (ctx.remainingCurrency != null && unit > ctx.remainingCurrency) return false;
  }

  return true;
}

export function filterEligibleEquipment(
  rows: EligibleEquipmentRow[],
  ctx: EquipmentEligibilityContext
): EligibleEquipmentRow[] {
  return rows.filter((row) => isEligibleForGuidedEquipmentL2(row, ctx));
}

export interface WeaponHandValidation {
  valid: boolean;
  message?: string;
}

/** Block illegal combos such as two-handed weapon + shield. */
export function validateWeaponHandSelection(
  weapons: EligibleEquipmentRow[]
): WeaponHandValidation {
  const shields = weapons.filter((w) => w.type.toLowerCase() === 'shield');
  const twoHanded = weapons.some((w) => hasTwoHandedProperty(w.properties));
  if (twoHanded && shields.length > 0) {
    return {
      valid: false,
      message: 'Two-handed weapons cannot be used with a shield.',
    };
  }
  return { valid: true };
}

export function rankWeaponCandidates(
  rows: EligibleEquipmentRow[],
  ctx: {
    pathRecommendedIds?: Set<string>;
    martAbil?: AbilityName | null;
    powAbil?: AbilityName | null;
  }
): EligibleEquipmentRow[] {
  const rec = ctx.pathRecommendedIds ?? new Set<string>();
  return [...rows].sort((a, b) => {
    const aRec = rec.has(normalizeId(a.id)) ? 0 : 1;
    const bRec = rec.has(normalizeId(b.id)) ? 0 : 1;
    if (aRec !== bRec) return aRec - bRec;

    const aMatch = weaponMatchesArchetypeAbilities(
      a.properties,
      ctx.martAbil,
      ctx.powAbil,
      a.range
    )
      ? 0
      : 1;
    const bMatch = weaponMatchesArchetypeAbilities(
      b.properties,
      ctx.martAbil,
      ctx.powAbil,
      b.range
    )
      ? 0
      : 1;
    if (aMatch !== bMatch) return aMatch - bMatch;

    return a.name.localeCompare(b.name);
  });
}

/** Human-readable block reason for L2 rows that fail eligibility (when shown disabled). */
export function ineligibilityReason(
  row: EligibleEquipmentRow,
  ctx: EquipmentEligibilityContext
): string | undefined {
  if (isEligibleForGuidedEquipmentL2(row, ctx)) return undefined;

  const req =
    row.abilityRequirement ?? deriveAbilityRequirementFromProperties(row.properties);
  if (!meetsAbilityRequirement(req, ctx.abilities) && req) {
    return `Requires ${req.name} ${req.level}+`;
  }

  const armamentMax = getArmamentMax(ctx.archetypeType ?? 'power');
  const itemTp = row.trainingPoints ?? 0;
  if ((ctx.phase === 'weapon' || ctx.phase === 'armor') && itemTp > armamentMax) {
    return `Exceeds armament proficiency max (${armamentMax} Training Points)`;
  }

  if (!isCommonRarity(row.rarity)) {
    return 'Common items only during character creation';
  }

  if (ctx.phase === 'gear' && resolveCatalogRowUnitCost(row) > GUIDED_GEAR_L2_MAX_UNIT_COST) {
    return `Gear must cost ${GUIDED_GEAR_L2_MAX_UNIT_COST} Currency or less`;
  }

  return 'Not eligible';
}
