/**
 * Power composition resolver (ADR-0029)
 * =====================================
 * Built-in variants replace the Choice / Split / Randomize / Reverse Effects part hacks.
 * Energy still comes from the single-chassis equation on each resolved spec; the
 * structure only combines those totals. No UI imports (ADR-0010).
 */

import type { PowerPart } from '@/hooks/codex-types';
import type { CharacterPower } from '@/types';
import { PART_IDS } from '@/lib/id-constants';
import { normalizeAttackMode, type AttackMode } from '@/lib/attack-mode';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import { formatCost } from '@/lib/game/creator-constants';
import { buildMechanicParts } from './mechanic-builder';
import { buildRequiredProficiencies, calculateProficiencyTP } from '@/lib/proficiencies';
import {
  analyzePowerEnergy,
  buildPowerPartsPayloadForCost,
  calculatePowerCosts,
  derivePlainPowerDisplay,
  deriveStructuredDuration,
  finalizePowerEnergy,
  formatEnergyStat,
  type DerivePowerDisplayOptions,
  type PartChipData,
  type PowerDisplayData,
  type PowerDocument,
  type StructuredPowerDuration,
} from './power-calc';
import { POWER_CALC_SECTION_BY_NAME } from './power-mechanic-constants';

// =============================================================================
// Contract
// =============================================================================

export const POWER_COMPOSITION_STRUCTURES = [
  'none',
  'choice',
  'alternate',
  'modify',
  'randomize',
] as const;

export type PowerCompositionStructure = (typeof POWER_COMPOSITION_STRUCTURES)[number];

/** Even-sided dice the Randomize rule names (1d2–1d100). Not the damage `DIE_SIZES`. */
export const POWER_RANDOMIZE_DIE_SIDES = [2, 4, 6, 8, 10, 12, 20, 100] as const;

export type PowerVariantPolarity = 'positive' | 'negative';

/** Creator fields that stay overridden even when they equal Shared or the empty default. */
export const POWER_VARIANT_OVERRIDE_FIELDS = [
  'action',
  'attack',
  'range',
  'area',
  'duration',
  'damage',
] as const;

export type PowerVariantOverrideField = (typeof POWER_VARIANT_OVERRIDE_FIELDS)[number];

/** Power fields a variant (or the Reverse tab) may set. */
export type PowerVariantSpec = Pick<
  PowerDocument,
  'description' | 'parts' | 'damage' | 'actionType' | 'isReaction' | 'range' | 'area' | 'duration'
> & {
  /** Creator round-trip for Alternate variants; pricing does not read it. */
  attackMode?: AttackMode | undefined;
};

export interface PowerVariant extends PowerVariantSpec {
  id: string;
  label: string;
  /** Randomize only. Defaults to positive. */
  polarity?: PowerVariantPolarity | undefined;
  /**
   * Fields the creator forced. Kept when the value equals Shared or the empty default,
   * so a later load does not treat the field as inherited.
   */
  overrides?: PowerVariantOverrideField[] | undefined;
}

export type PowerReverseSpec = PowerVariantSpec & {
  /** Sticky Override flags for the Reverse tab. Same meaning as `PowerVariant.overrides`. */
  overrides?: PowerVariantOverrideField[] | undefined;
};

export interface PowerRandomizeDie {
  sides: number;
  /** One variant id per face (index 0 = face 1). Repeats allowed. */
  faces: string[];
}

export interface PowerComposition {
  structure: PowerCompositionStructure;
  variants: PowerVariant[];
  reverse?: PowerReverseSpec | undefined;
  die?: PowerRandomizeDie | undefined;
}

export const POWER_COMPOSITION_STRUCTURE_LABELS: Record<PowerCompositionStructure, string> = {
  none: 'None',
  choice: 'Choice',
  alternate: 'Alternate',
  modify: 'Modify',
  randomize: 'Randomize',
};

const POWER_ALTERNATE_HELP =
  'Each variant is a complete power (action, range, area, duration, damage, and parts). When you use the power you pick one variant and pay that variant’s energy, which may cost less, the same, or more than the others.';

const POWER_RANDOMIZE_HELP =
  'Each face is its own effect and shares only the action type. Shared defaults pre-fill a new face and add no energy. Changing Shared later does not change a face that already exists. A good outcome costs its full energy, including that action. A bad outcome subtracts half the drawback, priced as a basic action on that face alone, divided by the action-type multiplier, including Reaction. A slower action removes more and a quicker action removes less. Basic stays half. Each face is weighted by its chance. Once the power has positive energy, it costs at least 1 EN. If nothing is positive, Energy is a dash.';

const POWER_REVERSE_ACTION_NOTE =
  'A drawback on a power that benefits you or an ally uses the Reverse tab’s own range, area, and duration (Shared’s, until you override them). A longer range adds only the extra range cost, once; a shorter range refunds the difference on that tab. Its reduction is half that energy divided by the action-type multiplier, including Reaction, so a slower action removes more and a quicker action removes less. Basic stays half. It cannot be nullified or reduced by you or an ally.';

const POWER_REVERSE_FLOOR_NOTE =
  'The 1 EN floor still applies when the power has positive energy, so the discount cannot drop it below 1 EN.';

const POWER_MODIFY_HELP =
  'Shared is paid once, including its action type, which is locked on each piece. Range, area, and duration start as Shared and can be overridden. Each piece adds only its own parts and damage, priced at that piece’s range, area, and duration. A longer range adds only the extra range cost, once; a shorter range refunds the difference on that piece. A larger area or longer duration raises only that piece’s parts; a smaller area or shorter duration lowers them.';

const POWER_CHOICE_HELP =
  'Portions of one power. Action type is locked to Shared. Each portion’s range, area, and duration start as Shared and can be overridden. You pay Shared once, plus the most expensive portion, and each portion’s parts are priced at that portion’s own range, area, and duration. A longer range adds only the extra range cost, once; a shorter range refunds the difference on that portion.';

/** Half the basic-footprint drawback, before dividing by the action-type multiplier. */
const DRAWBACK_WEIGHT = 0.5;

