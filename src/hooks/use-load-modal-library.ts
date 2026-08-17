/**
 * useLoadModalLibrary — Unified load-from-library state for standalone creators.
 * Power/technique/item/empowered share selectable builders; species/creature use
 * entity-specific row builders with the same modal chrome (source filter, empty copy).
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  useUserPowers,
  useUserTechniques,
  useUserEmpoweredTechniques,
  useUserItems,
  useUserSpecies,
  useUserCreatures,
} from './use-user-library';
import { useOfficialLibrary } from './use-official-library';
import {
  useCodexPowerParts,
  useCodexTechniqueParts,
  useCodexItemProperties,
  useCodexSpecies,
} from './use-codex';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import {
  buildSelectableItem,
  getListHeaderColumns,
  getModalGridColumns,
  EMPOWERED_POWER_COLUMNS,
  type LibraryItemType,
  type EqItem,
} from '@/lib/library-selectable-builders';
import {
  normalizePublicPower,
  normalizePublicTechnique,
  normalizePublicItem,
} from './add-library-item/normalize-public';
import { buildEmpoweredPowerSelectableItem } from './add-library-item/build-empowered-selectable-item';
import {
  buildCreatureSelectableItem,
  buildSpeciesSelectableItem,
} from '@/lib/library/creator-load-selectables';
import type {
  UserPower,
  UserTechnique,
  UserItem,
  UserSpecies,
  UserCreature,
} from './use-user-library';

export type LoadModalLibraryType =
  | 'power'
  | 'technique'
  | 'empowered-technique'
  | 'item'
  | 'species'
  | 'creature';

export type LoadModalArmamentKind = 'weapon' | 'armor' | 'shield';

export type UseLoadModalLibraryOptions = {
  /**
   * Keep library rows fetching while the load modal is closed
   * (e.g. creature `?edit=` preload). Default false for species/creature;
   * power/technique/item/empowered always fetch.
   */
  prefetch?: boolean;
  /** Armament creator Load: filter + catalog chrome for one kind (no mixed Stat list). */
  itemKind?: LoadModalArmamentKind;
};

