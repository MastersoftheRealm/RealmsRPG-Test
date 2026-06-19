/**
 * Codex Archetypes Tab
 * ====================
 * Read-only browse of official archetype paths: name, type, abilities, level 1 and progression summaries.
 */

'use client';

import { useMemo, useState } from 'react';
import {
  SearchInput,
  ListHeader,
  LoadingState,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import type { ColumnValue } from '@/components/shared/grid-list-row';
import { useSort, sortByColumn } from '@/hooks/use-sort';
import { useCodexArchetypes, useCodexFeats, useCodexSkills, useEquipment, useOfficialLibrary } from '@/hooks';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import { formatListCellLabel } from '@/lib/utils';
import type { Archetype, ArchetypePathRecommendations } from '@/types/archetype';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';

const ARCHETYPE_GRID_COLUMNS = '1.4fr 0.9fr 1fr 1.2fr';
const ARCHETYPE_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'type', label: 'TYPE' },
  { key: 'abilities', label: 'ABILITIES' },
  { key: '_desc', label: 'DESCRIPTION', sortable: false as const, align: 'left' as const },
];

function capitalizeAbility(value?: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatAbilityEmphasis(archetype: Archetype): string {
  const primary = archetype.archetype_ability;
  const secondary = archetype.secondary_ability;
  if (archetype.type === 'powered-martial' && primary && secondary) {
    return `${capitalizeAbility(primary)} / ${capitalizeAbility(secondary)}`;
  }
  if (primary) return capitalizeAbility(primary);
  return '-';
}

function buildLookupMaps(
  items: Array<{ id?: string | number; name?: string; docId?: string }>
): { byId: Map<string, string>; byName: Map<string, string> } {
  const byId = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const item of items) {
    const name = String(item.name ?? '').trim();
    if (!name) continue;
    const ids = [item.id, item.docId].filter(Boolean).map(String);
    for (const id of ids) {
      byId.set(id, name);
      byId.set(id.toLowerCase(), name);
    }
    byName.set(name.toLowerCase(), name);
  }
  return { byId, byName };
}

function resolveRefLabel(
  ref: string,
  byId: Map<string, string>,
  byName: Map<string, string>
): string {
  const trimmed = ref.trim();
  const colon = trimmed.indexOf(':');
  const idPart = colon >= 0 ? trimmed.slice(0, colon).trim() : trimmed;
  const qtyPart = colon >= 0 ? trimmed.slice(colon + 1).trim() : '';
  const label =
    byId.get(idPart) ??
    byId.get(idPart.toLowerCase()) ??
    byName.get(idPart.toLowerCase()) ??
    idPart;
  if (qtyPart && Number.parseInt(qtyPart, 10) > 1) {
    return `${label} ×${qtyPart}`;
  }
  return label;
}

function resolveRefList(
  refs: string[] | undefined,
  byId: Map<string, string>,
  byName: Map<string, string>
): string[] {
  if (!refs?.length) return [];
  return refs.map((ref) => resolveRefLabel(ref, byId, byName));
}