/** Rule text for a structure or the Reverse add-on. */
export function powerCompositionHelpText(key: PowerCompositionStructure | 'reverse'): string {
  if (key === 'none') return '';
  if (key === 'alternate') return POWER_ALTERNATE_HELP;
  if (key === 'randomize') return POWER_RANDOMIZE_HELP;
  if (key === 'modify') return POWER_MODIFY_HELP;
  if (key === 'choice') return POWER_CHOICE_HELP;
  if (key !== 'reverse') return '';
  // The live codex sentence for part 388 still says a flat 50%. Do not show it
  // until that rewrite is applied. The confirmed rule is the note below.
  return `${POWER_REVERSE_ACTION_NOTE} ${POWER_REVERSE_FLOOR_NOTE}`;
}

const COMPOSITION_MECHANIC_PART_IDS = new Set<number>([
  PART_IDS.POWER_RANDOMIZE,
  PART_IDS.POWER_REVERSE_EFFECTS,
  PART_IDS.POWER_CHOICE,
  PART_IDS.POWER_SPLIT_GROUPS,
]);

const COMPOSITION_MECHANIC_PART_NAMES = new Set([
  'Randomize',
  'Reverse Effects',
  'Choice',
  'Split Power Parts into Groups',
]);

/** Legacy mechanic parts replaced by `composition`; hidden from the creator picker. */
export function isPowerCompositionMechanicPart(part: {
  id?: string | number | null | undefined;
  name?: string | null | undefined;
}): boolean {
  const idNum = Number(String(part.id ?? '').replace(/^s/, ''));
  if (Number.isFinite(idNum) && COMPOSITION_MECHANIC_PART_IDS.has(idNum)) return true;
  return COMPOSITION_MECHANIC_PART_NAMES.has(String(part.name ?? '').trim());
}

// =============================================================================
// Normalize
// =============================================================================

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function pickSpec(raw: Record<string, unknown>): PowerVariantSpec {
  const spec: PowerVariantSpec = {};
  if (typeof raw.description === 'string') spec.description = raw.description;
  if (Array.isArray(raw.parts)) spec.parts = raw.parts as PowerVariantSpec['parts'];
  if (Array.isArray(raw.damage)) spec.damage = raw.damage as PowerVariantSpec['damage'];
  if (typeof raw.actionType === 'string') spec.actionType = raw.actionType;
  if (typeof raw.isReaction === 'boolean') spec.isReaction = raw.isReaction;
  if (isRecord(raw.range)) spec.range = raw.range as PowerVariantSpec['range'];
  if (isRecord(raw.area)) spec.area = raw.area as PowerVariantSpec['area'];
  if (isRecord(raw.duration)) spec.duration = raw.duration as PowerVariantSpec['duration'];
  const attackMode = normalizeAttackMode(raw.attackMode);
  if (attackMode) spec.attackMode = attackMode;
  return spec;
}

const OVERRIDE_FIELD_SET = new Set<string>(POWER_VARIANT_OVERRIDE_FIELDS);

function pickOverrides(raw: Record<string, unknown>): PowerVariantOverrideField[] | undefined {
  if (!Array.isArray(raw.overrides)) return undefined;
  const fields = raw.overrides.filter(
    (field): field is PowerVariantOverrideField =>
      typeof field === 'string' && OVERRIDE_FIELD_SET.has(field),
  );
  return fields.length > 0 ? fields : undefined;
}

/** Parse `payload.composition`; null when absent, invalid, or a plain power. */
export function normalizePowerComposition(raw: unknown): PowerComposition | null {
  if (!isRecord(raw)) return null;
  const structure = POWER_COMPOSITION_STRUCTURES.includes(
    raw.structure as PowerCompositionStructure,
  )
    ? (raw.structure as PowerCompositionStructure)
    : 'none';
  const variants: PowerVariant[] =
    structure === 'none' || !Array.isArray(raw.variants)
      ? []
      : raw.variants.filter(isRecord).map((v, i) => {
          const overrides = pickOverrides(v);
          return {
            ...pickSpec(structure === 'modify' ? { ...v, description: undefined } : v),
            id: typeof v.id === 'string' && v.id.trim() ? v.id : `v${i + 1}`,
            label:
              typeof v.label === 'string' && v.label.trim() ? v.label.trim() : `Variant ${i + 1}`,
            ...(v.polarity === 'negative' || v.polarity === 'positive'
              ? { polarity: v.polarity as PowerVariantPolarity }
              : {}),
            ...(overrides ? { overrides } : {}),
          };
        });
  let reverse: PowerReverseSpec | undefined;
  if (isRecord(raw.reverse)) {
    const overrides = pickOverrides(raw.reverse);
    reverse = {
      ...pickSpec(raw.reverse),
      ...(overrides ? { overrides } : {}),
    };
  }
  let die: PowerRandomizeDie | undefined;
  if (structure === 'randomize' && isRecord(raw.die)) {
    const sides = Number(raw.die.sides);
    if ((POWER_RANDOMIZE_DIE_SIDES as readonly number[]).includes(sides)) {
      const faces = Array.isArray(raw.die.faces) ? raw.die.faces.map((f) => String(f ?? '')) : [];
      die = { sides, faces: Array.from({ length: sides }, (_, i) => faces[i] ?? '') };
    }
  }
  if (structure === 'none' && !reverse) return null;
  return {
    structure,
    variants,
    ...(reverse ? { reverse } : {}),
    ...(die ? { die } : {}),
  };
}

