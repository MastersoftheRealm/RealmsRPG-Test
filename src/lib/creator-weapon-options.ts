import { calculateItemCosts } from '@/lib/calculators/item-calc';
import type { ItemPropertyPayload, ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import type { UserItem } from '@/hooks/use-user-library';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';

export type CreatorWeaponLibrary = 'builtin' | 'my' | 'official';

/** Weapon row for power / technique / empowered creators (dropdown + TP scaling). */
export interface CreatorWeaponOption {
  id: string | number;
  name: string;
  tp: number;
  weaponLibrary: CreatorWeaponLibrary;
  /** @deprecated Prefer `weaponLibrary === 'my'`; kept for older call sites */
  isUserWeapon?: boolean;
}

export function buildCreatorWeaponOptions(args: {
  defaults: Array<{ id: string | number; name: string; tp?: number }>;
  userItems: UserItem[];
  officialWeaponRows?: Record<string, unknown>[] | null;
  itemPropertiesDb: ItemPropertyTpRow[];
}): CreatorWeaponOption[] {
  const { defaults, userItems, officialWeaponRows, itemPropertiesDb } = args;

  const base: CreatorWeaponOption[] = defaults.map((d) => ({
    id: d.id,
    name: d.name,
    tp: d.tp ?? 0,
    weaponLibrary: 'builtin',
  }));

  const myWeapons: CreatorWeaponOption[] = userItems
    .filter((item) => (item.type || '').toLowerCase() === 'weapon')
    .map((item) => {
      const props = (item.properties || []) as ItemPropertyPayload[];
      const costs = itemPropertiesDb.length ? calculateItemCosts(props, itemPropertiesDb) : { totalTP: 1 };
      const tp = Math.max(0, Math.round(costs.totalTP));
      return {
        id: item.docId,
        name: item.name,
        tp: tp || 1,
        weaponLibrary: 'my' as const,
        isUserWeapon: true,
      };
    });

  const official: CreatorWeaponOption[] = (officialWeaponRows || [])
    .filter((row) => String((row as { type?: string }).type || '').toLowerCase() === 'weapon')
    .map((row) => {
      const r = row as { id?: unknown; docId?: unknown; name?: unknown; properties?: unknown };
      const id = String(r.id ?? r.docId ?? '');
      const name = String(r.name ?? '');
      const props = (r.properties || []) as ItemPropertyPayload[];
      const costs = itemPropertiesDb.length ? calculateItemCosts(props, itemPropertiesDb) : { totalTP: 1 };
      const tp = Math.max(0, Math.round(costs.totalTP));
      return {
        id,
        name,
        tp: tp || 1,
        weaponLibrary: 'official' as const,
        isUserWeapon: false,
      };
    });

  return [...base, ...myWeapons, ...official];
}

export function filterCreatorWeaponOptionsBySource(
  options: CreatorWeaponOption[],
  source: SourceFilterValue,
): CreatorWeaponOption[] {
  if (source === 'all') return options;
  if (source === 'my') {
    return options.filter((o) => o.weaponLibrary === 'builtin' || o.weaponLibrary === 'my');
  }
  return options.filter((o) => o.weaponLibrary === 'builtin' || o.weaponLibrary === 'official');
}
