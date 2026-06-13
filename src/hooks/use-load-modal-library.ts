/**
 * useLoadModalLibrary — Unified load-from-library state and data for power/technique/item creators.
 * Same data and display as Add Library Item modal: SourceFilter (All/Public/My), SelectableItem[] with
 * columns, detailSections (chips), expandable rows. Used with LoadFromLibraryModal in unified mode.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useUserPowers, useUserTechniques, useUserEmpoweredTechniques, useUserItems } from './use-user-library';
import { useOfficialLibrary } from './use-official-library';
import {
  useCodexPowerParts,
  useCodexTechniqueParts,
  useCodexItemProperties,
} from './use-codex';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import {
  buildSelectableItem,
  getListHeaderColumns,
  getModalGridColumns,
  type LibraryItemType,
  type EqItem,
} from '@/lib/library-selectable-builders';
import type { UserPower, UserTechnique, UserItem } from './use-user-library';

export type LoadModalLibraryType = 'power' | 'technique' | 'empowered-technique' | 'item';

export interface UseLoadModalLibraryReturn {
  showLoadModal: boolean;
  openLoadModal: () => void;
  closeLoadModal: () => void;
  selectableItems: SelectableItem[];
  /** Raw merged items (user + public by source) for ?edit= lookup */
  rawItems: (UserPower | UserTechnique | UserItem | EqItem)[];
  isLoading: boolean;
  error: Error | null;
  source: SourceFilterValue;
  setSource: (v: SourceFilterValue) => void;
  columns: { key: string; label: string; sortable?: boolean }[];
  gridColumns: string;
  emptyMessage: string;
  emptySubMessage?: string;
  isPublicError: boolean;
}

function normalizePublicPower(p: Record<string, unknown>): UserPower {
  const id = String(p.id ?? p.docId ?? '');
  return {
    id,
    docId: id,
    name: String(p.name ?? ''),
    description: String(p.description ?? ''),
    parts: (p.parts ?? []) as UserPower['parts'],
    actionType: p.actionType as string,
    isReaction: !!p.isReaction,
    range: p.range as UserPower['range'],
    area: p.area as UserPower['area'],
    duration: p.duration as UserPower['duration'],
    damage: p.damage as UserPower['damage'],
  } as UserPower;
}

function normalizePublicTechnique(t: Record<string, unknown>): UserTechnique {
  const id = String(t.id ?? t.docId ?? '');
  const weaponFromPayload = t.weapon as UserTechnique['weapon'] | undefined;
  const weaponName = typeof t.weaponName === 'string' ? t.weaponName : undefined;
  return {
    ...(t as Record<string, unknown>),
    id,
    docId: id,
    name: String(t.name ?? ''),
    description: String(t.description ?? ''),
    parts: (t.parts ?? []) as UserTechnique['parts'],
    weapon: weaponFromPayload ?? (weaponName ? { name: weaponName } : undefined),
    damage: t.damage as UserTechnique['damage'],
    actionType: t.actionType as string | undefined,
    isReaction: (t.isReaction as boolean | undefined) ?? false,
  } as UserTechnique;
}

function normalizePublicItem(i: Record<string, unknown>): UserItem | EqItem {
  const id = String(i.id ?? i.docId ?? '');
  return {
    id,
    docId: id,
    name: String(i.name ?? ''),
    description: String(i.description ?? ''),
    type: ((i.type as string) || 'weapon') as UserItem['type'],
    properties: (i.properties ?? []) as UserItem['properties'],
    damage: i.damage,
    armorValue: i.armorValue as number | undefined,
  } as UserItem;
}