/** Why Save is disabled for an incomplete Randomize die or an empty Reverse drawback. */
export function powerCreatorSaveBlockReason(input: {
  composition?: PowerComposition | null | undefined;
  reverseIncomplete?: boolean | undefined;
}): string | null {
  const parts: string[] = [];
  const composition = input.composition;
  if (composition && !isRandomizeDieComplete(composition)) {
    const die = composition.die;
    const faces = die?.faces ?? [];
    const ids = new Set(composition.variants.map((v) => v.id));
    const unassigned = faces.filter((face) => !ids.has(face)).length;
    const faceless = composition.variants.filter((v) => !faces.includes(v.id));
    const bits: string[] = [];
    if (!die || composition.variants.length === 0) {
      bits.push('Add variants and assign every die face');
    } else {
      if (unassigned > 0) {
        bits.push(
          unassigned === 1
            ? '1 die face has no variant'
            : `${unassigned} die faces have no variant`,
        );
      }
      if (faceless.length > 0) {
        const names = faceless.map((v) => v.label).join(', ');
        bits.push(faceless.length === 1 ? `${names} has no die face` : `${names} have no die face`);
      }
    }
    parts.push(`${bits.join(', ')}. Assign every face and give every variant a face to save.`);
  }
  if (input.reverseIncomplete) {
    parts.push('Add a drawback on the Reverse tab to save.');
  }
  return parts.length > 0 ? parts.join(' ') : null;
}

/** True when every Randomize face names an existing variant and every variant has a face. */
export function isRandomizeDieComplete(composition: PowerComposition): boolean {
  if (composition.structure !== 'randomize') return true;
  const die = composition.die;
  if (!die || die.faces.length !== die.sides) return false;
  if (composition.variants.length === 0) return false;
  const ids = new Set(composition.variants.map((v) => v.id));
  if (!die.faces.every((f) => ids.has(f))) return false;
  const assigned = new Set(die.faces);
  return composition.variants.every((v) => assigned.has(v.id));
}

// =============================================================================
// Resolve
// =============================================================================

export interface ResolvedPowerVariant {
  id: string;
  label: string;
  /** Variant's own description (usually absent). */
  description?: string | undefined;
  polarity: PowerVariantPolarity;
  /** Spec used for display (shared overlaid for Choice/Modify/Randomize; full power for Alternate). */
  doc: PowerDocument;
  display: PowerDisplayData;
  /**
   * Energy this variant contributes. Choice / Alternate = the published variant cost.
   * Modify = extra parts only (0 stays 0). Randomize = the face’s own energy before
   * weighting by its chance: a good face is its full cost, and a bad face is minus half
   * its basic-action energy divided by the action-type multiplier, including Reaction.
   */
  energy: number;
  /** Unrounded contribution. Breakdowns show this; chips use `energy`. */
  energyRaw: number;
  /**
   * Signed range difference against Shared, priced on an empty copy of the tab.
   * Positive when the tab is longer; negative when it refunds. 0 for Alternate,
   * Randomize, and a tab that does not change range. Not a second subtraction:
   * `energyRaw` already includes it.
   */
  rangeDelta: number;
  /** Randomize face numbers (1-based) that roll this variant. */
  faces: number[];
  duration: StructuredPowerDuration | null;
}

export interface PowerCompositionResolution {
  structure: PowerCompositionStructure;
  /** `powerCompositionHelpText(structure)` — shown beside the sheet / browse variant chips. */
  structureHelp: string;
  variants: ResolvedPowerVariant[];
  /** Shared chassis (Choice / Modify / Randomize / plain + Reverse). Null for Alternate. */
  shared: { doc: PowerDocument; display: PowerDisplayData; rawEnergy: number } | null;
  reverse: {
    doc: PowerDocument;
    display: PowerDisplayData;
    /** Rounded drawback energy, before the half and the action divisor. */
    energy: number;
    /** Unrounded drawback energy at the Reverse footprint, before the reduction. */
    rawEnergy: number;
    /** Unrounded reduction: half the drawback divided by the action-type multiplier. */
    discount: number;
    /**
     * Signed range difference against the benefit, on an empty copy of the Reverse tab.
     * Negative when the tab is shorter. Already included in `rawEnergy`.
     */
    rangeDelta: number;
    /** Normal action-type multiplier. Basic is 1. Quicker is above 1; slower is below 1. */
    actionMultiplier: number;
  } | null;
  die: PowerRandomizeDie | null;
  /** Variant the display follows (play pick, else the first variant). */
  selectedVariantId: string | null;
  /** Structure total before the Reverse discount (raw, before the final round-up). */
  structureEnergy: number;
  /** Published energy of the structure before Reverse. The 1 EN floor needs positive energy. */
  energyBeforeReverse: number;
  /** Final cast energy. 0 when nothing contributes positive energy. */
  energy: number;
  tp: number;
  tpSources: string[];
}

function stripCompositionParts(parts: PowerDocument['parts']): NonNullable<PowerDocument['parts']> {
  return (parts ?? []).filter((p) => !isPowerCompositionMechanicPart(p));
}

function hasDamage(damage: PowerDocument['damage']): boolean {
  return (damage ?? []).some((d) => d.type && d.type !== 'none' && Number(d.amount) > 0);
}

/** A Modify piece that adds parts, damage, or a mechanic override. An untouched tab does not. */
export function powerSpecHasContent(v: PowerVariantSpec): boolean {
  if (stripCompositionParts(v.parts).length > 0) return true;
  if (hasDamage(v.damage)) return true;
  if (v.range != null) return true;
  if (v.area != null) return true;
  if (v.duration != null) return true;
  if (v.actionType != null) return true;
  if (v.isReaction != null) return true;
  if (v.attackMode != null) return true;
  return false;
}

function chassisOf(doc: PowerDocument): PowerDocument {
  const rest = { ...doc };
  delete rest.composition;
  return { ...rest, parts: stripCompositionParts(doc.parts) };
}

function overlayVariant(shared: PowerDocument, v: PowerVariantSpec): PowerDocument {
  return {
    ...shared,
    description: v.description?.trim() ? v.description : shared.description,
    actionType: v.actionType ?? shared.actionType,
    isReaction: v.isReaction ?? shared.isReaction,
    range: v.range ?? shared.range,
    area: v.area ?? shared.area,
    duration: v.duration ?? shared.duration,
    damage: v.damage !== undefined ? v.damage : shared.damage,
    parts: [...(shared.parts ?? []), ...stripCompositionParts(v.parts)],
  };
}

