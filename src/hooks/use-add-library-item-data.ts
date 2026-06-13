/**
 * useAddLibraryItemData — Fetch, merge, filter, and enrich library items for AddLibraryItemModal.
 * Handles React Query fetches, source/mode filter state, and SelectableItem[] derivation.
 */

'use client';

import { useMemo, useState } from 'react';
import { useUserPowers, useUserTechniques, useUserEmpoweredTechniques, useUserItems } from './use-user-library';
import type { UserPower, UserTechnique, UserItem } from './use-user-library';
import {
  useCodexEquipment,
  useCodexTechniqueParts,
  useCodexPowerParts,
  useCodexItemProperties,
} from './use-codex';
import { useOfficialLibrary } from './use-official-library';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { ColumnValue, ChipData } from '@/components/shared/grid-list-row';
import { formatDamageDisplay, formatActionTypeForDisplay } from '@/lib/utils';
import {
  deriveShieldAmountFromProperties,
  deriveShieldDamageFromProperties,
  trainingPointsForItemPropertyRef,
} from '@/lib/calculators';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';

export type AddLibraryItemType = 'power' | 'technique' | 'weapon' | 'shield' | 'armor' | 'equipment';
export type PowerSelectionMode = 'powers' | 'empowered';

export type EqItem = {
  id: string;
  name?: string;
  description?: string;
  damage?: unknown;
  armorValue?: number;
  properties?: Array<string | { id?: string | number; name?: string; op_1_lvl?: number; base_tp?: number; op_1_tp?: number }>;
};

type WithSource<T> = T & { _source: 'my' | 'public' };