function RecommendationSummary({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-sm font-medium text-text-primary mb-1">{title}</h4>
      <ul className="text-sm text-text-secondary space-y-0.5 list-disc list-inside">
        {items.map((item) => (
          <li key={`${title}-${item}`}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function PathRecommendationsBlock({
  heading,
  recommendations,
  lookups,
}: {
  heading: string;
  recommendations: ArchetypePathRecommendations | undefined;
  lookups: {
    feats: ReturnType<typeof buildLookupMaps>;
    skills: ReturnType<typeof buildLookupMaps>;
    equipment: ReturnType<typeof buildLookupMaps>;
    powers: ReturnType<typeof buildLookupMaps>;
    techniques: ReturnType<typeof buildLookupMaps>;
  };
}) {
  if (!recommendations) return null;

  const resolved = {
    feats: resolveRefList(recommendations.feats, lookups.feats.byId, lookups.feats.byName),
    skills: resolveRefList(recommendations.skills, lookups.skills.byId, lookups.skills.byName),
    powers: resolveRefList(recommendations.powers, lookups.powers.byId, lookups.powers.byName),
    techniques: resolveRefList(
      recommendations.techniques,
      lookups.techniques.byId,
      lookups.techniques.byName
    ),
    armaments: resolveRefList(
      recommendations.armaments,
      lookups.equipment.byId,
      lookups.equipment.byName
    ),
    equipment: resolveRefList(
      recommendations.equipment,
      lookups.equipment.byId,
      lookups.equipment.byName
    ),
  };

  const hasLists = Object.values(resolved).some((list) => list.length > 0);
  const notes = recommendations.notes?.trim();

  if (!hasLists && !notes) return null;

  return (
    <div className="rounded-lg border border-border-light bg-surface-alt p-4 space-y-3">
      <h3 className="text-base font-semibold text-text-primary">{heading}</h3>
      {notes ? (
        <p className="text-sm text-text-primary whitespace-pre-wrap border-l-2 border-primary-300 dark:border-primary-700 pl-3">
          {notes}
        </p>
      ) : null}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <RecommendationSummary title="Feats" items={resolved.feats} />
        <RecommendationSummary title="Skills" items={resolved.skills} />
        <RecommendationSummary title="Powers" items={resolved.powers} />
        <RecommendationSummary title="Techniques" items={resolved.techniques} />
        <RecommendationSummary title="Armaments" items={resolved.armaments} />
        <RecommendationSummary title="Equipment" items={resolved.equipment} />
      </div>
    </div>
  );
}

function ArchetypePathCard({
  archetype,
  lookups,
}: {
  archetype: Archetype;
  lookups: {
    feats: ReturnType<typeof buildLookupMaps>;
    skills: ReturnType<typeof buildLookupMaps>;
    equipment: ReturnType<typeof buildLookupMaps>;
    powers: ReturnType<typeof buildLookupMaps>;
    techniques: ReturnType<typeof buildLookupMaps>;
  };
}) {
  const columns: ColumnValue[] = [
    { key: 'type', value: formatListCellLabel(archetype.type) },
    { key: 'abilities', value: formatAbilityEmphasis(archetype) },
    {
      key: '_desc',
      value: archetype.description
        ? archetype.description.length > 72
          ? `${archetype.description.substring(0, 72)}…`
          : archetype.description
        : '-',
      align: 'left',
    },
  ];

  const progressionLevels = archetype.path_data?.levels ?? [];

  return (
    <GridListRow
      id={archetype.id}
      name={archetype.name}
      description={archetype.description}
      gridColumns={ARCHETYPE_GRID_COLUMNS}
      columns={columns}
      badges={[{ label: 'Archetype Path', color: 'purple' }]}
      expandedContent={
        <div className="space-y-4">
          {archetype.description ? (
            <p className="text-text-secondary">{archetype.description}</p>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="font-medium text-text-primary">Type: </span>
              <span className="text-text-secondary">{formatListCellLabel(archetype.type)}</span>
            </div>
            <div>
              <span className="font-medium text-text-primary">Abilities: </span>
              <span className="text-text-secondary">{formatAbilityEmphasis(archetype)}</span>
            </div>
            {archetype.power_prof_start != null && (
              <div>
                <span className="font-medium text-text-primary">Power prof (start): </span>
                <span className="text-text-secondary">{archetype.power_prof_start}</span>
              </div>
            )}
            {archetype.martial_prof_start != null && (
              <div>
                <span className="font-medium text-text-primary">Martial prof (start): </span>
                <span className="text-text-secondary">{archetype.martial_prof_start}</span>
              </div>
            )}
          </div>

          <PathRecommendationsBlock
            heading="Level 1 recommendations"
            recommendations={archetype.path_data?.level1}
            lookups={lookups}
          />

          {progressionLevels.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-text-primary">Level-up progression</h3>
              {progressionLevels.map((levelRow) => (
                <PathRecommendationsBlock
                  key={`level-${levelRow.level}`}
                  heading={`Level ${levelRow.level}`}
                  recommendations={levelRow}
                  lookups={lookups}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-muted dark:text-text-secondary">
              No level 2+ progression entries in the codex for this path.
            </p>
          )}
        </div>
      }
    />
  );
}

interface CodexArchetypesTabProps {
  codexMode: 'public' | 'my';
}

export function CodexArchetypesTab({ codexMode }: CodexArchetypesTabProps) {
  const loadPublicCodex = codexMode === 'public';
  const [search, setSearch] = useState('');
  const { data: archetypes = [], isLoading, error } = useCodexArchetypes({ enabled: loadPublicCodex });
  const { data: feats = [] } = useCodexFeats({ enabled: loadPublicCodex });
  const { data: skills = [] } = useCodexSkills({ enabled: loadPublicCodex });
  const { data: equipment = [] } = useEquipment({ enabled: loadPublicCodex });
  const { data: publicPowers = [] } = useOfficialLibrary('powers', { enabled: loadPublicCodex });
  const { data: publicTechniques = [] } = useOfficialLibrary('techniques', { enabled: loadPublicCodex });
  const { data: publicItems = [] } = useOfficialLibrary('items', { enabled: loadPublicCodex });

  const lookups = useMemo(
    () => ({
      feats: buildLookupMaps(feats),
      skills: buildLookupMaps(skills),
      equipment: buildLookupMaps([...equipment, ...publicItems]),
      powers: buildLookupMaps(publicPowers),
      techniques: buildLookupMaps(publicTechniques),
    }),
    [feats, skills, equipment, publicPowers, publicTechniques, publicItems]
  );

  const pathArchetypes = useMemo(
    () =>
      (archetypes as Archetype[])
        .map((archetype) => ({
          ...archetype,
          path_data: parseArchetypePathData(archetype.path_data),
        }))
        .filter((archetype) => pathHasPlayerVisibleLevel1(archetype.path_data)),
    [archetypes]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return pathArchetypes;
    return pathArchetypes.filter(
      (archetype) =>
        archetype.name.toLowerCase().includes(query) ||
        (archetype.description ?? '').toLowerCase().includes(query) ||
        archetype.type.toLowerCase().includes(query)
    );
  }, [pathArchetypes, search]);

  const { sortState, handleSort } = useSort('name');
  const sorted = useMemo(() => {
    if (sortState.col === 'abilities') {
      return [...filtered].sort(
        (a, b) => sortState.dir * formatAbilityEmphasis(a).localeCompare(formatAbilityEmphasis(b))
      );
    }
    if (sortState.col === '_desc') {
      return [...filtered].sort(
        (a, b) =>
          sortState.dir *
          String(a.description ?? '').localeCompare(String(b.description ?? ''), undefined, {
            numeric: true,
          })
      );
    }
    return sortByColumn(filtered, sortState);
  }, [filtered, sortState]);

  if (codexMode === 'my') {
    return <CodexMyCodexEmpty />;
  }

  if (isLoading) return <LoadingState message="Loading archetype paths…" />;
  if (error) return <ErrorState message={error.message} />;

  return (
    <div>
      <div className="mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search archetype paths…"
          aria-label="Search archetype paths"
        />
      </div>

      <ListHeader
        columns={ARCHETYPE_COLUMNS}
        gridColumns={ARCHETYPE_GRID_COLUMNS}
        sortState={sortState}
        onSort={handleSort}
      />

      {sorted.length === 0 ? (
        <p className="text-text-secondary py-8 text-center">No archetype paths match your search.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((archetype) => (
            <ArchetypePathCard key={archetype.id} archetype={archetype} lookups={lookups} />
          ))}
        </div>
      )}
    </div>
  );
}