function fullVariantDoc(name: string | undefined, v: PowerVariantSpec): PowerDocument {
  return {
    name,
    description: v.description,
    actionType: v.actionType,
    isReaction: v.isReaction,
    range: v.range,
    area: v.area,
    duration: v.duration,
    damage: v.damage,
    parts: stripCompositionParts(v.parts),
  };
}

/**
 * A creator-saved independent face stores range, area, duration, and damage,
 * including the empty values. An overlay face omits a field, or stores only the
 * empty default, for anything it inherited from Shared.
 */
export function isIndependentRandomizeFace(v: PowerVariantSpec): boolean {
  return v.range != null && v.area != null && v.duration != null && v.damage != null;
}

function legacyFaceForces(v: PowerVariant, field: PowerVariantOverrideField): boolean {
  return (v.overrides ?? []).includes(field);
}

/**
 * Old Randomize saves stored Shared plus a face delta. On read, that delta
 * becomes a full face: Shared’s range, area, duration, damage, and parts, plus
 * the face’s own parts. An empty default (1 space, no area, Instant, no damage)
 * is the overlay’s “use Shared”, not a chosen melee footprint. A face that
 * already stores all four fields is unchanged, so a real independent face is
 * not repriced from Shared.
 */
export function expandLegacyRandomizeFace(shared: PowerVariantSpec, v: PowerVariant): PowerVariant {
  if (isIndependentRandomizeFace(v)) return v;
  const rangeStepsSet = (v.range?.steps ?? 0) > 0;
  const areaSet = v.area != null && v.area.type !== 'none';
  const durationSet = v.duration != null && v.duration.type !== 'instant';
  const damageSet = Array.isArray(v.damage) && v.damage.length > 0;
  return {
    ...v,
    range: legacyFaceForces(v, 'range') || rangeStepsSet ? v.range : (shared.range ?? v.range),
    area: legacyFaceForces(v, 'area') || areaSet ? v.area : (shared.area ?? v.area),
    duration:
      legacyFaceForces(v, 'duration') || durationSet ? v.duration : (shared.duration ?? v.duration),
    damage: legacyFaceForces(v, 'damage') || damageSet ? v.damage : (shared.damage ?? v.damage),
    parts: dedupeSavedParts([
      ...stripCompositionParts(shared.parts),
      ...stripCompositionParts(v.parts),
    ]),
  };
}

/**
 * Randomize face. Own range, area, duration, damage, and parts.
 * Action type is Shared’s, including Reaction. Shared parts are not copied on.
 */
function randomizeFaceDoc(
  name: string | undefined,
  shared: PowerDocument,
  v: PowerVariantSpec,
): PowerDocument {
  return {
    name,
    description: v.description,
    actionType: shared.actionType,
    isReaction: !!shared.isReaction,
    range: v.range,
    area: v.area,
    duration: v.duration,
    damage: v.damage,
    parts: stripCompositionParts(v.parts),
  };
}

/** Bad Randomize face priced as a basic action on that face’s own footprint. */
function randomizeBadFootprint(name: string | undefined, v: PowerVariantSpec): PowerDocument {
  return {
    name,
    actionType: 'basic',
    isReaction: false,
    range: v.range,
    area: v.area,
    duration: v.duration,
    damage: v.damage,
    parts: stripCompositionParts(v.parts),
  };
}

/** A spec priced on its own (Reverse) as a basic action. */
function ownSpecDoc(
  name: string | undefined,
  v: PowerVariantSpec,
  inheritedDuration: PowerDocument['duration'],
): PowerDocument {
  return {
    name,
    actionType: 'basic',
    isReaction: false,
    range: v.range,
    area: v.area,
    duration: v.duration ?? inheritedDuration,
    damage: v.damage,
    parts: stripCompositionParts(v.parts),
  };
}

function rawEnergyOf(doc: PowerDocument, partsDb: PowerPart[]): number {
  return calculatePowerCosts(buildPowerPartsPayloadForCost(doc, partsDb), partsDb).energyRaw;
}

/** Ceil a non-negative piece contribution for display; 0 extra stays 0 (the 1 EN floor is on the total). */
function publishContribution(raw: number): number {
  return Math.max(0, Math.ceil(raw - 1e-9));
}

/** Signed contribution. Magnitude rounds up so a small negative does not display as 0. */
function publishSigned(raw: number): number {
  if (Math.abs(raw) < 1e-9) return 0;
  const sign = raw < 0 ? -1 : 1;
  return sign * Math.ceil(Math.abs(raw) - 1e-9);
}

/** Unrounded intermediate for breakdowns and row notes. At most 2 decimal places. */
export function formatEnergyIntermediate(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  if (Math.abs(rounded) < 0.001) return '0';
  const text = String(Math.abs(rounded));
  return rounded < 0 ? `−${text}` : text;
}

/**
 * Action-type multipliers come from Codex in 0.125 steps (long is 0.875).
 * Energy intermediates stay at 2 decimals; this keeps the multiplier exact.
 */
function formatActionMultiplier(value: number): string {
  const rounded = Math.round(value * 1000) / 1000;
  if (Math.abs(rounded) < 0.0005) return '0';
  return String(rounded);
}

function rangeSteps(range: PowerDocument['range']): number {
  return range?.steps ?? 0;
}

/**
 * Action-type multiplier from the codex parts (quick / free / long, and Reaction).
 * Basic with no Reaction, or a missing part, is 1. Reaction multiplies in with the action.
 * The percentage product is `analyzePowerEnergy` — the same part-cost formula as every other energy.
 */
function actionTypeEnergyMultiplier(
  actionType: string | undefined,
  isReaction: boolean,
  partsDb: PowerPart[],
): number {
  const type = actionType && actionType.length > 0 ? actionType : 'basic';
  if (type === 'basic' && !isReaction) return 1;
  const rows = buildMechanicParts({
    creatorType: 'power',
    partsDb,
    action: { type, isReaction },
  });
  const multiplier = analyzePowerEnergy(rows, partsDb).percAll;
  return multiplier > 1e-9 ? multiplier : 1;
}

