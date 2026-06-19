import type { UserItem, UserPower, UserTechnique } from '../use-user-library';
import { normalizePublicItem, normalizePublicPower, normalizePublicTechnique } from './normalize-public';
import type { AddLibraryItemType, EqItem, WithSource } from './types';

export interface RawItemsInput {
  itemType: AddLibraryItemType;
  userPowers: UserPower[];
  userTechniques: UserTechnique[];
  userItems: UserItem[];
  codexEquipment: Array<{ id: string; name?: string; description?: string; damage?: unknown; armor_value?: number; properties?: string[]; type?: string }>;
  publicPowers: Record<string, unknown>[];
  publicTechniques: Record<string, unknown>[];
  publicItems: Record<string, unknown>[];
  loading: {
    powersLoading: boolean;
    techniquesLoading: boolean;
    itemsLoading: boolean;
    equipmentLoading: boolean;
    publicPowersLoading: boolean;
    publicTechniquesLoading: boolean;
    publicItemsLoading: boolean;
  };
}

export function loadRawItemsForType(input: RawItemsInput): { rawItems: unknown[]; isLoading: boolean } {
  const { itemType, loading } = input;

  switch (itemType) {
    case 'power': {
      const my = input.userPowers.map((i): WithSource<UserPower> => ({ ...i, _source: 'my' }));
      const pub = input.publicPowers.map((p): WithSource<UserPower> => ({ ...normalizePublicPower(p), _source: 'public' }));
      return { rawItems: [...my, ...pub], isLoading: loading.powersLoading || loading.publicPowersLoading };
    }
    case 'technique': {
      const my = input.userTechniques.map((i): WithSource<UserTechnique> => ({ ...i, _source: 'my' }));
      const pub = input.publicTechniques.map((t): WithSource<UserTechnique> => ({ ...normalizePublicTechnique(t), _source: 'public' }));
      return { rawItems: [...my, ...pub], isLoading: loading.techniquesLoading || loading.publicTechniquesLoading };
    }
    case 'weapon': {
      const my = input.userItems
        .filter((i) => (i.type || '').toString().toLowerCase() === 'weapon')
        .map((i): WithSource<UserItem> => ({ ...i, _source: 'my' }));
      const pub = input.publicItems
        .filter((i) => (i.type || '').toString().toLowerCase() === 'weapon')
        .map((i): WithSource<UserItem> => ({ ...normalizePublicItem(i) as UserItem, _source: 'public' }));
      return { rawItems: [...my, ...pub], isLoading: loading.itemsLoading || loading.publicItemsLoading };
    }
    case 'armor': {
      const my = input.userItems
        .filter((i) => (i.type || '').toString().toLowerCase() === 'armor')
        .map((i): WithSource<UserItem> => ({ ...i, _source: 'my' }));
      const pub = input.publicItems
        .filter((i) => (i.type || '').toString().toLowerCase() === 'armor')
        .map((i): WithSource<UserItem> => ({ ...normalizePublicItem(i) as UserItem, _source: 'public' }));
      return { rawItems: [...my, ...pub], isLoading: loading.itemsLoading || loading.publicItemsLoading };
    }
    case 'shield': {
      const my = input.userItems
        .filter((i) => (i.type || '').toString().toLowerCase() === 'shield')
        .map((i): WithSource<UserItem> => ({ ...i, _source: 'my' }));
      const pub = input.publicItems
        .filter((i) => (i.type || '').toString().toLowerCase() === 'shield')
        .map((i): WithSource<UserItem> => ({ ...normalizePublicItem(i) as UserItem, _source: 'public' }));
      return { rawItems: [...my, ...pub], isLoading: loading.itemsLoading || loading.publicItemsLoading };
    }
    case 'equipment': {
      const codexEquip = input.codexEquipment.filter((e) => (e.type || 'equipment') === 'equipment');
      const userEquip = input.userItems.filter((i) => (i.type || '').toLowerCase() === 'equipment');
      const publicEquip = input.publicItems.filter((i) => (i.type || 'equipment').toString().toLowerCase() === 'equipment').map(normalizePublicItem);
      const merged: WithSource<EqItem>[] = [
        ...codexEquip.map(
          (e): WithSource<EqItem> => ({
            id: e.id,
            name: String(e.name ?? ''),
            description: String(e.description ?? ''),
            damage: e.damage,
            armorValue: e.armor_value,
            properties: e.properties ?? [],
            _source: 'public',
          })
        ),
        ...userEquip.map(
          (i): WithSource<EqItem> => ({
            id: i.id,
            name: String(i.name ?? ''),
            description: String(i.description ?? ''),
            damage: i.damage,
            armorValue: i.armorValue,
            properties: (i.properties || []) as EqItem['properties'],
            _source: 'my',
          })
        ),
        ...publicEquip.map(
          (i): WithSource<EqItem> => ({
            id: i.id,
            name: String(i.name ?? ''),
            description: String(i.description ?? ''),
            damage: (i as UserItem).damage,
            armorValue: (i as UserItem).armorValue,
            properties: ((i as UserItem).properties || []) as EqItem['properties'],
            _source: 'public',
          })
        ),
      ];
      return {
        rawItems: merged,
        isLoading: loading.itemsLoading || loading.equipmentLoading || loading.publicItemsLoading,
      };
    }
    default:
      return { rawItems: [], isLoading: false };
  }
}

export function loadEmpoweredRawItems(input: {
  userEmpoweredTechniques: UserTechnique[];
  publicEmpoweredTechniques: Record<string, unknown>[];
}): unknown[] {
  const merged = [
    ...input.userEmpoweredTechniques.map((item) => ({ ...item, _source: 'my' as const })),
    ...input.publicEmpoweredTechniques.map((item) => ({
      id: String(item.id ?? item.docId ?? ''),
      docId: String(item.id ?? item.docId ?? ''),
      name: String(item.name ?? ''),
      description: String(item.description ?? ''),
      parts: (item.parts ?? []) as UserTechnique['parts'],
      weapon: item.weapon as UserTechnique['weapon'],
      damage: item.damage as UserTechnique['damage'],
      ...item,
      _source: 'public' as const,
    })),
  ];
  const seen = new Set<string>();
  return merged.filter((technique) => {
    const id = String((technique as { docId?: string; id?: string }).docId ?? (technique as { id?: string }).id ?? '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}
