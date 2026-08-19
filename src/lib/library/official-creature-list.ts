/**
 * Shared official creature list helpers (Library Realms tab + Admin public library).
 */

import type { CreatureData } from '@/components/patterns/list/creature-stat-block-types';
import { formatListCellLabel } from '@/lib/utils';
import { resolveCreatureInventoryBuckets } from '@/lib/game/creature-inventory';
import type { LibraryCreature } from '@/types/library';

/** Full stat-block list chrome (Realms + My Library creature tabs). */
export const CREATURE_STAT_BLOCK_GRID = '1.8fr 0.6fr 0.8fr 1fr 1fr 0.6fr 0.6fr';

export const CREATURE_STAT_BLOCK_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'level', label: 'LEVEL', align: 'center' as const },
  { key: 'size', label: 'SIZE', align: 'center' as const },
  { key: 'type', label: 'TYPE', align: 'center' as const },
  { key: 'archetype', label: 'ARCHETYPE', align: 'center' as const },
  { key: 'hp', label: 'Health', align: 'center' as const },
  { key: 'en', label: 'Energy', align: 'center' as const },
];

/** Data columns only — edit/delete/add use OfficialEntityList `rowChrome`. */
export const OFFICIAL_CREATURE_GRID = '1.5fr 0.8fr 1fr';

export const OFFICIAL_CREATURE_HEADER_COLUMNS = [
  { key: 'name', label: 'NAME', align: 'left' as const },
  { key: 'level', label: 'LEVEL', align: 'center' as const },
  { key: 'type', label: 'TYPE', align: 'center' as const },
];

export interface OfficialCreatureRow {
  id: string;
  raw: LibraryCreature;
  name: string;
  description: string;
  level: number;
  type: string;
}

export function buildOfficialCreatureRows(items: LibraryCreature[]): OfficialCreatureRow[] {
  return items.map((c) => ({
    id: String(c.id ?? c.docId ?? ''),
    raw: c,
    name: String(c.name ?? ''),
    description: String(c.description ?? ''),
    level: Number(c.level ?? 0),
    type: String(c.type ?? ''),
  }));
}

export function filterOfficialCreatureRows<
  T extends { name?: string; description?: string; type?: string },
>(rows: T[], search: string, sortItems: (items: T[]) => T[]): T[] {
  let result = rows;
  if (search) {
    const s = search.toLowerCase();
    result = result.filter(
      (x) =>
        String(x.name ?? '')
          .toLowerCase()
          .includes(s) ||
        String(x.type ?? '')
          .toLowerCase()
          .includes(s) ||
        String(x.description ?? '')
          .toLowerCase()
          .includes(s),
    );
  }
  return sortItems(result);
}

export function formatOfficialCreatureType(type: string): string {
  return formatListCellLabel(type);
}

/** Map library API creature rows to CreatureStatBlock data. */
export function mapLibraryCreatureToStatBlockData(creature: LibraryCreature): CreatureData {
  const inventory = resolveCreatureInventoryBuckets(creature);
  return {
    id: String(creature.id ?? creature.docId ?? ''),
    name: creature.name || '',
    description: creature.description,
    imageUrl: creature.image_url ?? undefined,
    level: creature.level,
    type: creature.type,
    size: creature.size,
    hp: creature.hp,
    hitPoints: creature.hitPoints,
    energyPoints: creature.energyPoints,
    abilities: creature.abilities,
    defenses: creature.defenses,
    powerProficiency: creature.powerProficiency,
    martialProficiency: creature.martialProficiency,
    resistances: creature.resistances,
    weaknesses: creature.weaknesses,
    immunities: creature.immunities,
    conditionImmunities: creature.conditionImmunities,
    senses: creature.senses,
    movementTypes: creature.movementTypes,
    languages: creature.languages,
    skills: creature.skills,
    powers: creature.powers,
    techniques: creature.techniques,
    feats: creature.feats,
    weapons: inventory.weapons,
    armor: inventory.armor,
    shields: inventory.shields,
    equipment: inventory.equipment,
  };
}