export function useLoadModalLibrary(type: LoadModalLibraryType): UseLoadModalLibraryReturn {
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [source, setSource] = useState<SourceFilterValue>('all');

  const openLoadModal = useCallback(() => setShowLoadModal(true), []);
  const closeLoadModal = useCallback(() => {
    setShowLoadModal(false);
    setSource('all');
  }, []);

  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers();
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques();
  const { data: userEmpoweredTechniques = [], isLoading: empoweredTechniquesLoading } = useUserEmpoweredTechniques();
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems();

  const { data: publicPowers = [], isLoading: publicPowersLoading, isError: publicPowersError } = useOfficialLibrary('powers');
  const { data: publicTechniques = [], isLoading: publicTechniquesLoading, isError: publicTechniquesError } =
    useOfficialLibrary('techniques');
  const { data: publicEmpoweredTechniques = [], isLoading: publicEmpoweredTechniquesLoading, isError: publicEmpoweredTechniquesError } =
    useOfficialLibrary('empowered-techniques');
  const { data: publicItems = [], isLoading: publicItemsLoading, isError: publicItemsError } = useOfficialLibrary('items');

  const { data: powerPartsDb = [] } = useCodexPowerParts();
  const { data: techniquePartsDb = [] } = useCodexTechniqueParts();
  const { data: itemPropertiesDb = [] } = useCodexItemProperties();

  const codex = useMemo(
    () => ({
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
    }),
    [powerPartsDb, techniquePartsDb, itemPropertiesDb]
  );

  const { selectableItems, rawItems, isLoading, isPublicError } = useMemo(() => {
    const publicError =
      (type === 'power' && publicPowersError) ||
      (type === 'technique' && publicTechniquesError) ||
      (type === 'empowered-technique' && publicEmpoweredTechniquesError) ||
      (type === 'item' && publicItemsError);

    if (type === 'power') {
      const my = (source === 'my' || source === 'all') ? (userPowers as (UserPower | UserTechnique | UserItem | EqItem)[]) : [];
      const pub = (source === 'public' || source === 'all') ? (publicPowers as Record<string, unknown>[]).map(normalizePublicPower) : [];
      const raw = [...my, ...pub];
      const loading = (source !== 'public' && powersLoading) || (source !== 'my' && publicPowersLoading);
      const items = raw.map((item) => buildSelectableItem(item, 'power', codex));
      return { selectableItems: items, rawItems: raw, isLoading: loading, isPublicError: !!publicError };
    }

    if (type === 'technique') {
      const my = (source === 'my' || source === 'all') ? (userTechniques as (UserPower | UserTechnique | UserItem | EqItem)[]) : [];
      const pub = (source === 'public' || source === 'all') ? (publicTechniques as Record<string, unknown>[]).map(normalizePublicTechnique) : [];
      const raw = [...my, ...pub];
      const loading = (source !== 'public' && techniquesLoading) || (source !== 'my' && publicTechniquesLoading);
      const items = raw.map((item) => buildSelectableItem(item, 'technique', codex));
      return { selectableItems: items, rawItems: raw, isLoading: loading, isPublicError: !!publicError };
    }

    if (type === 'empowered-technique') {
      const my = (source === 'my' || source === 'all') ? (userEmpoweredTechniques as (UserPower | UserTechnique | UserItem | EqItem)[]) : [];
      const pub = (source === 'public' || source === 'all') ? (publicEmpoweredTechniques as Record<string, unknown>[]).map(normalizePublicTechnique) : [];
      const raw = [...my, ...pub];
      const loading = (source !== 'public' && empoweredTechniquesLoading) || (source !== 'my' && publicEmpoweredTechniquesLoading);
      const items = raw.map((item) => buildSelectableItem(item, 'technique', codex));
      return { selectableItems: items, rawItems: raw, isLoading: loading, isPublicError: !!publicError };
    }

    // type === 'item': all armaments (weapon, armor, shield) from user + public
    const my =
      source === 'my' || source === 'all'
        ? (userItems as UserItem[]).filter((i) => ['weapon', 'armor', 'shield'].includes((i.type || '').toLowerCase()))
        : [];
    const pub =
      source === 'public' || source === 'all'
        ? (publicItems as Record<string, unknown>[])
            .filter((i) => ['weapon', 'armor', 'shield'].includes(String(i.type || '').toLowerCase()))
            .map(normalizePublicItem)
        : [];
    const raw = [...my, ...pub] as (UserPower | UserTechnique | UserItem | EqItem)[];
    const loading = (source !== 'public' && itemsLoading) || (source !== 'my' && publicItemsLoading);
    const items = raw.map((item) => buildSelectableItem(item, 'item', codex));
    return { selectableItems: items, rawItems: raw, isLoading: loading, isPublicError: !!publicError };
  }, [
    type,
    source,
    userPowers,
    userTechniques,
    userEmpoweredTechniques,
    userItems,
    publicPowers,
    publicTechniques,
    publicEmpoweredTechniques,
    publicItems,
    powersLoading,
    techniquesLoading,
    empoweredTechniquesLoading,
    itemsLoading,
    publicPowersLoading,
    publicTechniquesLoading,
    publicEmpoweredTechniquesLoading,
    publicItemsLoading,
    publicPowersError,
    publicTechniquesError,
    publicEmpoweredTechniquesError,
    publicItemsError,
    codex,
  ]);

  const libraryType: LibraryItemType = type === 'item' ? 'item' : (type === 'empowered-technique' ? 'technique' : type);
  const columns = getListHeaderColumns(libraryType);
  const gridColumns = getModalGridColumns(libraryType);

  const typeLabel =
    type === 'power' ? 'powers' : type === 'item' ? 'armaments' : 'techniques';
  const emptyMessage =
    selectableItems.length === 0
      ? source === 'public'
        ? `No public ${typeLabel} in the community library`
        : `No ${typeLabel} in your library`
      : 'No matching items';
  const emptySubMessage =
    selectableItems.length === 0 && source === 'public' && isPublicError
      ? 'Failed to load Realms Library. Try again later.'
      : selectableItems.length === 0 && source === 'public'
        ? 'Official content can be added by admins via Admin → Realms Library Editor.'
        : selectableItems.length === 0
          ? type === 'power'
            ? 'Create some in the Power Creator first!'
            : type === 'empowered-technique'
              ? 'Create some in the Empowered Technique Creator first!'
              : type === 'technique'
              ? 'Create some in the Technique Creator first!'
              : 'Create some in the Armament Creator first!'
          : undefined;

  return {
    showLoadModal,
    openLoadModal,
    closeLoadModal,
    selectableItems,
    rawItems,
    isLoading,
    error: null,
    source,
    setSource,
    columns,
    gridColumns,
    emptyMessage,
    emptySubMessage,
    isPublicError,
  };
}
