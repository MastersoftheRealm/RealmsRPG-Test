/**
 * LIB1-011: route gate must return before enrichment for unauthorized viewers.
 * Uses the real enrichment stack (no mock on character-view-enrichment-server).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase/session', () => ({
  getSession: vi.fn(),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
  createServiceRoleClient: vi.fn(),
}));

vi.mock('@/lib/game/archetype-display', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/game/archetype-display')>();
  return {
    ...actual,
    fetchCodexArchetypeById: vi.fn(async () => null),
  };
});

import { GET } from './route';
import { getSession } from '@/lib/supabase/session';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';

const mockGetSession = vi.mocked(getSession);
const mockCreateClient = vi.mocked(createClient);
const mockCreateServiceRoleClient = vi.mocked(createServiceRoleClient);

const OWNER_UID = 'owner-user';
const OTHER = { uid: 'other-user', email: 'other@example.com' };

const SECRET_EMPOWERED = 'Secret Empowered';
const SECRET_SPECIES = 'Secret Species';

type Row = Record<string, unknown>;

function createEnrichmentAwareSupabase({
  characterRow,
  ownerTables,
  publicTables = {},
}: {
  characterRow: {
    id: string;
    user_id: string;
    data: Record<string, unknown>;
    created_at: string;
    updated_at: string;
    visibility?: string | null;
  };
  ownerTables: Record<string, Row[]>;
  publicTables?: Record<string, Row[]>;
}) {
  const tables: Record<string, Row[]> = {
    campaign_members: [],
    campaigns: [],
    ...publicTables,
  };

  const buildTableClient = (table: string) => ({
    select: () => ({
      in: async (_idCol: string, ids: string[]) => ({
        data: (tables[table] ?? []).filter((row) => ids.includes(String(row.id))),
        error: null,
      }),
      eq: (col: string, val: string) => ({
        in: async (_idCol: string, ids: string[]) => ({
          data: (tables[table] ?? []).filter(
            (row) => ids.includes(String(row.id)) && (col !== 'user_id' || row.user_id === val),
          ),
          error: null,
        }),
        maybeSingle: async () => ({ data: null, error: null }),
      }),
      maybeSingle: async () => ({ data: null, error: null }),
    }),
  });

  const sessionClient = {
    rpc: vi.fn(async (name: string) => {
      if (name === 'get_character_relational_document') {
        return { data: characterRow.data, error: null };
      }
      throw new Error(`Unexpected RPC: ${name}`);
    }),
    from: vi.fn((table: string) => {
      if (table === 'characters') {
        const eqCalls: [string, string][] = [];
        const chain = {
          eq: vi.fn((col: string, val: string) => {
            eqCalls.push([col, val]);
            return chain;
          }),
          maybeSingle: vi.fn(async () => {
            const filters = Object.fromEntries(eqCalls);
            if (filters.id && filters.id !== characterRow.id) {
              return { data: null, error: null };
            }
            return { data: characterRow, error: null };
          }),
        };
        return { select: vi.fn(() => chain) };
      }
      if (table === 'campaign_members' || table === 'campaigns') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            in: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        };
      }
      return buildTableClient(table);
    }),
  };

  const serviceClient = {
    from: vi.fn((table: string) => buildTableClient(table)),
  };

  for (const [table, rows] of Object.entries(ownerTables)) {
    tables[table] = rows;
  }

  return { sessionClient, serviceClient };
}

function makeGetRequest(id: string) {
  return new NextRequest(`http://localhost/api/characters/${id}`);
}

describe('GET /api/characters/[id] enrichment gate (LIB1-011)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not return owner empowered techniques or species to an unauthorized viewer', async () => {
    const charId = 'char-private-lib1';
    const characterRow = {
      id: charId,
      user_id: OWNER_UID,
      visibility: 'private' as const,
      created_at: '2026-07-01T12:00:00.000Z',
      updated_at: '2026-07-01T12:00:00.000Z',
      data: {
        name: 'Private Hero',
        level: 1,
        visibility: 'private',
        techniques: [{ id: 'tech-ref', name: 'Referenced Empowered' }],
        ancestry: { id: 'sp-ref', name: 'Homebrew Elf' },
      },
    };

    const ownerTables = {
      user_empowered_techniques: [
        {
          id: 'tech-ref',
          user_id: OWNER_UID,
          name: 'Referenced Empowered',
          payload: { parts: [] },
        },
        {
          id: 'tech-secret',
          user_id: OWNER_UID,
          name: SECRET_EMPOWERED,
          payload: { parts: [] },
        },
      ],
      user_species: [
        { id: 'sp-ref', user_id: OWNER_UID, name: 'Homebrew Elf', species_traits: [] },
        { id: 'sp-secret', user_id: OWNER_UID, name: SECRET_SPECIES, species_traits: [] },
      ],
      user_techniques: [
        {
          id: 'tech-ref',
          user_id: OWNER_UID,
          name: 'Referenced Empowered',
          payload: { parts: [] },
        },
      ],
    };

    const publicTables = {
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
    };

    const { sessionClient, serviceClient } = createEnrichmentAwareSupabase({
      characterRow,
      ownerTables,
      publicTables,
    });

    mockGetSession.mockResolvedValue({ user: OTHER, error: null });
    mockCreateClient.mockResolvedValue(sessionClient as never);
    mockCreateServiceRoleClient.mockReturnValue(serviceClient as never);

    const response = await GET(makeGetRequest(charId), {
      params: Promise.resolve({ id: charId }),
    });

    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toBeNull();
    expect(mockCreateServiceRoleClient).not.toHaveBeenCalled();

    const raw = JSON.stringify(body ?? {});
    expect(raw).not.toContain(SECRET_EMPOWERED);
    expect(raw).not.toContain(SECRET_SPECIES);
  });
});
