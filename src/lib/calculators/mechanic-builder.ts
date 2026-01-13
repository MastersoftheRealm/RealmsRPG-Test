/**
 * Unified Mechanic Part Builder
 * ==============================
 * Shared utility for building mechanic parts from UI selections.
 * Used by Power Creator, Technique Creator, and future Empowered Technique Creator.
 * 
 * This consolidates common logic while preserving creator-specific calculations.
 */

import { PART_IDS, findByIdOrName } from '@/lib/id-constants';

// =============================================================================
// Types
// =============================================================================

export type CreatorType = 'power' | 'technique' | 'empowered';

export interface MechanicPartResult {
  id: number;
  name: string;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration?: boolean;
}

/** Part database item - works with both PowerPart and TechniquePart */
export interface PartDbItem {
  id: string | number;
  name: string;
  mechanic?: boolean;
}

/** Action type configuration */
export interface ActionConfig {
  type: 'basic' | 'quick' | 'free' | 'long3' | 'long4' | string;
  isReaction?: boolean;
}

/** Damage configuration - power style (type-based) */
export interface PowerDamageConfig {
  type: string; // magic, fire, physical, etc.
  diceAmount: number;
  dieSize: number;
  applyDuration?: boolean;
}

/** Damage configuration - technique style (additional damage) */
export interface TechniqueDamageConfig {
  diceAmount: number;
  dieSize: number;
}

/** Range configuration (power only) */
export interface RangeConfig {
  steps: number; // 0 = melee (1 space), 1+ = ranged increments
  applyDuration?: boolean;
}

/** Area of effect configuration (power only) */
export interface AreaConfig {
  type: 'none' | 'sphere' | 'cylinder' | 'cone' | 'line' | 'trail';
  level: number; // 1-based level (1 = base, 2 = first option, etc.)
  applyDuration?: boolean;
}

/** Duration configuration (power only) */
export interface DurationConfig {
  type: 'instant' | 'rounds' | 'minutes' | 'hours' | 'days' | 'permanent';
  value: number; // number of time units (1-based)
  focus?: boolean;
  noHarm?: boolean;
  endsOnActivation?: boolean;
  sustain?: number; // 0 = no sustain, 1+ = sustain level
}

/** Weapon configuration (technique only) */
export interface WeaponConfig {
  tp: number; // Training points of selected weapon
}

/** Full context for building mechanic parts */
export interface MechanicBuilderContext {
  creatorType: CreatorType;
  partsDb: PartDbItem[];
  
  // Common to both
  action?: ActionConfig;
  
  // Power-specific
  powerDamage?: PowerDamageConfig[];
  range?: RangeConfig;
  area?: AreaConfig;
  duration?: DurationConfig;
  
  // Technique-specific
  techniqueDamage?: TechniqueDamageConfig;
  weapon?: WeaponConfig;
}

// =============================================================================
// Part ID Mappings
// =============================================================================

/** Get action part IDs based on creator type */
function getActionPartIds(creatorType: CreatorType) {
  if (creatorType === 'power') {
    return {
      reaction: PART_IDS.POWER_REACTION,
      reactionName: 'Power Reaction',
      quickFree: PART_IDS.POWER_QUICK_OR_FREE_ACTION,
      quickFreeName: 'Power Quick or Free Action',
      long: PART_IDS.POWER_LONG_ACTION,
      longName: 'Power Long Action',
    };
  }
  // Technique (and empowered uses technique action parts)
  return {
    reaction: PART_IDS.REACTION,
    reactionName: 'Reaction',
    quickFree: PART_IDS.QUICK_OR_FREE_ACTION,
    quickFreeName: 'Quick or Free Action',
    long: PART_IDS.LONG_ACTION,
    longName: 'Long Action',
  };
}