export interface UseLoadModalLibraryReturn {
  showLoadModal: boolean;
  openLoadModal: () => void;
  closeLoadModal: () => void;
  selectableItems: SelectableItem[];
  /** Raw merged items (user + public by source) for ?edit= lookup */
  rawItems: unknown[];
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

export function useLoadModalLibrary(
  type: LoadModalLibraryType,
  options?: UseLoadModalLibraryOptions,
): UseLoadModalLibraryReturn {
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [source, setSource] = useState<SourceFilterValue>('all');
  const itemKind: LoadModalArmamentKind = options?.itemKind ?? 'weapon';

  const openLoadModal = useCallback(() => setShowLoadModal(true), []);
  const closeLoadModal = useCallback(() => {
    setShowLoadModal(false);
    setSource('all');
  }, []);

  const needPowers = type === 'power';
  const needTechniques = type === 'technique';
  const needEmpowered = type === 'empowered-technique';
  const needItems = type === 'item';
  const needSpecies = type === 'species';
  const needCreatures = type === 'creature';

  const alwaysFetch = needPowers || needTechniques || needEmpowered || needItems;
  const fetchEnabled = alwaysFetch || showLoadModal || !!options?.prefetch;

  const { data: userPowers = [], isLoading: powersLoading } = useUserPowers({
    enabled: needPowers && fetchEnabled,
  });
  const { data: userTechniques = [], isLoading: techniquesLoading } = useUserTechniques({
    enabled: needTechniques && fetchEnabled,
  });
  const { data: userEmpoweredTechniques = [], isLoading: empoweredTechniquesLoading } =
    useUserEmpoweredTechniques({ enabled: needEmpowered && fetchEnabled });
  const { data: userItems = [], isLoading: itemsLoading } = useUserItems({
    enabled: needItems && fetchEnabled,
  });
  const { data: userSpeciesList = [], isLoading: userSpeciesLoading } = useUserSpecies({
    enabled: needSpecies && fetchEnabled,
  });
  const { data: userCreatures = [], isLoading: userCreaturesLoading } = useUserCreatures({
    enabled: needCreatures && fetchEnabled,
  });

  const {
    data: publicPowers = [],
    isLoading: publicPowersLoading,
    isError: publicPowersError,
  } = useOfficialLibrary('powers', { enabled: needPowers && fetchEnabled });
  const {
    data: publicTechniques = [],
    isLoading: publicTechniquesLoading,
    isError: publicTechniquesError,
  } = useOfficialLibrary('techniques', { enabled: needTechniques && fetchEnabled });
  const {
    data: publicEmpoweredTechniques = [],
    isLoading: publicEmpoweredTechniquesLoading,
    isError: publicEmpoweredTechniquesError,
  } = useOfficialLibrary('empowered-techniques', { enabled: needEmpowered && fetchEnabled });
  const {
    data: publicItems = [],
    isLoading: publicItemsLoading,
    isError: publicItemsError,
  } = useOfficialLibrary('items', { enabled: needItems && fetchEnabled });
  const {
    data: publicSpecies = [],
    isLoading: publicSpeciesLoading,
    isError: publicSpeciesError,
  } = useOfficialLibrary('species', { enabled: needSpecies && fetchEnabled });
  const {
    data: publicCreatures = [],
    isLoading: publicCreaturesLoading,
    isError: publicCreaturesError,
  } = useOfficialLibrary('creatures', { enabled: needCreatures && fetchEnabled });

  const { data: codexSpecies = [] } = useCodexSpecies({ enabled: needSpecies && fetchEnabled });
  const { data: powerPartsDb = [] } = useCodexPowerParts({
    enabled: (needPowers || needEmpowered) && fetchEnabled,
  });
  const { data: techniquePartsDb = [] } = useCodexTechniqueParts({
    enabled: (needTechniques || needEmpowered) && fetchEnabled,
  });
  const { data: itemPropertiesDb = [] } = useCodexItemProperties({
    enabled: needItems && fetchEnabled,
  });

  const codex = useMemo(
    () => ({
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
    }),
    [powerPartsDb, techniquePartsDb, itemPropertiesDb],
  );

  const { selectableItems, rawItems, isLoading, isPublicError } = useMemo(() => {
    const publicError =
      (type === 'power' && publicPowersError) ||
      (type === 'technique' && publicTechniquesError) ||
      (type === 'empowered-technique' && publicEmpoweredTechniquesError) ||
      (type === 'item' && publicItemsError) ||
      (type === 'species' && publicSpeciesError) ||
      (type === 'creature' && publicCreaturesError);

    if (type === 'power') {
      const my =
        source === 'my' || source === 'all'
          ? (userPowers as (UserPower | UserTechnique | UserItem | EqItem)[])
          : [];
      const pub =
        source === 'public' || source === 'all' ? publicPowers.map(normalizePublicPower) : [];
      const raw = [...my, ...pub];
      const loading =
        (source !== 'public' && powersLoading) || (source !== 'my' && publicPowersLoading);
      const items = raw.map((item) => buildSelectableItem(item, 'power', codex));
      return {
        selectableItems: items,
        rawItems: raw,
        isLoading: loading,
        isPublicError: !!publicError,
      };
    }

    if (type === 'technique') {
      const my =
        source === 'my' || source === 'all'
          ? (userTechniques as (UserPower | UserTechnique | UserItem | EqItem)[])
          : [];
      const pub =
        source === 'public' || source === 'all'
          ? publicTechniques.map(normalizePublicTechnique)
          : [];
      const raw = [...my, ...pub];
      const loading =
        (source !== 'public' && techniquesLoading) || (source !== 'my' && publicTechniquesLoading);
      const items = raw.map((item) => buildSelectableItem(item, 'technique', codex));
      return {
        selectableItems: items,
        rawItems: raw,
        isLoading: loading,
        isPublicError: !!publicError,
      };
    }

    if (type === 'empowered-technique') {
      const my =
        source === 'my' || source === 'all' ? (userEmpoweredTechniques as UserTechnique[]) : [];
      const pub =
        source === 'public' || source === 'all'
          ? publicEmpoweredTechniques.map(normalizePublicTechnique)
          : [];
      const raw = [...my, ...pub];
      const loading =
        (source !== 'public' && empoweredTechniquesLoading) ||
        (source !== 'my' && publicEmpoweredTechniquesLoading);
      const items = raw.map((item) =>
        buildEmpoweredPowerSelectableItem(item, {
          powerPartsDb: codex.powerPartsDb,
          techniquePartsDb: codex.techniquePartsDb,
        }),
      );
      return {
        selectableItems: items,
        rawItems: raw,
        isLoading: loading,
        isPublicError: !!publicError,
      };
    }

    if (type === 'species') {
      const items: SelectableItem[] = [];
      const raw: unknown[] = [];
      if (source === 'my' || source === 'all') {
        (userSpeciesList as UserSpecies[]).forEach((s) => {
          items.push(buildSpeciesSelectableItem(s, 'my'));
          raw.push(s);
        });
      }
      if (source === 'public' || source === 'all') {
        publicSpecies.forEach((s) => {
          items.push(buildSpeciesSelectableItem(s as { id?: string; name?: string }, 'public'));
          raw.push(s);
        });
        codexSpecies.forEach((s) => {
          items.push(buildSpeciesSelectableItem(s as { id?: string; name?: string }, 'public'));
          raw.push(s);
        });
      }
      const seen = new Set<string>();
      const selectable = items.filter((item) => {
        const key = `${item.name}:${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      const loading =
        (source !== 'public' && userSpeciesLoading) || (source !== 'my' && publicSpeciesLoading);
      return {
        selectableItems: selectable,
        rawItems: raw,
        isLoading: loading,
        isPublicError: !!publicError,
      };
    }

    if (type === 'creature') {
      const my = source === 'my' || source === 'all' ? (userCreatures as UserCreature[]) : [];
      const pub = source === 'public' || source === 'all' ? publicCreatures : [];
      const raw = [...my, ...pub];
      const loading =
        (source !== 'public' && userCreaturesLoading) ||
        (source !== 'my' && publicCreaturesLoading);
      const items = raw.map((c) => buildCreatureSelectableItem(c));
      return {
        selectableItems: items,
        rawItems: raw,
        isLoading: loading,
        isPublicError: !!publicError,
      };
    }

    const my =
      source === 'my' || source === 'all'
        ? (userItems as UserItem[]).filter((i) =>
            ['weapon', 'armor', 'shield'].includes((i.type || '').toLowerCase()),
          )
        : [];
    const pub =
      source === 'public' || source === 'all'
        ? publicItems
            .filter((i) => ['weapon', 'armor', 'shield'].includes((i.type || '').toLowerCase()))
            .map(normalizePublicItem)
        : [];
    const raw = [...my, ...pub] as (UserPower | UserTechnique | UserItem | EqItem)[];
    const loading =
      (source !== 'public' && itemsLoading) || (source !== 'my' && publicItemsLoading);
    const items = raw
      .filter((item) => String((item as EqItem).type ?? '').toLowerCase() === itemKind)
      .map((item) => buildSelectableItem(item, itemKind, codex));
    return {
      selectableItems: items,
      rawItems: raw,
      isLoading: loading,
      isPublicError: !!publicError,
    };
  }, [
    type,
    source,
    itemKind,
    userPowers,
    userTechniques,
    userEmpoweredTechniques,
    userItems,
    userSpeciesList,
    userCreatures,
    publicPowers,
    publicTechniques,
    publicEmpoweredTechniques,
    publicItems,
    publicSpecies,
    publicCreatures,
    codexSpecies,
    powersLoading,
    techniquesLoading,
    empoweredTechniquesLoading,
    itemsLoading,
    userSpeciesLoading,
    userCreaturesLoading,
    publicPowersLoading,
    publicTechniquesLoading,
    publicEmpoweredTechniquesLoading,
    publicItemsLoading,
    publicSpeciesLoading,
    publicCreaturesLoading,
    publicPowersError,
    publicTechniquesError,
    publicEmpoweredTechniquesError,
    publicItemsError,
    publicSpeciesError,
    publicCreaturesError,
    codex,
  ]);

  const columns =
    type === 'empowered-technique'
      ? EMPOWERED_POWER_COLUMNS
      : type === 'species'
        ? [
            { key: 'name', label: 'Name' },
            { key: 'Type', label: 'Type', sortable: true },
          ]
        : type === 'creature'
          ? [
              { key: 'name', label: 'Name', sortable: true },
              { key: 'level', label: 'Level', sortable: true },
              { key: 'type', label: 'Type', sortable: true },
            ]
          : getListHeaderColumns(type === 'item' ? itemKind : (type as LibraryItemType));

  const gridColumns =
    type === 'empowered-technique'
      ? getModalGridColumns('power')
      : type === 'species'
        ? '1.4fr 0.8fr'
        : type === 'creature'
          ? '1.5fr 0.5fr 1fr'
          : getModalGridColumns(type === 'item' ? itemKind : (type as LibraryItemType));

  const typeLabel =
    type === 'power'
      ? 'powers'
      : type === 'item'
        ? itemKind === 'armor'
          ? 'armor'
          : `${itemKind}s`
        : type === 'empowered-technique'
          ? 'empowered techniques'
          : type === 'species'
            ? 'species'
            : type === 'creature'
              ? 'creatures'
              : 'techniques';

  const emptyMessage =
    selectableItems.length === 0
      ? source === 'public'
        ? type === 'species'
          ? 'No species in the Realms Library'
          : type === 'creature'
            ? 'No public creatures in the Realms Library'
            : `No public ${typeLabel} in the community library`
        : source === 'my'
          ? type === 'species'
            ? 'No species in your library'
            : `No ${typeLabel} in your library`
          : `No ${typeLabel} found`
      : type === 'species'
        ? 'No matching species'
        : type === 'creature'
          ? 'No matching creatures'
          : 'No matching items';

  const emptySubMessage =
    selectableItems.length === 0 && source === 'public' && isPublicError
      ? 'Failed to load Realms Library. Try again later.'
      : selectableItems.length === 0 && source === 'public'
        ? type === 'species'
          ? undefined
          : type === 'creature'
            ? 'Official creatures can be added by admins via Admin → Realms Library Editor.'
            : 'Official content can be added by admins via Admin → Realms Library Editor.'
        : selectableItems.length === 0 && source === 'my' && type === 'species'
          ? 'Save a species to My Codex first.'
          : selectableItems.length === 0 && type === 'creature' && source !== 'public'
            ? 'Create a creature and save it to your library first.'
            : selectableItems.length === 0
              ? type === 'power'
                ? 'Create some in the Power Creator first!'
                : type === 'empowered-technique'
                  ? 'Create some in the Empowered Technique Creator first!'
                  : type === 'technique'
                    ? 'Create some in the Technique Creator first!'
                    : type === 'item'
                      ? 'Create some in the Armament Creator first!'
                      : undefined
              : undefined;

  const error =
    source === 'public' && isPublicError
      ? new Error('Failed to load Realms Library. Try again later.')
      : null;

  return {
    showLoadModal,
    openLoadModal,
    closeLoadModal,
    selectableItems,
    rawItems,
    isLoading,
    error,
    source,
    setSource,
    columns,
    gridColumns,
    emptyMessage,
    emptySubMessage,
    isPublicError,
  };
}