/**
 * Drawback reduction. Half the basic-footprint drawback, divided by the normal
 * action-type multiplier. Basic stays 1×. A quicker action (multiplier > 1)
 * shrinks the reduction; a slower action (multiplier < 1) grows it.
 * Kadin confirmed this inverse on Oct 6: taking longer to harm yourself refunds
 * more energy. This division is the one line that sets that direction.
 */
export function drawbackReductionForAction(
  drawbackEnergy: number,
  actionTypeMultiplier: number,
): number {
  const multiplier = actionTypeMultiplier > 1e-9 ? actionTypeMultiplier : 1;
  return (DRAWBACK_WEIGHT * drawbackEnergy) / multiplier;
}

/** Action stays on Shared. An explicit area, including none, replaces Shared’s area. */
function beneficialFootprint(shared: PowerDocument, spec: PowerVariantSpec): PowerDocument {
  return {
    name: shared.name,
    actionType: shared.actionType,
    isReaction: !!shared.isReaction,
    range: spec.range ?? shared.range,
    area: spec.area != null ? spec.area : shared.area,
    duration: spec.duration ?? shared.duration,
    parts: [],
    damage: [],
  };
}

/**
 * Range difference against Shared, priced on an empty copy of the tab so Shared’s
 * parts are not priced again. Longer range is positive (the extra only). Shorter
 * range is the same difference, negative. Equal range is 0.
 */
function rangeCostDelta(shared: PowerDocument, foot: PowerDocument, partsDb: PowerPart[]): number {
  if (rangeSteps(foot.range) === rangeSteps(shared.range)) return 0;
  const atTab = rawEnergyOf({ ...foot, parts: [], damage: [] }, partsDb);
  const atShared = rawEnergyOf({ ...foot, parts: [], damage: [], range: shared.range }, partsDb);
  return atTab - atShared;
}

/**
 * A tab's added cost does not go below 0. Not a Kadin ruling — see DECISIONS
 * pending notes. The range refund itself stays on `rangeDelta` so the breakdown
 * can still show it.
 */
function clampTabContribution(raw: number): number {
  return raw > 0 ? raw : 0;
}

/**
 * Modify piece or Choice option: own parts and damage at the tab’s range, area,
 * and duration. Shared’s action, range, and area are not billed again. A longer
 * range adds only that extra, once. A shorter range subtracts the same difference.
 * An empty tab adds nothing, including no range refund.
 */
function beneficialTabExtra(
  shared: PowerDocument,
  spec: PowerVariantSpec,
  partsDb: PowerPart[],
): { energyRaw: number; rangeDelta: number } {
  const pieceParts = stripCompositionParts(spec.parts);
  const pieceDamage = hasDamage(spec.damage) ? (spec.damage ?? []) : [];
  if (pieceParts.length === 0 && pieceDamage.length === 0) return { energyRaw: 0, rangeDelta: 0 };
  const foot = beneficialFootprint(shared, spec);
  const partsEnergy =
    rawEnergyOf({ ...foot, parts: pieceParts, damage: pieceDamage }, partsDb) -
    rawEnergyOf(foot, partsDb);
  const rangeDelta = rangeCostDelta(shared, foot, partsDb);
  return { energyRaw: clampTabContribution(partsEnergy + rangeDelta), rangeDelta };
}

/** Reverse drawback at the tab’s footprint, as a basic action, before the reduction. */
function reverseDrawbackEnergy(
  shared: PowerDocument,
  spec: PowerVariantSpec,
  partsDb: PowerPart[],
): { rawEnergy: number; rangeDelta: number } {
  const pieceParts = stripCompositionParts(spec.parts);
  const pieceDamage = hasDamage(spec.damage) ? (spec.damage ?? []) : [];
  if (pieceParts.length === 0 && pieceDamage.length === 0) return { rawEnergy: 0, rangeDelta: 0 };
  const foot: PowerDocument = {
    name: shared.name,
    actionType: 'basic',
    isReaction: false,
    range: spec.range ?? shared.range,
    area: spec.area != null ? spec.area : shared.area,
    duration: spec.duration ?? shared.duration,
    parts: [],
    damage: [],
  };
  const partsEnergy =
    rawEnergyOf({ ...foot, parts: pieceParts, damage: pieceDamage }, partsDb) -
    rawEnergyOf(foot, partsDb);
  const rangeDelta = rangeCostDelta(shared, foot, partsDb);
  return { rawEnergy: clampTabContribution(partsEnergy + rangeDelta), rangeDelta };
}

function structuredDurationOf(doc: PowerDocument): StructuredPowerDuration | null {
  return deriveStructuredDuration(
    doc.parts,
    doc.duration?.type ? { type: doc.duration.type, value: doc.duration.value ?? 1 } : undefined,
  );
}

type ProficiencyPart = NonNullable<CharacterPower['parts']>[number] & object;

/** Payload rows of one spec; each damage row carries only its own damage type. */
function proficiencyPartsFor(doc: PowerDocument, partsDb: PowerPart[]): ProficiencyPart[] {
  const payload = buildPowerPartsPayloadForCost(doc, partsDb);
  const validDamages = (doc.damage ?? []).filter(
    (d) => d.type && d.type !== 'none' && Number(d.amount) > 0,
  );
  let cursor = 0;
  return payload.map((pl) => {
    const name = pl.name ?? pl.part?.name ?? '';
    const isDamageRow =
      POWER_CALC_SECTION_BY_NAME[name] === 'damage' && name !== 'Power Split Damage Dice';
    const dmg = isDamageRow ? validDamages[cursor++] : undefined;
    const id = pl.id ?? pl.part?.id;
    return {
      id: id != null ? String(id) : undefined,
      name,
      op_1_lvl: pl.op_1_lvl ?? 0,
      op_2_lvl: pl.op_2_lvl ?? 0,
      op_3_lvl: pl.op_3_lvl ?? 0,
      damageType: dmg?.type ?? null,
    };
  });
}

