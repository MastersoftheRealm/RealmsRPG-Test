import { describe, expect, it } from 'vitest';
import { listPlayerVisiblePaths } from '@/lib/game/archetype-edit';
import { collectPathRecommendedIds, parseArchetypePathData } from '@/lib/game/archetype-path';
import {
  applyLivePathFilter,
  buildPathRecommendationIndex,
  pathIdsForArchetypeType,
  pathNamesForEntity,
  pathRecommendedEntityIds,
  rowMatchesPathRecommendedIds,
  type PathRecommendationSourcePath,
} from '@/lib/game/path-recommendation-index';
import type { Archetype } from '@/types';

const FEATS = [
  { id: '10', name: 'Flurry' },
  { id: '11', name: 'Iron Body' },
  { id: '12', name: 'Reckless Swing' },
  { id: '13', name: 'Second Wind' },
  { id: '14', name: 'Unarmed Prowess' },
];

/** Admin-shaped raw `path_data` → parsed, like a codex row arriving from `['codex']`. */
function path(
  id: string,
  name: string,
  type: PathRecommendationSourcePath['type'],
  rawPathData: unknown
): PathRecommendationSourcePath {
  return { id, name, type, path_data: parseArchetypePathData(rawPathData) };
}

const monk = path('p-monk', 'Monk', 'martial', {
  level1: { feats: ['10', '13'], removeFeats: ['12'] },
  levels: [{ level: 5, feats: ['11'] }],
});

const berserker = path('p-berserker', 'Berserker', 'martial', {
  level1: {
    feats: ['12'],
    guidance_groups: [{ id: 'g1', title: 'Devastating strikes', feats: ['13'] }],
  },
});

describe('collectPathRecommendedIds', () => {
  it('unions every authoring level and guidance groups, excluding remove_* lists', () => {
    expect(collectPathRecommendedIds(monk.path_data, 'feats').sort()).toEqual(['10', '11', '13']);
    expect(collectPathRecommendedIds(berserker.path_data, 'feats').sort()).toEqual(['12', '13']);
  });

  it('collapses id:qty refs and dedupes repeated ids', () => {
    const gear = path('p-gear', 'Gear', 'martial', {
      level1: { equipment: ['torch:5', 'rope'] },
      levels: [{ level: 5, equipment: ['torch:2'] }],
    });
    expect(collectPathRecommendedIds(gear.path_data, 'equipment')).toEqual(['torch', 'rope']);
  });

  it('returns nothing for an unparsed / empty path', () => {
    expect(collectPathRecommendedIds(undefined, 'feats')).toEqual([]);
    expect(collectPathRecommendedIds(parseArchetypePathData({}), 'skills')).toEqual([]);
  });
});

