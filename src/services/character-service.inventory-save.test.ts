import { beforeEach, describe, expect, it, vi } from 'vitest';
import { saveCharacter, saveCharacterWithConflictRetry } from './character-service';
import { apiFetch, isConflictError } from '@/lib/api-client';
import { inventoryRowCasSnapshot } from '@/lib/character/inventory-patch';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
  apiFetchOrNull: vi.fn(),
  isConflictError: vi.fn(),
  getErrorMessage: (e: unknown, fallback: string) => (e instanceof Error ? e.message : fallback),
}));

import { apiFetchOrNull } from '@/lib/api-client';

vi.mock('@/lib/character/save-lock', () => ({
  enqueueCharacterSave: (_id: string, run: () => Promise<unknown>) => run(),
  rememberCharacterLockToken: vi.fn(),
  resolveCharacterLockToken: () => '2026-01-01T00:00:00.000Z',
}));

const HEALTH_ROW = '10000000-0000-4000-8000-000000000001';
const ENERGY_ROW = '20000000-0000-4000-8000-000000000002';

describe('character-service inventory CAS save', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
    vi.mocked(isConflictError).mockReset();
  });

  it('two-tab stale tab: sends a single health update op from the autosave baseline', async () => {
    vi.mocked(apiFetch).mockResolvedValue({ ok: true, updatedAt: '2026-01-01T00:00:01.000Z' });

    const baseline = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 1,
          },
          {
            inventoryRowId: ENERGY_ROW,
            id: 'energy-potion',
            name: 'Energy Potion',
            quantity: 1,
          },
        ],
      },
    };
    const dirty = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 3,
          },
          {
            inventoryRowId: ENERGY_ROW,
            id: 'energy-potion',
            name: 'Energy Potion',
            quantity: 1,
          },
        ],
      },
    };

    await saveCharacter('char-1', dirty, { inventorySaveBaseline: baseline });

    const body = JSON.parse(
      String((vi.mocked(apiFetch).mock.calls[0]?.[1] as { body?: string }).body),
    );
    expect(body).not.toHaveProperty('equipment');
    expect(body.inventoryPatch.ops).toEqual([
      {
        op: 'update',
        bucket: 'items',
        inventoryRowId: HEALTH_ROW,
        expected: inventoryRowCasSnapshot(baseline.equipment.items[0] as Record<string, unknown>),
        item: {
          id: 'health-potion',
          name: 'Health Potion',
          quantity: 3,
          equipped: false,
        },
      },
    ]);
  });

  it('409 retry uses remote as inventory baseline after concurrent energy edit', async () => {
    vi.mocked(isConflictError).mockReturnValueOnce(true).mockReturnValueOnce(false);
    vi.mocked(apiFetch)
      .mockRejectedValueOnce(new Error('conflict'))
      .mockResolvedValueOnce({ ok: true, updatedAt: '2026-01-01T00:00:02.000Z' });

    const remote = {
      id: 'char-1',
      name: 'Test',
      level: 1,
      updatedAt: '2026-01-01T00:00:01.500Z',
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 1,
          },
          {
            inventoryRowId: ENERGY_ROW,
            id: 'energy-potion',
            name: 'Energy Potion',
            quantity: 2,
          },
        ],
      },
    } as const;
    vi.mocked(apiFetchOrNull).mockResolvedValueOnce(remote);

    const baseline = {
      equipment: {
        items: [
          {
            inventoryRowId: HEALTH_ROW,
            id: 'health-potion',
            name: 'Health Potion',
            quantity: 1,
          },
          {
            inventoryRowId: ENERGY_ROW,
            id: 'energy-potion',
            name: 'Energy Potion',
            quantity: 1,
          },
        ],
      },
    };

    await saveCharacterWithConflictRetry(
      'char-1',
      {
        equipment: {
          items: [
            {
              inventoryRowId: HEALTH_ROW,
              id: 'health-potion',
              name: 'Health Potion',
              quantity: 3,
            },
            {
              inventoryRowId: ENERGY_ROW,
              id: 'energy-potion',
              name: 'Energy Potion',
              quantity: 1,
            },
          ],
        },
      },
      {
        inventorySaveBaseline: baseline,
        mergeOnConflict: () => ({
          dirty: {
            equipment: {
              items: [
                {
                  inventoryRowId: HEALTH_ROW,
                  id: 'health-potion',
                  name: 'Health Potion',
                  quantity: 3,
                },
                {
                  inventoryRowId: ENERGY_ROW,
                  id: 'energy-potion',
                  name: 'Energy Potion',
                  quantity: 2,
                },
              ],
            },
          },
          updatedAt: remote.updatedAt,
          inventorySaveBaseline: remote,
        }),
      },
    );

    const retryBody = JSON.parse(
      String((vi.mocked(apiFetch).mock.calls[1]?.[1] as { body?: string }).body),
    );
    expect(retryBody.inventoryPatch.ops).toHaveLength(1);
    expect(retryBody.inventoryPatch.ops[0]).toMatchObject({
      inventoryRowId: HEALTH_ROW,
      op: 'update',
    });
  });
});