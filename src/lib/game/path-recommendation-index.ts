/**
 * Archetype Path recommendation index (ADR-0014 / TASK-751)
 * =========================================================
 * Resolves the refs authored on `path_data` against the live entity rows so any browse list can
 * filter by "recommended by these paths" without a second dataset. Build it once per list
 * (memoized from the `['codex']` query) and share it between the filter control, the list filter,
 * and the row chips.
 */

import { collectPathRecommendedIds, type PathRecommendationKind } from './archetype-path';
import { indexByNormalizedIds, normalizeId } from '@/lib/utils/normalize-id';
import type { ArchetypeCategory, ArchetypePathData } from '@/types/archetype';

/** One powers browse list covers both bags (there is no separate innate-powers Codex/Library tab). */
export const POWER_LIST_PATH_KINDS = [
  'powers',
  'innatePowers',
] as const satisfies readonly PathRecommendationKind[];

/** Codex mixed equipment covers weapons/armor (`armaments`) and gear (`equipment`). */
export const EQUIPMENT_LIST_PATH_KINDS = [
  'armaments',
  'equipment',
] as const satisfies readonly PathRecommendationKind[];

export type PathRecommendationKindInput =
  | PathRecommendationKind
  | readonly PathRecommendationKind[];

function recommendationKinds(kind: PathRecommendationKindInput): PathRecommendationKind[] {
  return typeof kind === 'string' ? [kind] : [...kind];
}

/** Parsed player-visible path (see `listPlayerVisiblePaths`). */
export interface PathRecommendationSourcePath {
  id: string;
  name: string;
  type: ArchetypeCategory;
  path_data?: ArchetypePathData;
}

/** Any codex/library row a path can recommend (feat, skill, power, technique, item…). */
export interface PathRecommendationEntity {
  id: string | number;
  docId?: string | number | null;
  name?: string | null;
}

/** Path choice for `ArchetypePathFilter` options. */
export interface PathFilterOption {
  id: string;
  name: string;
  type: ArchetypeCategory;
}

export interface PathRecommendationIndex {
  /** Selectable paths, name-sorted. */
  options: PathFilterOption[];
  /** Path id → normalized ids of the entities that path recommends. */
  entityIdsByPathId: Map<string, Set<string>>;
}

export const EMPTY_PATH_RECOMMENDATION_INDEX: PathRecommendationIndex = {
  options: [],
  entityIdsByPathId: new Map(),
};

/**
 * Resolve every path's recommended refs for one kind to normalized entity ids.
 * Refs resolve by id / `docId` first, then by display name (paths are authored by either).
 */
export function buildPathRecommendationIndex({
  paths,
  entities,
  kind,
}: {
  paths: readonly PathRecommendationSourcePath[];
  entities: readonly PathRecommendationEntity[];
  kind: PathRecommendationKindInput;
}): PathRecommendationIndex {
  const byId = indexByNormalizedIds(entities);
  const byName = new Map<string, PathRecommendationEntity>();
  for (const entity of entities) {
    const nameKey = normalizeId(entity.name ?? '');
    if (nameKey && !byName.has(nameKey)) byName.set(nameKey, entity);
  }

  const entityIdsByPathId = new Map<string, Set<string>>();
  const options: PathFilterOption[] = [];
  const kinds = recommendationKinds(kind);

  for (const path of paths) {
    const pathId = String(path.id);
    if (!pathId || entityIdsByPathId.has(pathId)) continue;

    const resolved = new Set<string>();
    for (const recommendationKind of kinds) {
      for (const ref of collectPathRecommendedIds(path.path_data, recommendationKind)) {
        const key = normalizeId(ref);
        const entity = byId.get(key) ?? byName.get(key);
        if (entity) resolved.add(normalizeId(entity.id));
      }
    }

    entityIdsByPathId.set(pathId, resolved);
    // Paths with no seeded recommendations for this kind still list (TASK-423 gaps).
    options.push({ id: pathId, name: path.name, type: path.type });
  }

  options.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  return { options, entityIdsByPathId };
}

/** Union of the entity ids recommended by the selected paths (empty selection → empty set). */
export function pathRecommendedEntityIds(
  index: PathRecommendationIndex,
  selectedPathIds: readonly string[],
): Set<string> {
  const union = new Set<string>();
  for (const pathId of selectedPathIds) {
    const ids = index.entityIdsByPathId.get(String(pathId));
    if (!ids) continue;
    for (const id of ids) union.add(id);
  }
  return union;
}