function computeCompositionTp(
  docs: PowerDocument[],
  partsDb: PowerPart[],
): { tp: number; tpSources: string[] } {
  const required = buildRequiredProficiencies({
    powers: [
      {
        id: 'composition-tp',
        name: '',
        parts: docs.flatMap((d) => proficiencyPartsFor(d, partsDb)),
      },
    ],
    techniques: [],
    weapons: [],
    armor: [],
    powerPartsDb: partsDb,
  });
  let tp = 0;
  const tpSources: string[] = [];
  for (const prof of required) {
    const partTp = calculateProficiencyTP(prof);
    if (partTp <= 0) continue;
    tp += partTp;
    let src = `${partTp} TP: ${prof.name}`;
    if (prof.damageType) src += ` (${prof.damageType})`;
    if ((prof.op1Level ?? 0) > 0) src += ` (Opt1 ${prof.op1Level})`;
    if ((prof.op2Level ?? 0) > 0) src += ` (Opt2 ${prof.op2Level})`;
    if ((prof.op3Level ?? 0) > 0) src += ` (Opt3 ${prof.op3Level})`;
    tpSources.push(src);
  }
  return { tp, tpSources };
}

/**
 * Resolve a composed power. Returns null for a normal power (no `composition`).
 * `selectedVariantId` only changes Alternate energy and which variant the display follows.
 */
export function resolvePowerComposition(
  powerDoc: PowerDocument,
  partsDb: PowerPart[],
  options?: DerivePowerDisplayOptions,
): PowerCompositionResolution | null {
  const composition = normalizePowerComposition(powerDoc.composition);
  if (!composition) return null;

  const { structure } = composition;
  const name = powerDoc.name;
  const chassis = chassisOf(powerDoc);
  const isAlternate = structure === 'alternate';
  const sharedRaw = isAlternate ? 0 : rawEnergyOf(chassis, partsDb);
  const shared = isAlternate
    ? null
    : { doc: chassis, display: derivePlainPowerDisplay(chassis, partsDb), rawEnergy: sharedRaw };

  const facesByVariant = new Map<string, number[]>();
  composition.die?.faces.forEach((variantId, i) => {
    if (!variantId) return;
    const list = facesByVariant.get(variantId) ?? [];
    list.push(i + 1);
    facesByVariant.set(variantId, list);
  });

  const actionMultiplier = actionTypeEnergyMultiplier(
    chassis.actionType,
    !!chassis.isReaction,
    partsDb,
  );
  const variants: ResolvedPowerVariant[] = composition.variants.map((raw) => {
    const v = structure === 'randomize' ? expandLegacyRandomizeFace(chassis, raw) : raw;
    const doc =
      structure === 'randomize'
        ? randomizeFaceDoc(name, chassis, v)
        : isAlternate
          ? fullVariantDoc(name, v)
          : overlayVariant(chassis, v);
    const display = derivePlainPowerDisplay(doc, partsDb);
    const tabExtra =
      structure === 'modify' || structure === 'choice'
        ? beneficialTabExtra(chassis, v, partsDb)
        : null;
    const energyRaw = tabExtra
      ? tabExtra.energyRaw
      : structure === 'randomize' && v.polarity === 'negative'
        ? -drawbackReductionForAction(
            rawEnergyOf(randomizeBadFootprint(name, v), partsDb),
            actionMultiplier,
          )
        : structure === 'randomize'
          ? rawEnergyOf(doc, partsDb)
          : display.energy;
    const rangeDelta = tabExtra?.rangeDelta ?? 0;
    const energy =
      structure === 'choice'
        ? finalizePowerEnergy(sharedRaw + energyRaw)
        : structure === 'modify'
          ? publishContribution(energyRaw)
          : structure === 'randomize'
            ? publishSigned(energyRaw)
            : display.energy;
    return {
      id: v.id,
      label: v.label,
      ...(v.description?.trim() ? { description: v.description.trim() } : {}),
      polarity: v.polarity === 'negative' ? 'negative' : 'positive',
      doc,
      display,
      energy,
      energyRaw,
      rangeDelta,
      faces: facesByVariant.get(v.id) ?? [],
      duration: structuredDurationOf(doc),
    };
  });

  const requested = options?.selectedVariantId;
  const requestedMatch = requested ? (variants.find((v) => v.id === requested) ?? null) : null;
  const selected = requestedMatch ?? (structure === 'randomize' ? null : (variants[0] ?? null));

  let structureEnergy: number;
  switch (structure) {
    case 'choice': {
      const extras = variants.map((v) => v.energyRaw);
      structureEnergy = sharedRaw + (extras.length > 0 ? Math.max(...extras) : 0);
      break;
    }
    case 'modify':
      structureEnergy = sharedRaw + variants.reduce((sum, v) => sum + v.energyRaw, 0);
      break;
    case 'alternate':
      structureEnergy = selected
        ? rawEnergyOf(selected.doc, partsDb)
        : rawEnergyOf(chassis, partsDb);
      break;
    case 'randomize': {
      const faces = composition.die?.faces ?? [];
      const n = faces.length;
      structureEnergy = faces.reduce((sum, id) => {
        const v = variants.find((x) => x.id === id);
        if (!v || n === 0) return sum;
        return sum + v.energyRaw / n;
      }, 0);
      break;
    }
    default:
      structureEnergy = sharedRaw;
  }

  let reverse: PowerCompositionResolution['reverse'] = null;
  if (composition.reverse) {
    const benefit = isAlternate ? (selected?.doc ?? chassis) : chassis;
    const benefitMultiplier = isAlternate
      ? actionTypeEnergyMultiplier(benefit.actionType, !!benefit.isReaction, partsDb)
      : actionMultiplier;
    const doc = ownSpecDoc(name, composition.reverse, benefit.duration);
    const priced: PowerDocument = {
      ...doc,
      range: composition.reverse.range ?? benefit.range,
      area: composition.reverse.area != null ? composition.reverse.area : benefit.area,
    };
    const display = derivePlainPowerDisplay(priced, partsDb);
    const drawback = reverseDrawbackEnergy(benefit, composition.reverse, partsDb);
    reverse = {
      doc: priced,
      display,
      energy: Math.max(0, Math.ceil(drawback.rawEnergy - 1e-9)),
      rawEnergy: drawback.rawEnergy,
      discount: drawbackReductionForAction(drawback.rawEnergy, benefitMultiplier),
      actionMultiplier: benefitMultiplier,
      rangeDelta: drawback.rangeDelta,
    };
  }

  const benefitDocs =
    structure === 'randomize'
      ? variants.filter((v) => v.polarity !== 'negative' && v.faces.length > 0).map((v) => v.doc)
      : [
          ...(shared ? [shared.doc] : []),
          ...variants.filter((v) => v.polarity !== 'negative').map((v) => v.doc),
        ];
  const hasPositiveEnergy =
    structureEnergy > 1e-9 ||
    benefitDocs.some(
      (doc) =>
        calculatePowerCosts(buildPowerPartsPayloadForCost(doc, partsDb), partsDb).hasPositiveEnergy,
    );
  const energyBeforeReverse = finalizePowerEnergy(structureEnergy, hasPositiveEnergy);
  const energy = finalizePowerEnergy(structureEnergy - (reverse?.discount ?? 0), hasPositiveEnergy);

  const tpDocs =
    structure === 'randomize'
      ? [...variants.map((v) => v.doc), ...(reverse ? [reverse.doc] : [])]
      : [
          ...(shared ? [shared.doc] : []),
          ...variants.map((v) => v.doc),
          ...(reverse ? [reverse.doc] : []),
        ];
  const { tp, tpSources } = computeCompositionTp(tpDocs, partsDb);

  return {
    structure,
    structureHelp: powerCompositionHelpText(structure),
    variants,
    shared,
    reverse,
    die: composition.die ?? null,
    selectedVariantId: selected?.id ?? null,
    structureEnergy,
    energyBeforeReverse,
    energy,
    tp,
    tpSources,
  };
}

