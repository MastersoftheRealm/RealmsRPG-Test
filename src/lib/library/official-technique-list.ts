/**
 * Shared official technique list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { TechniquePart } from '@/hooks/codex-types';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';

export const OFFICIAL_TECHNIQUE_GRID = '1.5fr 0.8fr 0.8fr 1fr 1fr 1fr 40px';

export const OFFICIAL_TECHNIQUE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'energy', label: 'ENERGY', align: 'center' as const },
  { key: 'tp', label: 'TP', align: 'center' as const },
  { key: 'action', label: 'ACTION', align: 'center' as const },
  { key: 'weapon', label: 'WEAPON', align: 'center' as const },
  { key: 'damage', label: 'DAMAGE', align: 'center' as const },
  { key: '_actions', label: '', sortable: false as const },
];

export interface OfficialTechniqueRow {
  id: string;
  raw: Record<string, unknown>;
  name: string;
  description: string;
  energy: string | number | undefined;
  tp: number;
  action: string | undefined;
  weapon: string;
  damage: string;
  parts: ChipData[];
}

export function getEmpoweredTechniqueTotals(item: unknown): { energy?: number; tp?: number } {
  const raw = item as Record<string, unknown>;
  const totals = raw.totals as Record<string, unknown> | undefined;
  const energy = typeof totals?.energy === 'number' ? totals.energy : undefined;
  const tp = typeof totals?.trainingPoints === 'number' ? totals.trainingPoints : undefined;
  return { energy, tp };
}

export function buildOfficialTechniqueRows(
  items: Array<Record<string, unknown>>,
  partsDb: TechniquePart[],
  mode: 'standard' | 'empowered' = 'standard'
): OfficialTechniqueRow[] {
  const empowered = mode === 'empowered';
  return items.map((t) => {
    const doc: TechniqueDocument = {
      name: String(t.name ?? ''),
      description: String(t.description ?? ''),
      parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
      damage: Array.isArray(t.damage)
        ? (t.damage[0] as TechniqueDocument['damage'])
        : (t.damage as TechniqueDocument['damage']),
      weapon: t.weapon as TechniqueDocument['weapon'],
    };
    const display = deriveTechniqueDisplay(doc, partsDb);
    const totals = empowered ? getEmpoweredTechniqueTotals(t) : {};
    const damageStr = formatTechniqueDamage(doc.damage);
    const parts: ChipData[] = display.partChips.map((chip) => ({
      name: chip.text.split(' | TP:')[0].replace(/\s*\(Opt\d+ \d+\)/g, '').trim(),
      description: chip.description,
      cost: chip.finalTP,
      costLabel: 'TP',
    }));
    return {
      id: String(t.id ?? t.docId ?? ''),
      raw: t,
      name: display.name,
      description: display.description,
      energy: empowered ? (totals.energy ?? display.energy) : display.energy,
      tp: empowered ? (totals.tp ?? display.tp) : display.tp,
      action: display.actionType,
      weapon: display.weaponName || '-',
      damage: damageStr,
      parts,
    };
  });
}

export function filterOfficialTechniqueRows<T extends { name?: string; description?: string; weapon?: string }>(
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
        String(x.description ?? '').toLowerCase().includes(s) ||
        String(x.weapon ?? '').toLowerCase().includes(s)
    );
  }
  return sortItems(result);
}