/** Map power damage type to part ID and name */
function getPowerDamagePartInfo(damageType: string): { id: number; name: string } | null {
  const mapping: Record<string, { id: number; name: string }> = {
    magic: { id: PART_IDS.MAGIC_DAMAGE, name: 'Magic Damage' },
    light: { id: PART_IDS.LIGHT_DAMAGE, name: 'Light Damage' },
    radiant: { id: PART_IDS.LIGHT_DAMAGE, name: 'Light Damage' },
    fire: { id: PART_IDS.ELEMENTAL_DAMAGE, name: 'Elemental Damage' },
    cold: { id: PART_IDS.ELEMENTAL_DAMAGE, name: 'Elemental Damage' },
    ice: { id: PART_IDS.ELEMENTAL_DAMAGE, name: 'Elemental Damage' },
    lightning: { id: PART_IDS.ELEMENTAL_DAMAGE, name: 'Elemental Damage' },
    acid: { id: PART_IDS.ELEMENTAL_DAMAGE, name: 'Elemental Damage' },
    poison: { id: PART_IDS.POISON_OR_NECROTIC_DAMAGE, name: 'Poison or Necrotic Damage' },
    necrotic: { id: PART_IDS.POISON_OR_NECROTIC_DAMAGE, name: 'Poison or Necrotic Damage' },
    sonic: { id: PART_IDS.SONIC_DAMAGE, name: 'Sonic Damage' },
    spiritual: { id: PART_IDS.SPIRITUAL_DAMAGE, name: 'Spiritual Damage' },
    psychic: { id: PART_IDS.PSYCHIC_DAMAGE, name: 'Psychic Damage' },
    physical: { id: PART_IDS.PHYSICAL_DAMAGE, name: 'Physical Damage' },
    bludgeoning: { id: PART_IDS.PHYSICAL_DAMAGE, name: 'Physical Damage' },
    piercing: { id: PART_IDS.PHYSICAL_DAMAGE, name: 'Physical Damage' },
    slashing: { id: PART_IDS.PHYSICAL_DAMAGE, name: 'Physical Damage' },
  };
  return mapping[damageType] || null;
}

/** Map area effect type to part ID and name */
function getAreaPartInfo(areaType: string): { id: number; name: string } | null {
  const mapping: Record<string, { id: number; name: string }> = {
    sphere: { id: PART_IDS.SPHERE_OF_EFFECT, name: 'Sphere of Effect' },
    cylinder: { id: PART_IDS.CYLINDER_OF_EFFECT, name: 'Cylinder of Effect' },
    cone: { id: PART_IDS.CONE_OF_EFFECT, name: 'Cone of Effect' },
    line: { id: PART_IDS.LINE_OF_EFFECT, name: 'Line of Effect' },
    trail: { id: PART_IDS.TRAIL_OF_EFFECT, name: 'Trail of Effect' },
  };
  return mapping[areaType] || null;
}

/** Map duration type to part ID and name */
function getDurationPartInfo(durationType: string): { id: number; name: string } | null {
  const mapping: Record<string, { id: number; name: string }> = {
    rounds: { id: PART_IDS.DURATION_ROUND, name: 'Duration (Round)' },
    minutes: { id: PART_IDS.DURATION_MINUTE, name: 'Duration (Minute)' },
    hours: { id: PART_IDS.DURATION_HOUR, name: 'Duration (Hour)' },
    days: { id: PART_IDS.DURATION_DAYS, name: 'Duration (Days)' },
    permanent: { id: PART_IDS.DURATION_PERMANENT, name: 'Duration (Permanent)' },
  };
  return mapping[durationType] || null;
}

// =============================================================================
// Damage Level Calculators
// =============================================================================

/**
 * Calculate power damage opt1 level
 * Formula: floor((totalDamage - 4) / 2)
 */
export function calculatePowerDamageLevel(diceAmount: number, dieSize: number): number {
  const totalDamage = diceAmount * dieSize;
  return Math.max(0, Math.floor((totalDamage - 4) / 2));
}

/**
 * Calculate technique additional damage level
 * From technique-calc.ts computeAdditionalDamageLevel
 */
export function calculateTechniqueDamageLevel(diceAmount: number, dieSize: number): number {
  if (diceAmount <= 0 || dieSize < 4) return 0;
  // Level 0 = 1d4, each +2 avg damage = +1 level
  const avgDamage = diceAmount * ((dieSize + 1) / 2);
  const baseDamage = 2.5; // 1d4 average
  return Math.max(0, Math.floor((avgDamage - baseDamage) / 2));
}

/**
 * Calculate technique split damage dice level
 */
export function calculateSplitDiceLevel(diceAmount: number): number {
  // 1 die = 0 splits, 2 dice = 1 split (level 0), 3 dice = 2 splits (level 1), etc.
  return Math.max(0, diceAmount - 1);
}

// =============================================================================
// Core Builder
// =============================================================================