// =============================================================================
// Display helpers
// =============================================================================

function uniqueJoin(values: string[], sep: string): string {
  return [...new Set(values.filter((v) => v && v !== '-'))].join(sep);
}

/** Selected variant, or null when the structure has no pick (Modify / plain + Reverse / unrolled Randomize). */
export function selectedResolvedVariant(
  res: PowerCompositionResolution,
): ResolvedPowerVariant | null {
  if (res.structure === 'modify' || res.structure === 'none') return null;
  const picked = res.variants.find((v) => v.id === res.selectedVariantId) ?? null;
  if (picked) return picked;
  if (res.structure === 'randomize') return null;
  return res.variants[0] ?? null;
}

/** Every saved part on the power (shared, each variant, Reverse) — categories, proficiency. */
export function composedPowerSavedParts(
  res: PowerCompositionResolution,
): NonNullable<PowerDocument['parts']> {
  return dedupeSavedParts([
    ...(res.shared?.doc.parts ?? []),
    ...res.variants.flatMap((v) => v.doc.parts ?? []),
    ...(res.reverse?.doc.parts ?? []),
  ]);
}

/**
 * Parts the character must be proficient in (feed as `CharacterPower.parts` to
 * `buildRequiredProficiencies`). Choice, Modify, and Alternate: shared + every
 * variant + Reverse. Randomize: every face + Reverse (Shared defaults are not
 * a cast). The chip does not change this. Requirements match the power's
 * training-point total: what the power can do, including every Alternate version.
 */
export function composedPowerProficiencyParts(
  res: PowerCompositionResolution,
  partsDb: PowerPart[],
): ProficiencyPart[] {
  const docs =
    res.structure === 'randomize'
      ? [...res.variants.map((v) => v.doc), res.reverse?.doc]
      : [res.shared?.doc, ...res.variants.map((v) => v.doc), res.reverse?.doc];
  return docs
    .filter((d): d is PowerDocument => !!d)
    .flatMap((d) => proficiencyPartsFor(d, partsDb));
}

/** Damage rows the row's damage button should roll. */
export function composedPowerDamage(res: PowerCompositionResolution): PowerDocument['damage'] {
  const sharedRef = res.shared?.doc.damage;
  const sharedRows = sharedRef ?? [];
  if (res.structure === 'modify') {
    const out: NonNullable<PowerDocument['damage']> = [...sharedRows];
    for (const v of res.variants) {
      const d = v.doc.damage;
      if (!hasDamage(d) || (sharedRef && d === sharedRef)) continue;
      out.push(...(d ?? []));
    }
    return out;
  }
  if (res.structure === 'randomize') {
    return selectedResolvedVariant(res)?.doc.damage ?? [];
  }
  const picked = selectedResolvedVariant(res);
  if (picked) return picked.doc.damage ?? [];
  return sharedRows;
}

/** Empty when the action is basic (multiplier 1). */
export function reverseActionDivisorNote(actionMultiplier: number): string {
  if (Math.abs(actionMultiplier - 1) <= 1e-9) return '';
  return `, divided by the action multiplier ${formatActionMultiplier(actionMultiplier)}`;
}

/** How much of the Reverse discount actually changes the published energy. */
export function reverseDiscountApplied(res: PowerCompositionResolution): {
  applied: number;
  limitedByFloor: boolean;
} {
  if (!res.reverse) return { applied: 0, limitedByFloor: false };
  const applied = Math.max(0, res.energyBeforeReverse - res.energy);
  const rawAfter = res.structureEnergy - res.reverse.discount;
  const limitedByFloor =
    res.energy === 1 && rawAfter < 1 - 1e-9 && applied + 1e-6 < res.reverse.discount;
  return { applied, limitedByFloor };
}

/** Creator / sheet breakdown lines for a composed power's energy. */
function rangeRefundLine(label: string, rangeDelta: number): string | null {
  if (rangeDelta >= -1e-9) return null;
  return `${label} range refund: ${formatEnergyIntermediate(rangeDelta)} EN`;
}