describe('buildPathRecommendationIndex', () => {
  const index = buildPathRecommendationIndex({
    paths: [monk, berserker],
    entities: FEATS,
    kind: 'feats',
  });

  it('matches the union of the selected paths', () => {
    expect([...pathRecommendedEntityIds(index, ['p-monk'])].sort()).toEqual(['10', '11', '13']);
    expect([...pathRecommendedEntityIds(index, ['p-monk', 'p-berserker'])].sort()).toEqual([
      '10',
      '11',
      '12',
      '13',
    ]);
  });

  it('treats no selection as no matches (callers skip the filter entirely)', () => {
    expect(pathRecommendedEntityIds(index, []).size).toBe(0);
  });

  it('resolves refs by id and falls back to display name', () => {
    const byName = buildPathRecommendationIndex({
      paths: [path('p-name', 'By name', 'martial', { level1: { feats: ['Unarmed Prowess', '10'] } })],
      entities: FEATS,
      kind: 'feats',
    });
    expect([...pathRecommendedEntityIds(byName, ['p-name'])].sort()).toEqual(['10', '14']);
  });

  it('drops refs that match no live entity', () => {
    const stale = buildPathRecommendationIndex({
      paths: [path('p-stale', 'Stale', 'martial', { level1: { feats: ['999', '10'] } })],
      entities: FEATS,
      kind: 'feats',
    });
    expect([...pathRecommendedEntityIds(stale, ['p-stale'])]).toEqual(['10']);
  });

  it('lists paths that recommend nothing for this kind (TASK-423 seed gaps)', () => {
    const empty = buildPathRecommendationIndex({
      paths: [monk, path('p-empty', 'Unseeded', 'power', { level1: { powers: ['1'] } })],
      entities: FEATS,
      kind: 'feats',
    });
    expect(empty.options.map((o) => o.id)).toContain('p-empty');
    expect(pathRecommendedEntityIds(empty, ['p-empty']).size).toBe(0);
  });

  it('reflects an admin path_data edit on rebuild — no second store to sync', () => {
    const edited = buildPathRecommendationIndex({
      paths: [path('p-monk', 'Monk', 'martial', { level1: { feats: ['10', '12'] } })],
      entities: FEATS,
      kind: 'feats',
    });
    expect([...pathRecommendedEntityIds(edited, ['p-monk'])].sort()).toEqual(['10', '12']);
  });

  it('names only the selected paths that recommend the entity', () => {
    expect(pathNamesForEntity(index, '13', ['p-monk', 'p-berserker'])).toEqual([
      'Berserker',
      'Monk',
    ]);
    expect(pathNamesForEntity(index, '10', ['p-berserker'])).toEqual([]);
    expect(pathNamesForEntity(index, '10', [])).toEqual([]);
  });

  it('unions powers + innatePowers kinds on one powers browse list', () => {
    const entities = [
      { id: 'p1', name: 'Bolt' },
      { id: 'p2', name: 'Ward' },
    ];
    const mixed = buildPathRecommendationIndex({
      paths: [
        path('p-mage', 'Mage', 'power', {
          level1: { powers: ['p1'], innatePowers: ['p2'] },
        }),
      ],
      entities,
      kind: ['powers', 'innatePowers'],
    });
    expect([...pathRecommendedEntityIds(mixed, ['p-mage'])].sort()).toEqual(['p1', 'p2']);
    expect(
      [...pathRecommendedEntityIds(
        buildPathRecommendationIndex({
          paths: [
            path('p-mage', 'Mage', 'power', {
              level1: { powers: ['p1'], innatePowers: ['p2'] },
            }),
          ],
          entities,
          kind: 'powers',
        }),
        ['p-mage']
      )]
    ).toEqual(['p1']);
  });

  it('unions armaments + equipment kinds on the mixed Codex equipment list', () => {
    const mixed = buildPathRecommendationIndex({
      paths: [
        path('p-gear', 'Gear', 'martial', {
          level1: { armaments: ['sword:1'], equipment: ['torch:2'] },
        }),
      ],
      entities: [
        { id: 'sword', name: 'Sword' },
        { id: 'torch', name: 'Torch' },
      ],
      kind: ['armaments', 'equipment'],
    });
    expect([...pathRecommendedEntityIds(mixed, ['p-gear'])].sort()).toEqual(['sword', 'torch']);
  });

  it('omits paths hidden from the player picker', () => {
    const codexRows = [
      { id: 'p-monk', name: 'Monk', type: 'martial', path_data: { level1: { feats: ['10'] } } },
      {
        id: 'p-admin',
        name: 'Admin only',
        type: 'martial',
        path_data: { level1: { removeFeats: ['10'], notes: 'internal' } },
      },
    ] as unknown as Archetype[];

    const visible = listPlayerVisiblePaths(codexRows).map((p) => ({
      id: String(p.id),
      name: p.name,
      type: p.type,
      path_data: parseArchetypePathData(p.path_data),
    }));
    const hiddenAware = buildPathRecommendationIndex({
      paths: visible,
      entities: FEATS,
      kind: 'feats',
    });

    expect(hiddenAware.options.map((o) => o.id)).toEqual(['p-monk']);
  });

  it('lists player-visible path ids of one archetype type for See more auto-select', () => {
    const mixed = buildPathRecommendationIndex({
      paths: [
        monk,
        berserker,
        path('p-mage', 'Mage', 'power', { level1: { feats: ['10'] } }),
      ],
      entities: FEATS,
      kind: 'feats',
    });
    expect(pathIdsForArchetypeType(mixed.options, 'martial').sort()).toEqual([
      'p-berserker',
      'p-monk',
    ]);
    expect(pathIdsForArchetypeType(mixed.options, 'power')).toEqual(['p-mage']);
    expect(pathIdsForArchetypeType(mixed.options, 'powered-martial')).toEqual([]);
  });

  it('matches a row by id or docId against the resolved set', () => {
    const ids = pathRecommendedEntityIds(index, ['p-monk']);
    expect(rowMatchesPathRecommendedIds('10', ids)).toBe(true);
    expect(rowMatchesPathRecommendedIds(['copy', '10'], ids)).toBe(true);
    expect(rowMatchesPathRecommendedIds('12', ids)).toBe(false);
    expect(rowMatchesPathRecommendedIds('10', null)).toBe(true);
  });

  it('applies live path filter chips and keeps selected rows that miss the union', () => {
    const ids = pathRecommendedEntityIds(index, ['p-monk']);
    type Row = { id: string; badges?: Array<{ label: string }>; showBadgesInName?: boolean };
    const rows = applyLivePathFilter<Row>(
      [
        { id: '10', badges: [{ label: 'Path' }] },
        { id: '12', badges: [{ label: 'Path' }] },
        { id: 'picked', badges: [{ label: 'Path' }] },
      ],
      {
        pathMatchIds: ids,
        pathIndex: index,
        selectedPathIds: ['p-monk'],
        keepIds: new Set(['picked']),
      }
    );
    expect(rows.map((r) => r.id)).toEqual(['10', 'picked']);
    expect(rows[0]?.badges).toEqual([{ label: 'Monk' }]);
    expect(rows[0]?.showBadgesInName).toBe(true);
    expect(rows[1]?.badges).toBeUndefined();
  });
});