/**
 * Build mechanic parts from context
 * Unified builder for powers, techniques, and future empowered techniques
 */
export function buildMechanicParts(ctx: MechanicBuilderContext): MechanicPartResult[] {
  const { creatorType, partsDb } = ctx;
  const parts: MechanicPartResult[] = [];
  const supportsDuration = creatorType === 'power' || creatorType === 'empowered';

  // Helper to add part if it exists in database
  function addPart(
    partId: number,
    partName: string,
    op1 = 0,
    applyDuration = false
  ): void {
    let def = findByIdOrName(partsDb, { id: partId });
    if (!def) def = findByIdOrName(partsDb, { name: partName });
    if (def && def.mechanic) {
      parts.push({
        id: Number(def.id),
        name: (def.name as string) || partName,
        op_1_lvl: op1,
        op_2_lvl: 0,
        op_3_lvl: 0,
        ...(supportsDuration ? { applyDuration } : {}),
      });
    }
  }

  // ----- Action Type -----
  if (ctx.action) {
    const actionIds = getActionPartIds(creatorType);
    const { type, isReaction } = ctx.action;

    if (isReaction) {
      addPart(actionIds.reaction, actionIds.reactionName, 0);
    }

    switch (type) {
      case 'quick':
        addPart(actionIds.quickFree, actionIds.quickFreeName, 0);
        break;
      case 'free':
        addPart(actionIds.quickFree, actionIds.quickFreeName, 1);
        break;
      case 'long3':
        addPart(actionIds.long, actionIds.longName, 0);
        break;
      case 'long4':
        addPart(actionIds.long, actionIds.longName, 1);
        break;
      // 'basic' = no action part needed
    }
  }

  // ----- Power Damage (type-based) -----
  if (ctx.powerDamage && ctx.powerDamage.length > 0) {
    for (const dmg of ctx.powerDamage) {
      if (dmg.type === 'none' || dmg.diceAmount <= 0 || dmg.dieSize < 4) continue;
      const partInfo = getPowerDamagePartInfo(dmg.type);
      if (partInfo) {
        const level = calculatePowerDamageLevel(dmg.diceAmount, dmg.dieSize);
        addPart(partInfo.id, partInfo.name, level, dmg.applyDuration);
      }
    }
  }

  // ----- Technique Damage (additional damage) -----
  if (ctx.techniqueDamage) {
    const { diceAmount, dieSize } = ctx.techniqueDamage;
    if (diceAmount > 0 && dieSize >= 4) {
      const level = calculateTechniqueDamageLevel(diceAmount, dieSize);
      addPart(PART_IDS.ADDITIONAL_DAMAGE, 'Additional Damage', level);

      // Split damage dice
      const splits = calculateSplitDiceLevel(diceAmount);
      if (splits > 0) {
        addPart(PART_IDS.SPLIT_DAMAGE_DICE, 'Split Damage Dice', splits - 1);
      }
    }
  }

  // ----- Range (power only) -----
  if (ctx.range && ctx.range.steps > 0) {
    addPart(
      PART_IDS.POWER_RANGE,
      'Power Range',
      Math.max(0, ctx.range.steps - 1),
      ctx.range.applyDuration
    );
  }

  // ----- Area of Effect (power only) -----
  if (ctx.area && ctx.area.type !== 'none') {
    const areaInfo = getAreaPartInfo(ctx.area.type);
    if (areaInfo) {
      // level is 1-based, op_1_lvl is 0-based
      addPart(areaInfo.id, areaInfo.name, Math.max(0, ctx.area.level - 1), ctx.area.applyDuration);
    }
  }

  // ----- Duration (power only) -----
  if (ctx.duration && ctx.duration.type !== 'instant') {
    const { type, value, focus, noHarm, endsOnActivation, sustain } = ctx.duration;

    // Duration modifiers
    if (focus) {
      addPart(PART_IDS.DURATION_FOCUS || 304, 'Focus for Duration', 0);
    }
    if (noHarm) {
      addPart(PART_IDS.DURATION_NO_HARM || 303, 'No Harm or Adaptation for Duration', 0);
    }
    if (endsOnActivation) {
      addPart(PART_IDS.DURATION_ENDS_ON_ACTIVATION || 302, 'Duration Ends On Activation', 0);
    }
    if (sustain && sustain > 0) {
      addPart(PART_IDS.DURATION_SUSTAIN || 305, 'Sustain for Duration', Math.max(0, sustain - 1));
    }

    // Duration base type
    const durationInfo = getDurationPartInfo(type);
    if (durationInfo) {
      // value is 1-based, op_1_lvl calculation varies by type
      let op1 = 0;
      if (type === 'rounds') {
        // Only add for > 1 round. For 2 rounds: op1=0, 3 rounds: op1=1, etc.
        if (value > 1) {
          op1 = Math.max(0, value - 2);
          addPart(durationInfo.id, durationInfo.name, op1);
        }
      } else if (type === 'permanent') {
        addPart(durationInfo.id, durationInfo.name, 0);
      } else {
        // minutes, hours, days: value-1 for op1
        op1 = Math.max(0, value - 1);
        addPart(durationInfo.id, durationInfo.name, op1);
      }
    }
  }

  // ----- Weapon (technique only) -----
  if (ctx.weapon && ctx.weapon.tp >= 1) {
    addPart(PART_IDS.ADD_WEAPON_ATTACK, 'Add Weapon Attack', ctx.weapon.tp - 1);
  }

  return parts;
}

