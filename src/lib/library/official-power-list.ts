/**
 * Shared official power list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { PowerPart } from '@/hooks/codex-types';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';

export const OFFICIAL_POWER_GRID = '1.5fr 0.8fr 1fr 1fr 0.8fr 1fr 1fr 40px';

export const OFFICIAL_POWER_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'energy', label: 'ENERGY', align: 'center' as const },
  { key: 'action', label: 'ACTION', align: 'center' as const },
  { key: 'duration', label: 'DURATION', align: 'center' as const },
  { key: 'range', label: 'RANGE', align: 'center' as const },
  { key: 'area', label: 'AREA', align: 'center' as const },
  { key: 'damage', label: 'DAMAGE', align: 'center' as const },
  { key: '_actions', label: '', sortable: false as const },
];

export interface OfficialPowerRow {
  id: string;
  raw: Record<string, unknown>;
  name: string;
  description: string;
  energy: string | number | undefined;
  action: string | undefined;
  duration: string | undefined;
  range: string | undefined;
  area: string | undefined;
  damage: string;
  tp: number;
  parts: ChipData[];
}

export function buildOfficialPowerRows(
  items: Array<Record<string, unknown>>,
  partsDb: PowerPart[]
): OfficialPowerRow[] {
  return items.map((p) => {
    const doc: PowerDocument = {
      name: String(p.name ?? ''),
      description: String(p.description ?? ''),
      parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
      damage: p.damage as PowerDocument['damage'],
      actionType: p.actionType as string | undefined,
      isReaction: p.isReaction as boolean | undefined,
      range: p.range as PowerDocument['range'],
      area: p.area as PowerDocument['area'],
      duration: p.duration as PowerDocument['duration'],
    };
    const display = derivePowerDisplay(doc, partsDb);
    const damageStr = formatPowerDamage(doc.damage);
    const parts: ChipData[] = display.partChips.map((chip) => ({
      name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
      description: chip.description,
      cost: chip.finalTP,
      costLabel: 'TP',
    }));
    return {
      id: String(p.id ?? p.docId ?? ''),
      raw: p,
      name: display.name,
      description: display.description,
      energy: display.energy,
      action: display.actionType,
      duration: display.duration,
      range: display.range,
      area: display.area,
      damage: damageStr,
      tp: display.tp,
      parts,
    };
  });
}

export function filterOfficialPowerRows<T extends { name?: string; description?: string }>(
  rows: T[],
  search: string,
  sortItems: (items: T[]) => T[]
): T[] {
  let result = rows;
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (x) =>
        String(x.name ?? '').toLowerCase().includes(s) ||
        String(x.description ?? '').toLowerCase().includes(s)
    );
  }
  return sortItems(result);
}
