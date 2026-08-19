/**
 * Shared empowered-technique display helpers — nested power + technique part chips.
 * Used by Library (Realms + My), load/add USM, and advanced creator empowered tab.
 */

import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import { derivePowerDisplay, type PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay, type TechniqueDocument } from '@/lib/calculators/technique-calc';
import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import { partsProficienciesSection } from '@/lib/chip/list-row-metadata';
import type { MetadataDetailSection } from '@/lib/chip/list-row-metadata';
import { dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';

type EmpoweredRecord = Record<string, unknown>;

function asRecord(value: unknown): EmpoweredRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as EmpoweredRecord)
    : {};
}

function collectEmpoweredPowerSavedParts(power: EmpoweredRecord): PowerDocument['parts'] {
  const parts: unknown[] = [];
  if (Array.isArray(power.parts)) parts.push(...power.parts);
  if (Array.isArray(power.mechanics)) parts.push(...power.mechanics);
  if (power.addWeaponPowerPart) parts.push(power.addWeaponPowerPart);
  return dedupeSavedParts(parts as NonNullable<PowerDocument['parts']>);
}

function collectEmpoweredTechniqueSavedParts(
  raw: EmpoweredRecord,
  technique: EmpoweredRecord,
): TechniqueDocument['parts'] {
  const parts: unknown[] = [];
  if (Array.isArray(technique.parts)) parts.push(...technique.parts);
  if (Array.isArray(technique.autoMechanics)) parts.push(...technique.autoMechanics);
  // Legacy rows may still store technique parts at the top level.
  if (Array.isArray(raw.parts)) parts.push(...raw.parts);
  return dedupeSavedParts(parts as NonNullable<TechniqueDocument['parts']>);
}

function resolveEmpoweredTechniqueDamage(
  raw: EmpoweredRecord,
  technique: EmpoweredRecord,
): TechniqueDocument['damage'] {
  const additional = Array.isArray(technique.additionalDamage)
    ? technique.additionalDamage[0]
    : undefined;
  if (additional && typeof additional === 'object') {
    return additional as TechniqueDocument['damage'];
  }
  const topDamage = raw.damage;
  if (Array.isArray(topDamage) && topDamage[0]) {
    return topDamage[0] as TechniqueDocument['damage'];
  }
  if (topDamage && typeof topDamage === 'object' && !Array.isArray(topDamage)) {
    return topDamage as TechniqueDocument['damage'];
  }
  return undefined;
}

/** Build a PowerDocument from an empowered technique's nested `power` payload. */
export function buildEmpoweredPowerDocument(item: unknown): PowerDocument {
  const raw = asRecord(item);
  const power = asRecord(raw.power);
  return {
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    parts: collectEmpoweredPowerSavedParts(power),
    actionType: String(raw.actionType ?? ''),
    isReaction: raw.isReaction === true,
    damage: Array.isArray(power.damage) ? (power.damage as PowerDocument['damage']) : undefined,
    range: power.range as PowerDocument['range'],
    area: power.area as PowerDocument['area'],
    duration: (power.duration ?? raw.duration) as PowerDocument['duration'],
  };
}

/** Build a TechniqueDocument from an empowered technique's nested `technique` payload. */
export function buildEmpoweredTechniqueDocument(item: unknown): TechniqueDocument {
  const raw = asRecord(item);
  const technique = asRecord(raw.technique);
  return {
    name: String(raw.name ?? ''),
    description: String(raw.description ?? ''),
    parts: collectEmpoweredTechniqueSavedParts(raw, technique),
    actionType: String(raw.actionType ?? ''),
    isReaction: raw.isReaction === true,
    attackMode: raw.attackMode as TechniqueDocument['attackMode'],
    weaponName: typeof raw.weaponName === 'string' ? raw.weaponName : undefined,
    weapon: raw.weapon as TechniqueDocument['weapon'],
    damage: resolveEmpoweredTechniqueDamage(raw, technique),
  };
}

/** Power + technique part chips for empowered library rows and USM detail sections. */
export function deriveEmpoweredTechniquePartChips(
  item: unknown,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
  opts?: { stripOptionSuffix?: boolean },
): ChipData[] {
  const powerDisplay = derivePowerDisplay(buildEmpoweredPowerDocument(item), powerPartsDb);
  const techniqueDisplay = deriveTechniqueDisplay(
    buildEmpoweredTechniqueDocument(item),
    techniquePartsDb,
  );
  const powerChips = partChipsFromDisplay(powerDisplay.partChips, opts);
  const techniqueChips = partChipsFromDisplay(techniqueDisplay.partChips, opts);
  return [...powerChips, ...techniqueChips];
}

/** Collapsed Parts & Proficiencies section for empowered rows (power + technique chips). */
export function empoweredTechniquePartsSection(
  item: unknown,
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
  opts?: { stripOptionSuffix?: boolean },
): MetadataDetailSection | undefined {
  const chips = deriveEmpoweredTechniquePartChips(item, powerPartsDb, techniquePartsDb, opts);
  return partsProficienciesSection(chips, 'parts');
}