// =============================================================================
// Convenience Wrappers (for backwards compatibility)
// =============================================================================

/** Legacy power mechanic context */
export interface LegacyPowerMechanicContext {
  actionTypeSelection?: string;
  reaction?: boolean;
  damageType?: string;
  diceAmt?: number;
  dieSize?: number;
  range?: number;
  rangeApplyDuration?: boolean;
  areaType?: string;
  areaLevel?: number;
  areaApplyDuration?: boolean;
  durationType?: string;
  durationValue?: number;
  focus?: boolean;
  noHarm?: boolean;
  endsOnActivation?: boolean;
  sustain?: number;
  partsDb?: PartDbItem[];
}

/** Legacy technique mechanic context */
export interface LegacyTechniqueMechanicContext {
  actionTypeSelection?: string;
  reaction?: boolean;
  diceAmt?: number;
  dieSize?: number;
  weaponTP?: number;
  partsDb?: PartDbItem[];
}

/**
 * Build power mechanic parts (legacy wrapper)
 */
export function buildPowerMechanicParts(ctx: LegacyPowerMechanicContext): MechanicPartResult[] {
  const powerDamage: PowerDamageConfig[] = [];
  if (ctx.damageType && ctx.damageType !== 'none' && ctx.diceAmt && ctx.dieSize) {
    powerDamage.push({
      type: ctx.damageType,
      diceAmount: ctx.diceAmt,
      dieSize: ctx.dieSize,
      applyDuration: false, // Could be extended to support per-damage applyDuration
    });
  }

  return buildMechanicParts({
    creatorType: 'power',
    partsDb: ctx.partsDb || [],
    action: {
      type: ctx.actionTypeSelection || 'basic',
      isReaction: ctx.reaction,
    },
    powerDamage,
    range: ctx.range !== undefined ? {
      steps: ctx.range,
      applyDuration: ctx.rangeApplyDuration,
    } : undefined,
    area: ctx.areaType && ctx.areaType !== 'none' ? {
      type: ctx.areaType as AreaConfig['type'],
      level: ctx.areaLevel || 1,
      applyDuration: ctx.areaApplyDuration,
    } : undefined,
    duration: ctx.durationType && ctx.durationType !== 'instant' ? {
      type: ctx.durationType as DurationConfig['type'],
      value: ctx.durationValue || 1,
      focus: ctx.focus,
      noHarm: ctx.noHarm,
      endsOnActivation: ctx.endsOnActivation,
      sustain: ctx.sustain,
    } : undefined,
  });
}

/**
 * Build technique mechanic parts (legacy wrapper)
 */
export function buildTechniqueMechanicParts(ctx: LegacyTechniqueMechanicContext): MechanicPartResult[] {
  return buildMechanicParts({
    creatorType: 'technique',
    partsDb: ctx.partsDb || [],
    action: {
      type: ctx.actionTypeSelection || 'basic',
      isReaction: ctx.reaction,
    },
    techniqueDamage: ctx.diceAmt && ctx.dieSize ? {
      diceAmount: ctx.diceAmt,
      dieSize: ctx.dieSize,
    } : undefined,
    weapon: ctx.weaponTP !== undefined ? {
      tp: ctx.weaponTP,
    } : undefined,
  });
}
