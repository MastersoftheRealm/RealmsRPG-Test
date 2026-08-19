import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/server', () => ({
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/game/archetype-display', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/game/archetype-display')>();
  return {
    ...actual,
    fetchCodexArchetypeById: vi.fn(async () => null),
  };
});

import { getCharacterViewEnrichment } from './character-view-enrichment-server';
import { emptyLibraryForView } from './owner-library-for-view';
import { createServiceRoleClient } from '@/lib/supabase/server';

const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const OWNER = 'owner-user';

type Row = Record<string, unknown>;

interface QueryCall {
  table: string;
  ids: string[];
  ownerId?: string | undefined;
}

function createMockClient(tables: Record<string, Row[]>) {
  const calls: QueryCall[] = [];

  const client = {
    from: (table: string) => ({
      select: () => ({
        in: async (_idCol: string, ids: string[]) => {
          calls.push({ table, ids });
          const rows = (tables[table] ?? []).filter((row) => ids.includes(String(row.id)));
          return { data: rows, error: null };
        },
        eq: (col: string, val: string) => ({
          in: async (_idCol: string, ids: string[]) => {
            calls.push({ table, ids, ownerId: col === 'user_id' ? val : undefined });
            const rows = (tables[table] ?? []).filter(
              (row) => ids.includes(String(row.id)) && (col !== 'user_id' || row.user_id === val),
            );
            return { data: rows, error: null };
          },
        }),
      }),
    }),
  };

  return { client, calls };
}

describe('getCharacterViewEnrichment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not return owner empowered or species rows the character never references', async () => {
    const publicMock = createMockClient({
      official_powers: [],
      official_techniques: [],
      official_empowered_techniques: [],
      official_items: [],
      codex_species: [],
      codex_feats: [],
      codex_skills: [],
      codex_traits: [],
      codex_parts: [],
      codex_properties: [],
      codex_equipment: [],
    });
    const ownerMock = createMockClient({
      user_empowered_techniques: [
        {
          id: 'tech-ref',
          user_id: OWNER,
          name: 'Referenced Empowered',
          payload: { parts: [] },
        },
        {
          id: 'tech-secret',
          user_id: OWNER,
          name: 'Secret Empowered',
          payload: { parts: [] },
        },
      ],
      user_species: [
        { id: 'sp-ref', user_id: OWNER, name: 'Homebrew Elf', species_traits: [] },
        { id: 'sp-secret', user_id: OWNER, name: 'Secret Species', species_traits: [] },
      ],
    });
    mockCreateServiceRoleClient.mockReturnValue(ownerMock.client as never);

    const result = await getCharacterViewEnrichment(
      publicMock.client as never,
      OWNER,
      {
        techniques: [{ id: 'tech-ref', name: 'Referenced Empowered' }],
        ancestry: { id: 'sp-ref', name: 'Homebrew Elf' },
      },
      emptyLibraryForView(),
    );

    expect(result.empoweredTechniques.map((row) => row.id)).toEqual(['tech-ref']);
    expect(result.empoweredTechniques.map((row) => row.name)).not.toContain('Secret Empowered');
    expect(result.species.map((row) => row.id)).toEqual(['sp-ref']);
    expect(result.species.map((row) => row.name)).not.toContain('Secret Species');
    expect(ownerMock.calls.every((call) => call.ids.includes('tech-secret'))).toBe(false);
    expect(ownerMock.calls.find((call) => call.table === 'user_species')?.ids).toEqual(['sp-ref']);
  });

  it('does not create a service-role client when the character has no owner-table refs', async () => {
    const publicMock = createMockClient({
      official_powers: [],
      official_techniques: [],
      official_empowered_techniques: [],
      official_items: [],
      codex_species: [],
      codex_feats: [{ id: 'feat-1', name: 'Tough', description: '', category: '' }],
      codex_skills: [],
      codex_traits: [],
      codex_parts: [],
      codex_properties: [],
      codex_equipment: [],
    });

    const result = await getCharacterViewEnrichment(
      publicMock.client as never,
      OWNER,
      { feats: [{ id: 'feat-1', name: 'Tough' }] },
      emptyLibraryForView(),
    );

    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();
    expect(result.feats.map((feat) => feat.id)).toEqual(['feat-1']);
    expect(result.empoweredTechniques).toEqual([]);
  });

  it('queries official tables with the referenced ids only', async () => {
    const publicMock = createMockClient({
      official_powers: [
        { id: 'power-1', name: 'Firebolt', payload: { parts: [{ id: 'part-1' }] } },
        { id: 'power-secret', name: 'Secret Official', payload: {} },
      ],
      official_techniques: [],
      official_empowered_techniques: [],
      official_items: [],
      codex_species: [],
      codex_feats: [],
      codex_skills: [],
      codex_traits: [],
      codex_parts: [{ id: 'part-1', name: 'Damage', type: 'power', base_en: 1, base_tp: 1 }],
      codex_properties: [],
      codex_equipment: [],
    });

    const result = await getCharacterViewEnrichment(
      publicMock.client as never,
      OWNER,
      { powers: [{ id: 'power-1', name: 'Firebolt' }] },
      emptyLibraryForView(),
    );

    const officialCall = publicMock.calls.find((call) => call.table === 'official_powers');
    expect(officialCall?.ids).toEqual(['power-1']);
    expect(result.officialPowers.map((row) => row.id)).toEqual(['power-1']);
    expect(result.powerParts.map((part) => part.id)).toEqual(['part-1']);
  });

  it('maps referenced catalog rows with the shared Codex mapper (superset of browse fields)', async () => {
    const publicMock = createMockClient({
      official_powers: [],
      official_techniques: [],
      official_empowered_techniques: [],
      official_items: [],
      codex_species: [
        {
          id: 'sp-1',
          name: 'Human',
          sizes: 'Medium',
          adulthood_lifespan: '18,80',
          is_starter: true,
        },
      ],
      codex_feats: [
        { id: 'feat-1', name: 'Cleave', ability: 'Strength / Agility', tags: 'Combat' },
      ],
      codex_skills: [
        { id: 'skill-1', name: 'Athletics', ability: 'STR', base_skill: '10', ds_calc: 'STR' },
      ],
      codex_traits: [],
      codex_parts: [],
      codex_properties: [],
      codex_equipment: [{ id: 'eq-1', name: 'Rope', currency: 5, category: 'adventuring' }],
    });
    const ownerMock = createMockClient({
      user_empowered_techniques: [],
      user_species: [],
    });
    mockCreateServiceRoleClient.mockReturnValue(ownerMock.client as never);

    const result = await getCharacterViewEnrichment(
      publicMock.client as never,
      OWNER,
      {
        ancestry: { id: 'sp-1', name: 'Human' },
        feats: [{ id: 'feat-1', name: 'Cleave' }],
        skills: [{ id: 'skill-1', name: 'Athletics' }],
        equipment: { items: [{ id: 'eq-1', name: 'Rope' }] },
      },
      emptyLibraryForView(),
    );

    expect(result.feats[0]?.ability).toEqual(['Strength', 'Agility']);
    expect(result.feats[0]?.tags).toEqual(['Combat']);
    expect(result.skills[0]?.base_skill_id).toBe(10);
    expect(result.skills[0]?.ds_calc).toBe('STR');
    expect(result.species[0]?.adulthood_lifespan).toEqual([18, 80]);
    expect(result.species[0]?.is_starter).toBe(true);
    expect(result.equipment[0]?.category).toBe('adventuring');
    expect(result.equipment[0]?.currency).toBe(5);
  });
});
