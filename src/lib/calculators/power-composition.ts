/**
 * Power composition resolver (ADR-0029)
 * =====================================
 * Built-in variants replace the Choice / Split / Randomize / Reverse Effects part hacks.
 * Energy still comes from the single-chassis equation on each resolved spec; the
 * structure only combines those totals. No UI imports (ADR-0010).
 */

import type { PowerPart } from '@/hooks/codex-types';
import type { CharacterPower } from '@/types';
import { findByIdOrName, PART_IDS } from '@/lib/id-constants';
import { normalizeAttackMode, type AttackMode } from '@/lib/attack-mode';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import { formatCost } from '@/lib/game/creator-constants';
import { buildRequiredProficiencies, calculateProficiencyTP } from '@/lib/proficiencies';
import {
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
  'Each good outcome adds its extra cost times its chance of being rolled. Each bad outcome subtracts half its drawback cost times its chance. Speed premiums and slow-action discounts apply only to good outcomes. Once a power has a costed part, it always costs at least 1 EN.';

const POWER_REVERSE_FLOOR_NOTE =
  'The 1 EN floor still applies: once the power has a costed part, the discount cannot drop it below 1 EN.';

const POWER_MODIFY_HELP =
  'Shared is paid once. Each piece pays only the extra energy its own parts add, at that piece’s own duration and other stipulations; it does not buy range or area again.';

const POWER_CHOICE_HELP =
  'Portions of one power. When you use it you pick one portion. You pay Shared plus the most expensive portion.';

/** Drawback faces (and Reverse) are worth half their own energy. */
const DRAWBACK_WEIGHT = 0.5;

/** Rule text for a structure or the Reverse add-on. */
export function powerCompositionHelpText(
  key: PowerCompositionStructure | 'reverse',
  partsDb: PowerPart[],
): string {
  if (key === 'none') return '';
  if (key === 'alternate') return POWER_ALTERNATE_HELP;
  if (key === 'randomize') return POWER_RANDOMIZE_HELP;
  if (key === 'modify') return POWER_MODIFY_HELP;
  if (key === 'choice') return POWER_CHOICE_HELP;
  const id = key === 'reverse' ? PART_IDS.POWER_REVERSE_EFFECTS : undefined;
  if (id == null) return '';
  const description = findByIdOrName(partsDb, { id })?.description?.trim() ?? '';
  return description ? `${description} ${POWER_REVERSE_FLOOR_NOTE}` : POWER_REVERSE_FLOOR_NOTE;
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
   * Modify = extra parts only (0 stays 0). Randomize = the signed face term before dividing
   * by the number of faces: good faces are (face − Shared), and a cheaper face is negative;
   * a bad face is minus half its drawback.
   */
  energy: number;
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
    energy: number;
    discount: number;
  } | null;
  die: PowerRandomizeDie | null;
  /** Variant the display follows (play pick, else the first variant). */
  selectedVariantId: string | null;
  /** Structure total before the Reverse discount (raw, before the final round-up). */
  structureEnergy: number;
  /** Published energy of the structure before Reverse (floor applies only with a costed part). */
  energyBeforeReverse: number;
  /** Final cast energy. 0 when the power has no costed parts. */
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

/** A spec priced on its own (Randomize drawback face, Reverse) as a basic action. */
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

/**
 * Modify extra for one piece: own parts/damage at the piece's settings, minus Shared
 * at those same settings (so Shared range/area/parts are not billed again).
 *
 * Provisional: if the piece's range or area is larger than Shared, only the piece's
 * own parts are priced at that reach — the extra delivery itself is not billed.
 * Kadin has not confirmed this edge (ADR-0029).
 */
function modifyPieceExtra(
  shared: PowerDocument,
  v: PowerVariantSpec,
  partsDb: PowerPart[],
): number {
  const pieceParts = stripCompositionParts(v.parts);
  const pieceDamage = hasDamage(v.damage) ? (v.damage ?? []) : [];
  if (pieceParts.length === 0 && pieceDamage.length === 0) return 0;
  const settings: PowerDocument = {
    ...shared,
    actionType: v.actionType ?? shared.actionType,
    isReaction: v.isReaction ?? shared.isReaction,
    range: v.range ?? shared.range,
    area: v.area ?? shared.area,
    duration: v.duration ?? shared.duration,
  };
  const withPiece: PowerDocument = {
    ...settings,
    parts: [...(settings.parts ?? []), ...pieceParts],
    damage: [...(settings.damage ?? []), ...pieceDamage],
  };
  return rawEnergyOf(withPiece, partsDb) - rawEnergyOf(settings, partsDb);
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

  const variants: ResolvedPowerVariant[] = composition.variants.map((v) => {
    const doc = isAlternate ? fullVariantDoc(name, v) : overlayVariant(chassis, v);
    const display = derivePlainPowerDisplay(doc, partsDb);
    const energy =
      structure === 'modify'
        ? publishContribution(modifyPieceExtra(chassis, v, partsDb))
        : structure === 'randomize' && v.polarity === 'negative'
          ? publishSigned(
              -DRAWBACK_WEIGHT * rawEnergyOf(ownSpecDoc(name, v, chassis.duration), partsDb),
            )
          : structure === 'randomize'
            ? publishSigned(rawEnergyOf(overlayVariant(chassis, v), partsDb) - sharedRaw)
            : display.energy;
    return {
      id: v.id,
      label: v.label,
      ...(v.description?.trim() ? { description: v.description.trim() } : {}),
      polarity: v.polarity === 'negative' ? 'negative' : 'positive',
      doc,
      display,
      energy,
      faces: facesByVariant.get(v.id) ?? [],
      duration: structuredDurationOf(doc),
    };
  });

  const requested = options?.selectedVariantId;
  const requestedMatch = requested ? (variants.find((v) => v.id === requested) ?? null) : null;
  const selected = requestedMatch ?? (structure === 'randomize' ? null : (variants[0] ?? null));

  let structureEnergy: number;
  switch (structure) {
    case 'choice':
      structureEnergy =
        composition.variants.length > 0
          ? Math.max(
              ...composition.variants.map((v) => rawEnergyOf(overlayVariant(chassis, v), partsDb)),
            )
          : sharedRaw;
      break;
    case 'modify':
      structureEnergy =
        sharedRaw +
        composition.variants.reduce((sum, v) => sum + modifyPieceExtra(chassis, v, partsDb), 0);
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
        const v = composition.variants.find((x) => x.id === id);
        if (!v || n === 0) return sum;
        if (v.polarity === 'negative') {
          return (
            sum -
            (DRAWBACK_WEIGHT * rawEnergyOf(ownSpecDoc(name, v, chassis.duration), partsDb)) / n
          );
        }
        return sum + (rawEnergyOf(overlayVariant(chassis, v), partsDb) - sharedRaw) / n;
      }, sharedRaw);
      break;
    }
    default:
      structureEnergy = sharedRaw;
  }

  let reverse: PowerCompositionResolution['reverse'] = null;
  if (composition.reverse) {
    const benefitDuration = isAlternate ? selected?.doc.duration : chassis.duration;
    const doc = ownSpecDoc(name, composition.reverse, benefitDuration);
    const display = derivePlainPowerDisplay(doc, partsDb);
    const reverseRaw = rawEnergyOf(doc, partsDb);
    reverse = {
      doc,
      display,
      energy: display.energy,
      discount: reverseRaw * DRAWBACK_WEIGHT,
    };
  }

  const costedDocs = [
    ...(shared ? [shared.doc] : []),
    ...variants.map((v) => v.doc),
    ...(reverse ? [reverse.doc] : []),
  ];
  const hasCostedParts = costedDocs.some(
    (doc) =>
      calculatePowerCosts(buildPowerPartsPayloadForCost(doc, partsDb), partsDb).hasCostedParts,
  );
  const energyBeforeReverse = finalizePowerEnergy(structureEnergy, hasCostedParts);
  const energy = finalizePowerEnergy(structureEnergy - (reverse?.discount ?? 0), hasCostedParts);

  const tpDocs = [
    ...(shared ? [shared.doc] : []),
    ...variants.map((v) => v.doc),
    ...(reverse ? [reverse.doc] : []),
  ];
  const { tp, tpSources } = computeCompositionTp(tpDocs, partsDb);

  return {
    structure,
    structureHelp: powerCompositionHelpText(structure, partsDb),
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
 * `buildRequiredProficiencies`). Every structure: shared + every variant + Reverse.
 * The chip does not change this. Requirements match the power's training-point total:
 * what the power can do, including every Alternate version.
 */
