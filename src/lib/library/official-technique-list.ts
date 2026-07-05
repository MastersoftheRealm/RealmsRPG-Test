/**
 * Shared official technique list helpers (Library Realms tab + Admin public library).
 */

import type { ChipData } from '@/components/shared';
import type { TechniquePart } from '@/hooks/codex-types';
import type { LibraryTechnique } from '@/types/library';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { deriveTechniqueDisplay, formatTechniqueDamage } from '@/lib/calculators/technique-calc';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';

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
  raw: LibraryTechnique;
  name: string;
  description: string;
  energy: string | number | undefined;
  tp: number;
  action: string | undefined;
  weapon: string;
  damage: string;
  parts: ChipData[];
}

export function getEmpoweredTechniqueTotals(item: LibraryTechnique & {
  totals?: { energy?: number; trainingPoints?: number };
}): { energy?: number; tp?: number } {
  const totals = item.totals;
  const energy = typeof totals?.energy === 'number' ? totals.energy : undefined;
  const tp = typeof totals?.trainingPoints === 'number' ? totals.trainingPoints : undefined;
  return { energy, tp };
}

export function buildOfficialTechniqueRows(
  items: LibraryTechnique[],
  partsDb: TechniquePart[],
  mode: 'standard' | 'empowered' = 'standard'
): OfficialTechniqueRow[] {
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
    const empowered = mode === 'empowered';
    const totals = empowered ? getEmpoweredTechniqueTotals(t) : {};
    const damageStr = formatTechniqueDamage(doc.damage);
    const parts = partChipsFromDisplay(display.partChips, { stripOptionSuffix: true });
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