export function powerCompositionEnergyLines(res: PowerCompositionResolution): string[] {
  const lines: string[] = [];
  for (const v of res.variants) {
    if (res.structure === 'randomize') {
      const raw = v.energyRaw;
      const shown =
        raw < 0 || (Math.abs(raw) < 1e-9 && v.polarity === 'negative')
          ? `−${formatEnergyIntermediate(Math.abs(raw))}`
          : `+${formatEnergyIntermediate(raw)}`;
      const faces = res.die?.sides ?? Math.max(1, v.faces.length);
      lines.push(`${v.label}: ${shown} EN × ${v.faces.length}/${faces}`);
      continue;
    }
    if (res.structure === 'modify' && Math.abs(v.energyRaw) < 1e-9) {
      lines.push(`${v.label}: nothing added`);
    } else if (res.structure === 'modify') {
      lines.push(`${v.label}: extra ${formatEnergyIntermediate(v.energyRaw)} EN`);
    } else if (res.structure === 'choice') {
      lines.push(`${v.label}: ${formatEnergyIntermediate(v.energyRaw)} EN`);
    } else {
      lines.push(`${v.label}: ${v.energy} EN`);
    }
    const refund = rangeRefundLine(v.label, v.rangeDelta);
    if (refund) lines.push(refund);
  }
  if (res.structure === 'choice' && res.shared) {
    lines.unshift(`Shared: ${formatEnergyIntermediate(res.shared.rawEnergy)} EN`);
  }
  if (res.structure === 'randomize') {
    lines.unshift('Shared: not priced');
  }
  const rule: Partial<Record<PowerCompositionResolution['structure'], string>> = {
    choice: 'Choice pays the most expensive portion',
    modify: 'Shared is paid once; each piece adds its parts at that piece’s footprint',
    alternate: 'Alternate pays the selected variant',
    randomize: 'Each face at its own cost, weighted by its chance. Shared adds no energy',
  };
  const ruleText = rule[res.structure];
  if (ruleText) {
    lines.push(`${ruleText}: ${formatEnergyIntermediate(res.structureEnergy)} EN`);
  }
  if (res.reverse) {
    const refund = rangeRefundLine('Reverse', res.reverse.rangeDelta);
    if (refund) lines.push(refund);
    const { applied, limitedByFloor } = reverseDiscountApplied(res);
    const drawback = formatEnergyIntermediate(res.reverse.rawEnergy);
    const reduction = formatEnergyIntermediate(res.reverse.discount);
    const actionNote = reverseActionDivisorNote(res.reverse.actionMultiplier);
    lines.push(
      limitedByFloor
        ? `Reverse drawback ${drawback} EN → −${formatEnergyIntermediate(applied)} EN (1 EN floor; the reduction is ${reduction} EN${actionNote})`
        : `Reverse drawback ${drawback} EN → −${reduction} EN${actionNote}`,
    );
  }
  const totalLabel =
    res.structure === 'none'
      ? 'Total'
      : `${POWER_COMPOSITION_STRUCTURE_LABELS[res.structure]} total`;
  const totalStat = formatEnergyStat(res.energy);
  lines.push(`${totalLabel}: ${totalStat === '—' ? '—' : `${formatCost(res.energy)} EN`}`);
  return lines;
}

/** Modify duration column: pieces joined (e.g. "2 Rounds / 1 Minute"). */
export function composedPowerDurationLabel(res: PowerCompositionResolution): string {
  if (res.structure === 'modify' && res.variants.length > 0) {
    return uniqueJoin(
      res.variants.map((v) => v.display.duration),
      ' / ',
    );
  }
  if (res.structure === 'randomize' && !selectedResolvedVariant(res)) {
    return uniqueJoin(
      res.variants.map((v) => v.display.duration),
      ' / ',
    );
  }
  return (selectedResolvedVariant(res)?.display ?? res.shared?.display)?.duration ?? '';
}

export function deriveComposedPowerDisplay(
  powerDoc: PowerDocument,
  partsDb: PowerPart[],
  options?: DerivePowerDisplayOptions,
): PowerDisplayData | null {
  const res = resolvePowerComposition(powerDoc, partsDb, options);
  if (!res) return null;
  const picked = selectedResolvedVariant(res);
  const sharedDisplay = res.shared?.display;
  let base = picked?.display ?? (res.structure === 'randomize' ? undefined : sharedDisplay);
  base = base ?? res.variants[0]?.display;
  if (!base) return null;
  if (res.structure === 'randomize' && !picked && sharedDisplay) {
    base = {
      ...sharedDisplay,
      range: uniqueJoin(
        res.variants.map((v) => v.display.range),
        ' / ',
      ),
      area: uniqueJoin(
        res.variants.map((v) => v.display.area),
        ' / ',
      ),
      partChips: [],
    };
  }

  const chipDisplays = [
    ...(res.shared && res.structure !== 'randomize' ? [res.shared.display] : []),
    ...res.variants.map((v) => v.display),
    ...(res.reverse ? [res.reverse.display] : []),
  ];
  const seen = new Set<string>();
  const partChips: PartChipData[] = [];
  for (const d of chipDisplays) {
    for (const chip of d.partChips) {
      if (seen.has(chip.text)) continue;
      seen.add(chip.text);
      partChips.push(chip);
    }
  }

  return {
    ...base,
    name: powerDoc.name || '',
    description: powerDoc.description || '',
    duration: composedPowerDurationLabel(res) || base.duration,
    energy: res.energy,
    tp: res.tp,
    tpSources: res.tpSources,
    partChips,
    composition: res,
  };
}

/** Browse copy: "Choice · 3 variants" (library, add-modal, creature). */
export function formatPowerCompositionSummary(res: PowerCompositionResolution): string {
  const label = POWER_COMPOSITION_STRUCTURE_LABELS[res.structure];
  const parts: string[] = [];
  if (res.structure !== 'none') {
    const names = res.variants.map((v) => v.label).join(', ');
    parts.push(names ? `${label}: ${names}` : label);
  }
  if (res.die) parts.push(`1d${res.die.sides}`);
  if (res.reverse) {
    const { applied, limitedByFloor } = reverseDiscountApplied(res);
    const shown = limitedByFloor ? applied : res.reverse.discount;
    parts.push(`Reverse −${formatEnergyIntermediate(shown)} EN`);
  }
  return parts.join(' · ');
}