function entityKeys(
  entityId: string | number | readonly (string | number | null | undefined)[],
): Set<string> {
  const ids = Array.isArray(entityId) ? entityId : [entityId];
  const keys = new Set<string>();
  for (const id of ids) {
    if (id == null || id === '') continue;
    const key = normalizeId(id);
    if (key) keys.add(key);
  }
  return keys;
}

/**
 * True when the row is in the selected-path union. `null` / omitted set = no path filter.
 * Pass id plus `docId` so Library copies resolve the same as official rows.
 */
export function rowMatchesPathRecommendedIds(
  entityId: string | number | readonly (string | number | null | undefined)[],
  pathRecommendedIds: ReadonlySet<string> | null | undefined,
): boolean {
  if (!pathRecommendedIds) return true;
  for (const key of entityKeys(entityId)) {
    if (pathRecommendedIds.has(key)) return true;
  }
  return false;
}

/** Display names of the selected paths that recommend this entity (row chips while filtering). */
export function pathNamesForEntity(
  index: PathRecommendationIndex,
  entityId: string | number | readonly (string | number | null | undefined)[],
  selectedPathIds: readonly string[],
): string[] {
  const keys = entityKeys(entityId);
  if (keys.size === 0 || selectedPathIds.length === 0) return [];

  const selected = new Set(selectedPathIds.map(String));
  return index.options
    .filter((option) => {
      if (!selected.has(option.id)) return false;
      const ids = index.entityIdsByPathId.get(option.id);
      if (!ids) return false;
      for (const key of keys) {
        if (ids.has(key)) return true;
      }
      return false;
    })
    .map((option) => option.name);
}

/** Name-row chips while the path filter is on; `undefined` when there is nothing to show. */
export function pathChipLabelsForEntity(
  index: PathRecommendationIndex,
  entityId: string | number | readonly (string | number | null | undefined)[],
  selectedPathIds: readonly string[],
): string[] | undefined {
  if (selectedPathIds.length === 0) return undefined;
  const names = pathNamesForEntity(index, entityId, selectedPathIds);
  return names.length > 0 ? names : undefined;
}

export function pathFilterEmptyTitle(entityPlural: string): string {
  return `No ${entityPlural} the selected archetype paths recommend match your filters.`;
}

/** Player-visible path ids of one archetype type — See more auto-select (TASK-753). */
export function pathIdsForArchetypeType(
  options: readonly PathFilterOption[],
  type: ArchetypeCategory,
): string[] {
  return options.filter((option) => option.type === type).map((option) => option.id);
}

/** Official / My Library rows: list id plus source `id` / `docId` so copies match the same refs. */
export function libraryRowPathIds(row: {
  id?: string | number;
  raw?: { id?: string | number | null; docId?: string | number | null };
}): Array<string | number | null | undefined> {
  return [row.id, row.raw?.id ?? null, row.raw?.docId ?? null];
}

/** USM / L2 rows: list id plus payload `id` / `docId`. */
export function selectableItemPathIds(item: {
  id?: string | number;
  data?: unknown;
}): Array<string | number | null | undefined> {
  const data = item.data as
    | { id?: string | number | null; docId?: string | number | null }
    | null
    | undefined;
  return libraryRowPathIds({ id: item.id, raw: data ?? undefined });
}

type PathFilterableRow = {
  id: string;
  badges?: Array<{ label: string; color?: string }>;
  showBadgesInName?: boolean;
};

/**
 * Narrow a browse list to the live path union and swap Path/Recommended badges for path-name
 * chips. `null` match set leaves rows unchanged. `keepIds` stay visible so a selected row is
 * not yanked when it falls outside the filter.
 */
export function applyLivePathFilter<T extends PathFilterableRow>(
  items: readonly T[],
  opts: {
    pathMatchIds: ReadonlySet<string> | null;
    pathIndex: PathRecommendationIndex;
    selectedPathIds: readonly string[];
    keepIds?: ReadonlySet<string>;
    idsForItem?: (item: T) => Array<string | number | null | undefined>;
  },
): T[] {
  const { pathMatchIds, pathIndex, selectedPathIds, keepIds } = opts;
  if (!pathMatchIds) return [...items];
  const idsForItem = opts.idsForItem ?? ((item: T) => [item.id]);
  const next: T[] = [];
  for (const item of items) {
    const keys = idsForItem(item);
    const keep = keepIds?.has(String(item.id)) || rowMatchesPathRecommendedIds(keys, pathMatchIds);
    if (!keep) continue;
    const chipLabels = pathChipLabelsForEntity(pathIndex, keys, selectedPathIds);
    next.push({
      ...item,
      badges: chipLabels?.map((label) => ({ label })),
      showBadgesInName: Boolean(chipLabels?.length),
    });
  }
  return next;
}
