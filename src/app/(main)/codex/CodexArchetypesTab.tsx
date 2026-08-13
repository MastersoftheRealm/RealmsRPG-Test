/**
 * Codex Archetypes Tab
 * ====================
 * Read-only browse of official archetype paths: name, type, abilities, level 1 and progression summaries.
 */

'use client';

import { useMemo, useState } from 'react';
import {
  CodexBrowseListShell,
  ErrorDisplay as ErrorState,
  GridListRow,
} from '@/components/shared';
import type { ColumnValue } from '@/components/shared/grid-list-row';
import { useSort, sortByColumn } from '@/hooks/use-sort';
import { useCodexArchetypes, useCodexFeats, useCodexSkills, useEquipment, useOfficialLibrary } from '@/hooks';
import { parseArchetypePathData, pathHasPlayerVisibleLevel1 } from '@/lib/game/archetype-path';
import {
  formatListCellLabel,
  capitalize,
  indexDisplayNamesByNormalizedIds,
  resolveNormalizedRefList,
} from '@/lib/utils';
import type { Archetype, ArchetypePathRecommendations } from '@/types/archetype';
import { CodexMyCodexEmpty } from './CodexMyCodexEmpty';

const ARCHETYPE_GRID_COLUMNS = '1.4fr 0.9fr 1fr 1.2fr';
const ARCHETYPE_COLUMNS = [
  { key: 'name', label: 'NAME' },
  { key: 'type', label: 'TYPE' },
  { key: 'abilities', label: 'ABILITIES' },
  { key: '_desc', label: 'DESCRIPTION', align: 'left' as const },
];

function formatAbilityEmphasis(archetype: Archetype): string {
  const primary = archetype.archetype_ability;
  const secondary = archetype.secondary_ability;
  if (archetype.type === 'powered-martial' && primary && secondary) {
    return `${capitalize(primary)} / ${capitalize(secondary)}`;
  }
  if (primary) return capitalize(primary);
  return '-';
}

type PathLookups = {
  feats: ReturnType<typeof indexDisplayNamesByNormalizedIds>;
  skills: ReturnType<typeof indexDisplayNamesByNormalizedIds>;
  equipment: ReturnType<typeof indexDisplayNamesByNormalizedIds>;
  powers: ReturnType<typeof indexDisplayNamesByNormalizedIds>;
  techniques: ReturnType<typeof indexDisplayNamesByNormalizedIds>;
};

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
  lookups: PathLookups;
}) {
  if (!recommendations) return null;

  const resolved = {
    feats: resolveNormalizedRefList(recommendations.feats, lookups.feats.byId, lookups.feats.byName),
    skills: resolveNormalizedRefList(recommendations.skills, lookups.skills.byId, lookups.skills.byName),
    powers: resolveNormalizedRefList(recommendations.powers, lookups.powers.byId, lookups.powers.byName),
    techniques: resolveNormalizedRefList(
      recommendations.techniques,
      lookups.techniques.byId,
      lookups.techniques.byName
    ),
    armaments: resolveNormalizedRefList(
      recommendations.armaments,
      lookups.equipment.byId,
      lookups.equipment.byName
    ),
    equipment: resolveNormalizedRefList(
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
        <p className="text-sm text-text-primary whitespace-pre-wrap border-l-2 border-primary-subtle-border pl-3">
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
  lookups: PathLookups;
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

  const pathData = parseArchetypePathData(archetype.path_data);
  const progressionLevels = pathData?.levels ?? [];

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
            recommendations={pathData?.level1}
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
      feats: indexDisplayNamesByNormalizedIds(feats),
      skills: indexDisplayNamesByNormalizedIds(skills),
      equipment: indexDisplayNamesByNormalizedIds([...equipment, ...publicItems]),
      powers: indexDisplayNamesByNormalizedIds(publicPowers),
      techniques: indexDisplayNamesByNormalizedIds(publicTechniques),
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

  if (error) return <ErrorState message={error.message} />;

  return (
    <CodexBrowseListShell
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search archetype paths…"
      searchAriaLabel="Search archetype paths"
      headerColumns={ARCHETYPE_COLUMNS}
      gridColumns={ARCHETYPE_GRID_COLUMNS}
      sortState={sortState}
      onSort={handleSort}
      isLoading={isLoading}
      loadingMessage="Loading archetype paths…"
      isEmpty={sorted.length === 0}
      emptyTitle="No archetype paths match your search."
    >
      <div className="space-y-2">
        {sorted.map((archetype) => (
          <ArchetypePathCard key={archetype.id} archetype={archetype} lookups={lookups} />
        ))}
      </div>
    </CodexBrowseListShell>
  );
}
