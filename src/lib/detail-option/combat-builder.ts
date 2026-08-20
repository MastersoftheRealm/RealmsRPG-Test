/**
 * Library Power / Technique → DetailOptionItem for path deep-dive catalogs.
 * Combat chips come from detail-density `layout.chipFacts` (ADR-0016 / TASK-818).
 */

import { logClientError } from '@/lib/api-client';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import { glrSurfaceDetailSections } from '@/lib/chip/list-row-metadata';
import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import {
  libraryItemToPowerDocument,
  libraryItemToTechniqueDocument,
} from '@/lib/library-selectable-builders';
import {
  derivePartCategories,
  formatPartCategoriesColumn,
  powerHasDamageCategory,
  withDamageCategory,
} from '@/lib/library/power-technique-categories';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import { type DetailOptionItemModel } from './builders';

export function buildCombatLookup(
  rows: Array<LibraryPower | LibraryTechnique>,
): Map<string, LibraryPower | LibraryTechnique> {
  const map = new Map<string, LibraryPower | LibraryTechnique>();
  for (const item of rows) {
    if (item.id != null) map.set(String(item.id).toLowerCase(), item);
    if (item.name) map.set(String(item.name).toLowerCase(), item);
  }
  return map;
}

export function powerToDetailOption(
  power: LibraryPower,
  powerPartsDb: PowerPart[],
  idOverride?: string,
): DetailOptionItemModel {
  let chips: ChipData[] = [];
  try {
    const disp = derivePowerDisplay(libraryItemToPowerDocument(power), powerPartsDb);
    const categories = withDamageCategory(
      derivePartCategories(power.parts ?? [], powerPartsDb),
      powerHasDamageCategory(power.damage),
    );
    chips = glrSurfaceDetailSections('detail-option-power', {
      category: formatPartCategoriesColumn(categories),
      energy: disp.energy,
      actionType: disp.actionType,
      duration: disp.duration,
      range: disp.range,
      area: disp.area,
      damage: formatPowerDamage(power.damage),
      trainingPoints: disp.tp,
    }).flatMap((section) => section.chips);
  } catch (err) {
    logClientError(`combat-builder: power detail chips failed (${power.name ?? power.id})`, err);
  }
  return {
    id: idOverride ?? String(power.id ?? power.name ?? ''),
    name: power.name ? String(power.name) : String(idOverride ?? ''),
    description: power.description ? String(power.description) : undefined,
    chips: chips.length > 0 ? chips : undefined,
    chipsLabel: 'Details',
  };
}

export function techniqueToDetailOption(
  technique: LibraryTechnique,
  techniquePartsDb: TechniquePart[],
  idOverride?: string,
): DetailOptionItemModel {
  let chips: ChipData[] = [];
  try {
    const disp = deriveTechniqueDisplay(
      libraryItemToTechniqueDocument(technique),
      techniquePartsDb,
    );
    chips = glrSurfaceDetailSections('detail-option-technique', {
      category: formatPartCategoriesColumn(
        derivePartCategories(technique.parts ?? [], techniquePartsDb),
      ),
      energy: disp.energy,
      actionType: disp.actionType,
      damage: disp.damageStr,
      weapon: disp.weaponName,
      trainingPoints: disp.tp,
    }).flatMap((section) => section.chips);
  } catch (err) {
    logClientError(
      `combat-builder: technique detail chips failed (${technique.name ?? technique.id})`,
      err,
    );
  }
  return {
    id: idOverride ?? String(technique.id ?? technique.name ?? ''),
    name: technique.name ? String(technique.name) : String(idOverride ?? ''),
    description: technique.description ? String(technique.description) : undefined,
    chips: chips.length > 0 ? chips : undefined,
    chipsLabel: 'Details',
  };
}

/** Resolve a path ref against a lookup; omit unresolved (no phantom id rows). */
export function resolveCombatDetailOption(
  refId: string,
  lookup: Map<string, LibraryPower | LibraryTechnique>,
  kind: 'power' | 'technique',
  powerPartsDb: PowerPart[],
  techniquePartsDb: TechniquePart[],
): DetailOptionItemModel | null {
  const raw = lookup.get(String(refId).toLowerCase());
  if (!raw) return null;
  if (kind === 'technique') {
    return techniqueToDetailOption(raw as LibraryTechnique, techniquePartsDb, String(refId));
  }
  return powerToDetailOption(raw as LibraryPower, powerPartsDb, String(refId));
}