export function composedPowerProficiencyParts(
  res: PowerCompositionResolution,
  partsDb: PowerPart[],
): ProficiencyPart[] {
  const docs = [res.shared?.doc, ...res.variants.map((v) => v.doc), res.reverse?.doc];
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
  const picked = selectedResolvedVariant(res);
  if (picked) {
    // A bad Randomize face still does Shared, then adds the drawback's own damage.
    if (res.structure === 'randomize' && picked.polarity === 'negative') {
      const own = picked.doc.damage;
      if (!own || own === sharedRef || !hasDamage(own)) return sharedRows;
      return [...sharedRows, ...own];
    }
    return picked.doc.damage ?? [];
  }
  return sharedRows;
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
export function powerCompositionEnergyLines(res: PowerCompositionResolution): string[] {
  const lines = res.variants.map((v) => {
    if (res.structure === 'randomize') {
      const shown =
        v.energy < 0 || (v.energy === 0 && v.polarity === 'negative')
          ? `−${formatCost(Math.abs(v.energy))}`
          : `+${formatCost(v.energy)}`;
      const faces = res.die?.sides ?? Math.max(1, v.faces.length);
      return `${v.label}: ${shown} EN × ${v.faces.length}/${faces}`;
    }
    if (res.structure === 'modify' && v.energy === 0) return `${v.label}: nothing added`;
    if (res.structure === 'modify') return `${v.label}: extra ${v.energy} EN`;
    return `${v.label}: ${v.energy} EN`;
  });
  if (res.structure === 'randomize' && res.shared) {
    lines.unshift(`Shared chassis: ${formatCost(res.shared.rawEnergy)} EN`);
  }
  const rule: Partial<Record<PowerCompositionResolution['structure'], string>> = {
    choice: 'Choice pays the most expensive portion',
    modify: 'Shared is paid once; each piece adds only its extra',
    alternate: 'Alternate pays the selected variant',
    randomize:
      'Shared plus each good face’s extra cost times its chance, minus half each drawback times its chance',
  };
  const ruleText = rule[res.structure];
  if (ruleText) {
    lines.push(`${ruleText}: ${formatCost(res.structureEnergy)} EN`);
  }
  if (res.reverse) {
    const { applied, limitedByFloor } = reverseDiscountApplied(res);
    lines.push(
      limitedByFloor
        ? `Reverse drawback ${formatCost(res.reverse.energy)} EN → −${formatCost(applied)} EN (1 EN floor; half the drawback is ${formatCost(res.reverse.discount)} EN)`
        : `Reverse drawback ${formatCost(res.reverse.energy)} EN → −${formatCost(applied)} EN`,
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
  const base = picked?.display ?? res.shared?.display ?? res.variants[0]?.display;
  if (!base) return null;

  const chipDisplays = [
    ...(res.shared ? [res.shared.display] : []),
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
    const { applied } = reverseDiscountApplied(res);
    parts.push(`Reverse −${formatCost(applied)} EN`);
  }
  return parts.join(' · ');
}
