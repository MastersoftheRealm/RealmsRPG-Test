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
  derivePlainPowerDisplay,
  deriveStructuredDuration,
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
}

export type PowerReverseSpec = PowerVariantSpec;

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

/** Codex part that documents each structure (Alternate has none). */
const POWER_COMPOSITION_CODEX_PART_IDS: Partial<Record<PowerCompositionStructure, number>> = {
  choice: PART_IDS.POWER_CHOICE,
  modify: PART_IDS.POWER_SPLIT_GROUPS,
  randomize: PART_IDS.POWER_RANDOMIZE,
};

const POWER_ALTERNATE_HELP =
  'Each variant is a complete power (action, range, area, duration, damage, and parts). When you use the power you pick one variant and pay that variant’s energy, which may cost less, the same, or more than the others.';

/** Rule text for a structure or the Reverse add-on (codex part description; Alternate has none). */
export function powerCompositionHelpText(
  key: PowerCompositionStructure | 'reverse',
  partsDb: PowerPart[],
): string {
  if (key === 'none') return '';
  if (key === 'alternate') return POWER_ALTERNATE_HELP;
  const id =
    key === 'reverse' ? PART_IDS.POWER_REVERSE_EFFECTS : POWER_COMPOSITION_CODEX_PART_IDS[key];
  if (id == null) return '';
  return findByIdOrName(partsDb, { id })?.description?.trim() ?? '';
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
      : raw.variants.filter(isRecord).map((v, i) => ({
          ...pickSpec(structure === 'modify' ? { ...v, description: undefined } : v),
          id: typeof v.id === 'string' && v.id.trim() ? v.id : `v${i + 1}`,
          label:
            typeof v.label === 'string' && v.label.trim() ? v.label.trim() : `Variant ${i + 1}`,
          ...(v.polarity === 'negative' || v.polarity === 'positive'
            ? { polarity: v.polarity as PowerVariantPolarity }
            : {}),
        }));
  const reverse = isRecord(raw.reverse) ? pickSpec(raw.reverse) : undefined;
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

/** True when every Randomize face names an existing variant (creator save gate). */
export function isRandomizeDieComplete(composition: PowerComposition): boolean {
  if (composition.structure !== 'randomize') return true;
  const die = composition.die;
  if (!die || die.faces.length !== die.sides) return false;
  const ids = new Set(composition.variants.map((v) => v.id));
  return die.faces.every((f) => ids.has(f));
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
   * Energy this variant contributes: Choice/Modify = shared + variant, Alternate = the whole
   * variant, Randomize = the outcome's own energy (unsigned; chassis priced once).
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
  shared: { doc: PowerDocument; display: PowerDisplayData } | null;
  reverse: {
    doc: PowerDocument;
    display: PowerDisplayData;
    energy: number;
    discount: number;
  } | null;
  die: PowerRandomizeDie | null;
  /** Variant the display follows (play pick, else the first variant). */
  selectedVariantId: string | null;
  /** Structure total before the Reverse discount. */
  structureEnergy: number;
  /** Final cast energy. */
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
    damage: hasDamage(v.damage) ? v.damage : shared.damage,
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

/** A spec priced on its own (Randomize outcome, Reverse drawback) inheriting a duration. */
function ownSpecDoc(
  name: string | undefined,
  v: PowerVariantSpec,
  inheritedDuration: PowerDocument['duration'],
): PowerDocument {
  return {
    name,
    range: v.range,
    area: v.area,
    duration: v.duration ?? inheritedDuration,
    damage: v.damage,
    parts: stripCompositionParts(v.parts),
  };
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
  const shared = isAlternate
    ? null
    : { doc: chassis, display: derivePlainPowerDisplay(chassis, partsDb) };

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
      structure === 'randomize'
        ? derivePlainPowerDisplay(ownSpecDoc(name, v, chassis.duration), partsDb).energy
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
  const selected = variants.find((v) => v.id === requested) ?? variants[0] ?? null;
  const sharedEnergy = shared?.display.energy ?? 0;

  let structureEnergy: number;
  let floor = 0;
  switch (structure) {
    case 'choice':
      structureEnergy =
        variants.length > 0 ? Math.max(...variants.map((v) => v.energy)) : sharedEnergy;
      break;
    case 'modify':
      structureEnergy =
        variants.length > 0 ? variants.reduce((sum, v) => sum + v.energy, 0) : sharedEnergy;
      break;
    case 'alternate':
      structureEnergy = selected?.energy ?? derivePlainPowerDisplay(chassis, partsDb).energy;
      break;
    case 'randomize': {
      floor = 1;
      const byId = new Map(variants.map((v) => [v.id, v]));
      const faceIds = composition.die ? composition.die.faces : variants.map((v) => v.id);
      const signed = faceIds.reduce((sum, id) => {
        const v = byId.get(id);
        if (!v) return sum;
        return sum + (v.polarity === 'negative' ? -v.energy : v.energy);
      }, 0);
      structureEnergy = Math.max(1, sharedEnergy + signed);
      break;
    }
    default:
      structureEnergy = sharedEnergy;
  }

  let reverse: PowerCompositionResolution['reverse'] = null;
  if (composition.reverse) {
    const benefitDuration = isAlternate ? selected?.doc.duration : chassis.duration;
    const doc = ownSpecDoc(name, composition.reverse, benefitDuration);
    const display = derivePlainPowerDisplay(doc, partsDb);
    reverse = { doc, display, energy: display.energy, discount: display.energy * 0.5 };
  }

  const energy = Math.max(floor, Math.ceil(structureEnergy - (reverse?.discount ?? 0)));

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

/** Selected variant, or null when the structure has no pick (Modify / plain + Reverse). */
export function selectedResolvedVariant(
  res: PowerCompositionResolution,
): ResolvedPowerVariant | null {
  if (res.structure === 'modify' || res.structure === 'none') return null;
  return res.variants.find((v) => v.id === res.selectedVariantId) ?? res.variants[0] ?? null;
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
 * `buildRequiredProficiencies`). Choice / Modify / Randomize: shared + every variant + Reverse,
 * independent of the pick. Alternate: only the picked variant (+ Reverse) — that is the power in use.
 */
export function composedPowerProficiencyParts(
  res: PowerCompositionResolution,
  partsDb: PowerPart[],
): ProficiencyPart[] {
  const docs =
    res.structure === 'alternate'
      ? [selectedResolvedVariant(res)?.doc]
      : [res.shared?.doc, ...res.variants.map((v) => v.doc)];
  return [...docs, res.reverse?.doc]
    .filter((d): d is PowerDocument => !!d)
    .flatMap((d) => proficiencyPartsFor(d, partsDb));
}

/** Damage rows the row's damage button should roll. */
export function composedPowerDamage(res: PowerCompositionResolution): PowerDocument['damage'] {
  if (res.structure === 'modify') {
    return res.variants.flatMap((v) => (hasDamage(v.doc.damage) ? (v.doc.damage ?? []) : []));
  }
  const picked = selectedResolvedVariant(res);
  if (picked) return picked.doc.damage ?? [];
  return res.shared?.doc.damage ?? [];
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
  if (res.reverse) parts.push(`Reverse −${formatCost(res.reverse.discount)} EN`);
  return parts.join(' · ');
}
