/**
 * Library Power / Technique → DetailOptionItem for path deep-dive catalogs.
 */

import {
  derivePowerDisplay,
  formatPowerDamage,
  type PowerDocument,
} from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay, type TechniqueDocument } from '@/lib/calculators/technique-calc';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { factChip, type DetailOptionItemModel } from './builders';

function pushFact(chips: ChipData[], label: string, value: string | number | null | undefined) {
  if (value == null) return;
  const text = String(value).trim();
  if (!text || text === '—' || text.toLowerCase() === 'none') return;
  chips.push(factChip(`${label} ${text}`));
}

export function buildCombatLookup(
  rows: Array<LibraryPower | LibraryTechnique>
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
  energyTag: (energy: number) => string,
  idOverride?: string
): DetailOptionItemModel {
  const chips: ChipData[] = [];
  try {
    const disp = derivePowerDisplay(
      {
        name: String(power.name ?? ''),
        description: String(power.description ?? ''),
        parts: power.parts ?? [],
      } satisfies PowerDocument,
      powerPartsDb
    );
    if (typeof disp.energy === 'number') pushFact(chips, 'Energy', disp.energy);
    if (disp.actionType) pushFact(chips, 'Action Type', disp.actionType);
    if (disp.range) pushFact(chips, 'Range', disp.range);
    if (disp.area) pushFact(chips, 'Area', disp.area);
    if (disp.duration) pushFact(chips, 'Duration', disp.duration);
    const damage = formatPowerDamage(power.damage);
    if (damage) pushFact(chips, 'Damage', damage);
    void energyTag;
  } catch {
    // still return the resolved row
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
  energyTag: (energy: number) => string,
  idOverride?: string
): DetailOptionItemModel {
  const chips: ChipData[] = [];
  try {
    const disp = deriveTechniqueDisplay(
      {
        name: String(technique.name ?? ''),
        description: String(technique.description ?? ''),
        parts: technique.parts ?? [],
        actionType: technique.actionType,
        weapon: technique.weapon?.name ? { name: technique.weapon.name } : undefined,
      } satisfies TechniqueDocument,
      techniquePartsDb
    );
    if (typeof disp.energy === 'number') pushFact(chips, 'Energy', disp.energy);
    if (disp.actionType) pushFact(chips, 'Action Type', disp.actionType);
    if (disp.damageStr) pushFact(chips, 'Damage', disp.damageStr);
    if (disp.weaponName) pushFact(chips, 'Weapon', disp.weaponName);
    void energyTag;
  } catch {
    // still return the resolved row
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
  energyTag: (energy: number) => string
): DetailOptionItemModel | null {
  const raw = lookup.get(String(refId).toLowerCase());
  if (!raw) return null;
  if (kind === 'technique') {
    return techniqueToDetailOption(
      raw as LibraryTechnique,
      techniquePartsDb,
      energyTag,
      String(refId)
    );
  }
  return powerToDetailOption(raw as LibraryPower, powerPartsDb, energyTag, String(refId));
}
