import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mergeRemotePreservingDirty, pickDirtyCharacterFields } from '@/lib/character/dirty-patch';
import {
  rememberCharacterLockToken,
  resetCharacterSaveLockForTests,
} from '@/lib/character/save-lock';
import type { Character } from '@/types';
import { saveCharacterWithConflictRetry } from './character-service';

const apiFetch = vi.hoisted(() => vi.fn());
const apiFetchOrNull = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  apiFetchOrNull: (...args: unknown[]) => apiFetchOrNull(...args),
  isConflictError: (err: unknown) =>
    Boolean(
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 409,
    ),
}));

const SNAPSHOT = '2026-11-18T12:00:00.000Z';
const REMOTE_TOKEN = '2026-11-18T13:00:00.000Z';

function itemsOf(body: { equipment?: { items?: Array<{ id: string; quantity?: number }> } }) {
  return body.equipment?.items ?? [];
}

function sheetMerge(baseline: Record<string, unknown>) {
  return (remote: Character) => {
    const remoteClean = remote as unknown as Record<string, unknown>;
    const localClean = {
      equipment: {
        items: [
          { id: 'health-potion', name: 'Health Potion', quantity: 2 },
          { id: 'energy-potion', name: 'Energy Potion', quantity: 2 },
          { id: 'custom-rope-1', name: 'QA Rope', quantity: 2 },
          { id: 'custom-rope-2', name: 'QA Rope', quantity: 1 },
        ],
      },
    };
    const merged = mergeRemotePreservingDirty(remoteClean, localClean, ['equipment'], baseline);
    return {
      dirty: pickDirtyCharacterFields(merged, remoteClean) as Partial<Character>,
      updatedAt: remote.updatedAt,
    };
  };
}

const remoteCharacter = {
  id: 'c1',
  updatedAt: REMOTE_TOKEN,
  equipment: {
    items: [
      { id: 'health-potion', name: 'Health Potion', quantity: 1 },
      { id: 'energy-potion', name: 'Energy Potion', quantity: 3 },
      { id: 'custom-rope-1', name: 'QA Rope', quantity: 1 },
      { id: 'custom-rope-2', name: 'QA Rope', quantity: 2 },
    ],
  },
} as Character;

describe('two-tab inventory save', () => {
  beforeEach(() => {
    resetCharacterSaveLockForTests();
    apiFetch.mockReset();
    apiFetchOrNull.mockReset();
    apiFetchOrNull.mockResolvedValue({ character: remoteCharacter });
  });

  it('does not 200 a stale inventory when the lock token already moved', async () => {
    rememberCharacterLockToken('c1', REMOTE_TOKEN);
    const accepted: Array<{ equipment?: { items?: Array<{ id: string; quantity?: number }> } }> =
      [];
    apiFetch.mockImplementation(async (_url: string, init?: { method?: string; body?: string }) => {
      if (init?.method !== 'PATCH') throw new Error('expected PATCH');
      const body = JSON.parse(init.body ?? '{}') as {
        updatedAt?: string;
        equipment?: { items?: Array<{ id: string; quantity?: number }> };
      };
      const energy = itemsOf(body).find((row) => row.id === 'energy-potion')?.quantity;
      const rope = itemsOf(body).find((row) => row.id === 'custom-rope-2')?.quantity;
      // The server accepts a PATCH whose token matches the latest row, even when
      // the inventory in that body is stale. A snapshot token still 409s.
      if (body.updatedAt === REMOTE_TOKEN) {
        accepted.push(body);
        return { ok: true, updatedAt: '2026-11-18T13:00:01.000Z' };
      }
      if (energy === 3 && rope === 2) {
        accepted.push(body);
        return { ok: true, updatedAt: '2026-11-18T13:00:01.000Z' };
      }
      throw Object.assign(new Error('Character was updated elsewhere'), { status: 409 });
    });

    await saveCharacterWithConflictRetry(
      'c1',
      {
        equipment: {
          items: [
            { id: 'health-potion', name: 'Health Potion', quantity: 2 },
            { id: 'energy-potion', name: 'Energy Potion', quantity: 2 },
            { id: 'custom-rope-1', name: 'QA Rope', quantity: 2 },
            { id: 'custom-rope-2', name: 'QA Rope', quantity: 1 },
          ],
        },
      } as Partial<Character>,
      {
        updatedAt: SNAPSHOT,
        mergeOnConflict: sheetMerge({
          equipment: {
            items: [
              { id: 'health-potion', name: 'Health Potion', quantity: 1 },
              { id: 'energy-potion', name: 'Energy Potion', quantity: 2 },
              { id: 'custom-rope-1', name: 'QA Rope', quantity: 1 },
              { id: 'custom-rope-2', name: 'QA Rope', quantity: 1 },
            ],
          },
        }),
      },
    );

    expect(accepted).toHaveLength(1);
    const saved = itemsOf(accepted[0]!);
    expect(saved.find((row) => row.id === 'energy-potion')?.quantity).toBe(3);
    expect(saved.find((row) => row.id === 'custom-rope-2')?.quantity).toBe(2);
    expect(saved.find((row) => row.id === 'health-potion')?.quantity).toBe(2);
    expect(saved.find((row) => row.id === 'custom-rope-1')?.quantity).toBe(2);
  });

  it('409 retry merges the other tab inventory instead of resending the stale list', async () => {
    const accepted: Array<{ equipment?: { items?: Array<{ id: string; quantity?: number }> } }> =
      [];
    let attempts = 0;
    apiFetch.mockImplementation(async (_url: string, init?: { method?: string; body?: string }) => {
      if (init?.method !== 'PATCH') throw new Error('expected PATCH');
      const body = JSON.parse(init.body ?? '{}') as {
        equipment?: { items?: Array<{ id: string; quantity?: number }> };
      };
      const energy = itemsOf(body).find((row) => row.id === 'energy-potion')?.quantity;
      const rope = itemsOf(body).find((row) => row.id === 'custom-rope-2')?.quantity;
      attempts += 1;
      if (attempts === 1 || energy !== 3 || rope !== 2) {
        throw Object.assign(new Error('Character was updated elsewhere'), { status: 409 });
      }
      accepted.push(body);
      return { ok: true, updatedAt: '2026-11-18T13:00:01.000Z' };
    });

    await saveCharacterWithConflictRetry(
      'c1',
      {
        equipment: {
          items: [
            { id: 'health-potion', name: 'Health Potion', quantity: 2 },
            { id: 'energy-potion', name: 'Energy Potion', quantity: 2 },
            { id: 'custom-rope-1', name: 'QA Rope', quantity: 2 },
            { id: 'custom-rope-2', name: 'QA Rope', quantity: 1 },
          ],
        },
      } as Partial<Character>,
      {
        updatedAt: SNAPSHOT,
        mergeOnConflict: sheetMerge({
          equipment: {
            items: [
              { id: 'health-potion', name: 'Health Potion', quantity: 1 },
              { id: 'custom-rope-1', name: 'QA Rope', quantity: 1 },
            ],
          },
        }),
      },
    );

    expect(accepted).toHaveLength(1);
    const saved = itemsOf(accepted[0]!);
    expect(saved.find((row) => row.id === 'energy-potion')?.quantity).toBe(3);
    expect(saved.find((row) => row.id === 'custom-rope-2')?.quantity).toBe(2);
    expect(saved.find((row) => row.id === 'health-potion')?.quantity).toBe(2);
    expect(saved.find((row) => row.id === 'custom-rope-1')?.quantity).toBe(2);
  });
});