function capitalize(s: string | undefined): string {
  if (!s) return '-';
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function normalizePublicPower(p: Record<string, unknown>): UserPower {
  const id = String(p.id ?? p.docId ?? '');
  return {
    id,
    docId: id,
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    parts: (p.parts ?? []) as UserPower['parts'],
    actionType: p.actionType,
    isReaction: !!p.isReaction,
    range: p.range,
    area: p.area,
    duration: p.duration,
    damage: p.damage,
  } as UserPower;
}

function normalizePublicTechnique(t: Record<string, unknown>): UserTechnique {
  const id = String(t.id ?? t.docId ?? '');
  return {
    id,
    docId: id,
    name: String(t.name ?? ''),
    description: String(t.description ?? ''),
    parts: (t.parts ?? []) as UserTechnique['parts'],
    weapon: t.weapon,
    damage: t.damage,
  } as UserTechnique;
}

function normalizePublicItem(i: Record<string, unknown>): UserItem | EqItem {
  const id = String(i.id ?? i.docId ?? '');
  return {
    id,
    docId: id,
    name: String(i.name ?? ''),
    description: String(i.description ?? ''),
    type: ((i.type as string) || 'equipment') as UserItem['type'],
    properties: (i.properties ?? []) as UserItem['properties'],
    damage: i.damage,
    armorValue: i.armorValue as number | undefined,
  } as UserItem;
}

function getItemColumns(
  item: UserPower | UserTechnique | UserItem | EqItem,
  itemType: AddLibraryItemType,
  techniqueDisplay?: { energy: number; weaponName: string; tp: number; actionType: string }
): ColumnValue[] {
  if (itemType === 'power') {
    const power = item as UserPower;
    const damageStr = power.damage?.length ? power.damage.map(d => capitalize(d.type)).join(', ') : '-';
    const areaStr = power.area?.type ? capitalize(power.area.type) : '-';
    return [
      { key: 'Action', value: formatActionTypeForDisplay(power.actionType ?? ''), align: 'center' as const },
      { key: 'Damage', value: damageStr, align: 'center' as const },
      { key: 'Area', value: areaStr, align: 'center' as const },
    ];
  }
  if (itemType === 'technique' && techniqueDisplay) {
    return [
      { key: 'Action', value: techniqueDisplay.actionType || '-', align: 'center' as const },
      { key: 'Energy', value: String(techniqueDisplay.energy), align: 'center' as const },
      { key: 'Weapon', value: techniqueDisplay.weaponName || '-', align: 'center' as const },
      { key: 'Training Pts', value: String(techniqueDisplay.tp), align: 'center' as const },
    ];
  }
  if (itemType === 'technique') {
    const technique = item as UserTechnique;
    return [
      { key: 'Action', value: formatActionTypeForDisplay(technique.actionType ?? ''), align: 'center' as const },
      { key: 'Weapon', value: technique.weapon?.name || '-', align: 'center' as const },
      { key: 'Training Pts', value: '-', align: 'center' as const },
    ];
  }
  if (itemType === 'weapon') {
    const weapon = item as UserItem;
    return weapon.damage ? [{ key: 'Damage', value: formatDamageDisplay(weapon.damage), highlight: true }] : [];
  }
  if (itemType === 'armor') {
    const armor = item as UserItem;
    return armor.armorValue ? [{ key: 'Armor', value: `+${armor.armorValue}`, highlight: true }] : [];
  }
  if (itemType === 'shield') {
    const shield = item as UserItem;
    const props = (shield.properties || []) as Array<{ id?: number; name?: string; op_1_lvl?: number }>;
    const block = deriveShieldAmountFromProperties(props);
    const dmg = deriveShieldDamageFromProperties(props) ?? (shield.damage ? formatDamageDisplay(shield.damage) : null);
    const cols: ColumnValue[] = [];
    if (block !== '-') cols.push({ key: 'Block', value: block, highlight: true });
    if (dmg) cols.push({ key: 'Damage', value: dmg, highlight: true });
    return cols;
  }
  return [];
}

export interface UseAddLibraryItemDataOptions {
  itemType: AddLibraryItemType;
  existingIds: Set<string>;
}

export interface UseAddLibraryItemDataReturn {
  source: SourceFilterValue;
  setSource: (value: SourceFilterValue) => void;
  powerSelectionMode: PowerSelectionMode;
  setPowerSelectionMode: (value: PowerSelectionMode) => void;
  items: SelectableItem[];
  isLoading: boolean;
  displayFilterFn: (item: SelectableItem) => boolean;
  emptyTitle: string;
  emptyDesc: string | undefined;
}

export function useAddLibraryItemData({
  itemType,
  existingIds,
}: UseAddLibraryItemDataOptions): UseAddLibraryItemDataReturn {
  const [source, setSource] = useState<SourceFilterValue>('all');
  const [powerSelectionMode, setPowerSelectionMode] = useState<PowerSelectionMode>('powers');

  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userEmpoweredTechniques = [], isLoading: empoweredTechniquesLoading } = useUserEmpoweredTechniques();
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems();
  const { data: codexEquipment = [], isLoading: equipmentLoading } = useCodexEquipment();
  const { data: techniquePartsDb = [] } = useCodexTechniqueParts();
  const { data: powerPartsDb = [] } = useCodexPowerParts();
  const { data: itemPropertiesDb = [] } = useCodexItemProperties();
  const { data: publicPowers = [], isLoading: publicPowersLoading, isError: publicPowersError } = useOfficialLibrary('powers');
  const { data: publicTechniques = [], isLoading: publicTechniquesLoading, isError: publicTechniquesError } = useOfficialLibrary('techniques');
  const { data: publicEmpoweredTechniques = [], isLoading: publicEmpoweredTechniquesLoading, isError: publicEmpoweredTechniquesError } = useOfficialLibrary('empowered-techniques');
  const { data: publicItems = [], isLoading: publicItemsLoading, isError: publicItemsError } = useOfficialLibrary('items');
  const publicLibraryError = publicPowersError || publicTechniquesError || publicEmpoweredTechniquesError || publicItemsError;

  const { rawItems, isLoading: rawItemsLoading } = useMemo(() => {
    switch (itemType) {
      case 'power': {
        const my = (userPowers as (UserPower | UserTechnique | UserItem | EqItem)[]).map((i): WithSource<UserPower> => ({ ...i, _source: 'my' } as WithSource<UserPower>));
        const pub = (publicPowers as Record<string, unknown>[]).map((p): WithSource<UserPower> => ({ ...normalizePublicPower(p), _source: 'public' } as WithSource<UserPower>));
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: powersLoading || publicPowersLoading };
      }
      case 'technique': {
        const my = (userTechniques as (UserTechnique | EqItem)[]).map((i): WithSource<UserTechnique> => ({ ...i, _source: 'my' } as WithSource<UserTechnique>));
        const pub = (publicTechniques as Record<string, unknown>[]).map((t): WithSource<UserTechnique> => ({ ...normalizePublicTechnique(t), _source: 'public' } as WithSource<UserTechnique>));
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: techniquesLoading || publicTechniquesLoading };
      }
      case 'weapon': {
        const my = userItems.filter((i: UserItem) => (i.type || '').toString().toLowerCase() === 'weapon').map((i): WithSource<UserItem> => ({ ...i, _source: 'my' } as WithSource<UserItem>));
        const pub = (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => (i.type || '').toString().toLowerCase() === 'weapon').map((i): WithSource<UserItem> => ({ ...normalizePublicItem(i), _source: 'public' } as WithSource<UserItem>));
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: itemsLoading || publicItemsLoading };
      }
      case 'armor': {
        const my = userItems.filter((i: UserItem) => (i.type || '').toString().toLowerCase() === 'armor').map((i): WithSource<UserItem> => ({ ...i, _source: 'my' } as WithSource<UserItem>));
        const pub = (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => (i.type || '').toString().toLowerCase() === 'armor').map((i): WithSource<UserItem> => ({ ...normalizePublicItem(i), _source: 'public' } as WithSource<UserItem>));
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: itemsLoading || publicItemsLoading };
      }
      case 'shield': {
        const my = userItems.filter((i: UserItem) => (i.type || '').toString().toLowerCase() === 'shield').map((i): WithSource<UserItem> => ({ ...i, _source: 'my' } as WithSource<UserItem>));
        const pub = (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => (i.type || '').toString().toLowerCase() === 'shield').map((i): WithSource<UserItem> => ({ ...normalizePublicItem(i), _source: 'public' } as WithSource<UserItem>));
        const merged = [...my, ...pub];
        return { rawItems: merged, isLoading: itemsLoading || publicItemsLoading };
      }
      case 'equipment': {
        const codexEquip = codexEquipment.filter((e: { type?: string }) => (e.type || 'equipment') === 'equipment');
        const userEquip = userItems.filter((i: UserItem) => (i.type || '').toLowerCase() === 'equipment');
        const publicEquip = (publicItems as Record<string, unknown>[]).filter((i: Record<string, unknown>) => (i.type || 'equipment').toString().toLowerCase() === 'equipment').map(normalizePublicItem);
        const merged: WithSource<EqItem>[] = [
          ...codexEquip.map((e: { id: string; name?: string; description?: string; damage?: unknown; armor_value?: number; properties?: string[] }): WithSource<EqItem> => ({
            id: e.id,
            name: String(e.name ?? ''),
            description: String(e.description ?? ''),
            damage: e.damage,
            armorValue: e.armor_value,
            properties: e.properties ?? [],
            _source: 'public',
          }) as WithSource<EqItem>),
          ...userEquip.map((i: UserItem): WithSource<EqItem> => ({
            id: i.id,
            name: String(i.name ?? ''),
            description: String(i.description ?? ''),
            damage: i.damage,
            armorValue: i.armorValue,
            properties: (i.properties || []) as EqItem['properties'],
            _source: 'my',
          }) as WithSource<EqItem>),
          ...publicEquip.map((i: UserItem | EqItem): WithSource<EqItem> => ({
            id: i.id,
            name: String(i.name ?? ''),
            description: String(i.description ?? ''),
            damage: (i as UserItem).damage,
            armorValue: (i as UserItem).armorValue,
            properties: ((i as UserItem).properties || []) as EqItem['properties'],
            _source: 'public',
          }) as WithSource<EqItem>),
        ];
        return { rawItems: merged, isLoading: itemsLoading || equipmentLoading || publicItemsLoading };
      }
      default:
        return { rawItems: [], isLoading: false };
    }
  }, [itemType, userPowers, userTechniques, userItems, codexEquipment, publicPowers, publicTechniques, publicItems, powersLoading, techniquesLoading, itemsLoading, equipmentLoading, publicPowersLoading, publicTechniquesLoading, publicItemsLoading]);

  const empoweredRawItems = useMemo(() => {
    if (itemType !== 'power') return [];
    const merged = [
      ...(userEmpoweredTechniques as Array<UserTechnique & { _source?: 'my' | 'public' }>).map((item) => ({ ...item, _source: 'my' as const })),
      ...(publicEmpoweredTechniques as Record<string, unknown>[]).map((item) => ({
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
  }, [itemType, publicEmpoweredTechniques, userEmpoweredTechniques]);

  const items: SelectableItem[] = useMemo(() => {
    const list = itemType === 'power' && powerSelectionMode === 'empowered' ? empoweredRawItems : rawItems;
    return list
      .filter((item: { id: string }) => !existingIds.has(String(item.id)))
      .map((item: UserPower | UserTechnique | UserItem | EqItem) => {
        let techniqueDisplay: { energy: number; weaponName: string; tp: number; actionType: string } | undefined;
        let detailSections: SelectableItem['detailSections'];
        let totalCost: number | undefined;
        const costLabel = 'TP';

        if (itemType === 'power' && powerSelectionMode === 'empowered') {
          const technique = item as UserTechnique;
          const raw = technique as unknown as Record<string, unknown>;
          const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
          const totals = (raw.totals as Record<string, unknown> | undefined) ?? {};
          const actionType = String(raw.actionType ?? '');
          const isReaction = raw.isReaction === true;
          const action = actionType
            ? `${actionType.charAt(0).toUpperCase()}${actionType.slice(1)} ${isReaction ? 'Reaction' : 'Action'}`
            : (isReaction ? 'Reaction' : '-');
          const areaRaw = (powerData.area as Record<string, unknown> | undefined)?.type;
          const areaValue = areaRaw ? String(areaRaw).replace(/\b\w/g, (c) => c.toUpperCase()) : '-';
          const damageRows = Array.isArray(powerData.damage) ? (powerData.damage as Array<{ amount?: number; size?: number; type?: string }>) : [];
          const damageValue = damageRows.length > 0
            ? damageRows
                .filter((row) => (row.amount ?? 0) > 0 && row.type && row.type !== 'none')
                .map((row) => `${row.amount}d${row.size} ${row.type}`)
                .join(', ')
            : '-';
          return {
            id: String(item.id),
            name: String(item.name ?? ''),
            description: String((item as UserTechnique).description ?? '') || 'No description available.',
            columns: [
              { key: 'Action', value: action, align: 'center' as const },
              { key: 'Damage', value: damageValue, align: 'center' as const },
              { key: 'Area', value: areaValue, align: 'center' as const },
            ],
            badges: [{ label: 'Empowered', color: 'gray' as const }],
            totalCost: Number(totals.trainingPoints ?? 0) || undefined,
            costLabel: Number(totals.trainingPoints ?? 0) > 0 ? 'TP' : undefined,
            data: item,
          };
        }
        if (itemType === 'power') {
          const p = item as UserPower;
          const doc: PowerDocument = {
            name: String(p.name ?? ''),
            description: String(p.description ?? ''),
            parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
            damage: p.damage as PowerDocument['damage'],
            actionType: p.actionType,
            isReaction: p.isReaction,
            range: p.range as PowerDocument['range'],
            area: p.area as PowerDocument['area'],
            duration: p.duration as PowerDocument['duration'],
          };
          const display = derivePowerDisplay(doc, powerPartsDb);
          const partChips: ChipData[] = display.partChips.map((chip) => ({
            name: chip.text.split(' | TP:')[0].trim(),
            description: chip.description,
            cost: chip.finalTP,
            costLabel: 'TP',
            category: chip.finalTP && chip.finalTP > 0 ? ('cost' as const) : ('default' as const),
          }));
          detailSections = partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined;
          totalCost = display.tp > 0 ? display.tp : undefined;
        } else if (itemType === 'technique') {
          const t = item as UserTechnique;
          const doc: TechniqueDocument = {
            name: String(t.name ?? ''),
            description: String(t.description ?? ''),
            parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
            damage: Array.isArray(t.damage) && t.damage[0] ? t.damage[0] : (t.damage as TechniqueDocument['damage']),
            weapon: t.weapon as TechniqueDocument['weapon'],
            actionType: t.actionType,
            isReaction: t.isReaction,
          };
          const display = deriveTechniqueDisplay(doc, techniquePartsDb);
          techniqueDisplay = {
            energy: display.energy,
            weaponName: display.weaponName,
            tp: display.tp,
            actionType: display.actionType,
          };
          const partChips: ChipData[] = display.partChips.map((chip) => ({
            name: chip.text.split(' | TP:')[0].trim(),
            description: chip.description,
            cost: chip.finalTP,
            costLabel: 'TP',
            category: chip.finalTP && chip.finalTP > 0 ? ('cost' as const) : ('default' as const),
          }));
          detailSections = partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined;
          totalCost = typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined;
        } else if (itemType === 'weapon' || itemType === 'shield' || itemType === 'armor' || itemType === 'equipment') {
          const it = item as UserItem | EqItem;
          const props = (Array.isArray(it.properties) ? it.properties : []) as Array<{ id?: string | number; name?: string; op_1_lvl?: number }>;
          const propertyChips: ChipData[] = props.map((prop) => {
            const propName = typeof prop === 'string' ? prop : (prop?.name ?? '');
            const dbProp = itemPropertiesDb.find((p: { name?: string }) => p.name?.toLowerCase() === String(propName).toLowerCase());
            const cost = trainingPointsForItemPropertyRef(prop, itemPropertiesDb);
            const lvl = typeof prop === 'object' && prop?.op_1_lvl != null ? prop.op_1_lvl : 0;
            const baseDesc = dbProp?.description;
            const descWithOpt = baseDesc?.trim()
              ? (lvl > 1 ? `${baseDesc.trim()}\n\nOption 1: Lv.${lvl}` : baseDesc.trim())
              : (lvl > 1 ? `Option 1: Lv.${lvl}` : undefined);
            return {
              name: dbProp?.name || propName,
              description: descWithOpt,
              cost: cost > 0 ? cost : undefined,
              costLabel: 'TP',
              category: cost > 0 ? ('cost' as const) : ('default' as const),
              level: lvl > 1 ? lvl : undefined,
            };
          });
          detailSections = propertyChips.length > 0 ? [{ label: 'Properties & Proficiencies', chips: propertyChips }] : undefined;
          totalCost = propertyChips.reduce((sum, c) => sum + (c.cost ?? 0), 0) || undefined;
        }

        return {
          id: String(item.id),
          name: String(item.name ?? ''),
          description: String((item as UserPower | UserTechnique | UserItem).description ?? '') || 'No description available.',
          columns: getItemColumns(item, itemType, techniqueDisplay),
          detailSections,
          totalCost,
          costLabel: totalCost != null ? costLabel : undefined,
          data: item,
        };
      });
  }, [rawItems, empoweredRawItems, existingIds, itemType, powerSelectionMode, techniquePartsDb, powerPartsDb, itemPropertiesDb]);

  const isLoading =
    itemType === 'power' && powerSelectionMode === 'empowered'
      ? empoweredTechniquesLoading || publicEmpoweredTechniquesLoading
      : rawItemsLoading;

  const typeLabel = itemType === 'power' ? 'Powers' : itemType === 'technique' ? 'Techniques' : itemType === 'weapon' ? 'Weapons' : itemType === 'shield' ? 'Shields' : itemType === 'armor' ? 'Armor' : 'Equipment';

  const displayFilterFn = useMemo(
    () => (item: SelectableItem) =>
      source === 'all' || (item.data as { _source?: 'my' | 'public' })?._source === source,
    [source]
  );

  const displayedCount = useMemo(() => items.filter(displayFilterFn).length, [items, displayFilterFn]);

  const emptyTitle = displayedCount === 0
    ? (source === 'public'
      ? `No public ${typeLabel.toLowerCase()} in the community library`
      : `No ${itemType}s available`)
    : 'All already added or no matches';

  const emptyDesc = displayedCount === 0
    ? (source === 'public' && publicLibraryError
      ? 'Failed to load Realms Library. Try again later.'
      : source === 'public'
        ? 'Official content can be added by admins via Admin → Realms Library Editor.'
        : itemType === 'equipment'
          ? 'Equipment is loaded from the Codex. Add equipment via the Admin Codex if needed.'
          : `Create some in the ${itemType === 'power' ? 'Power' : itemType === 'technique' ? 'Technique' : 'Item'} Creator first!`)
    : undefined;

  return {
    source,
    setSource,
    powerSelectionMode,
    setPowerSelectionMode,
    items,
    isLoading,
    displayFilterFn,
    emptyTitle,
    emptyDesc,
  };
}
