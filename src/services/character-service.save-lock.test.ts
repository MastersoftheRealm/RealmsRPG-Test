import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  rememberCharacterLockToken,
  resetCharacterSaveLockForTests,
} from '@/lib/character/save-lock';
import { saveCharacter } from './character-service';

const apiFetch = vi.hoisted(() => vi.fn());

vi.mock('@/lib/api-client', () => ({
  apiFetch: (...args: unknown[]) => apiFetch(...args),
  apiFetchOrNull: vi.fn(),
  isConflictError: (err: unknown) =>
    Boolean(
      err &&
      typeof err === 'object' &&
      'status' in err &&
      (err as { status: number }).status === 409,
    ),
}));

describe('saveCharacter lock token', () => {
  beforeEach(() => {
    resetCharacterSaveLockForTests();
    apiFetch.mockReset();
    apiFetch.mockResolvedValue({ ok: true, updatedAt: '2026-08-15T14:00:00.000Z' });
  });

  it('upgrades a stale provided token from memory', async () => {
    rememberCharacterLockToken('c1', '2026-08-15T13:00:00.000Z');
    await saveCharacter('c1', { notes: 'x' }, { updatedAt: '2026-08-15T12:00:00.000Z' });
    const body = JSON.parse((apiFetch.mock.calls[0]?.[1] as { body: string }).body) as {
      updatedAt?: string | undefined;
    };
    expect(body.updatedAt).toBe('2026-08-15T13:00:00.000Z');
  });

  it('omits the lock when skipLock is set', async () => {
    rememberCharacterLockToken('c1', '2026-08-15T13:00:00.000Z');
    await saveCharacter('c1', { currentHealth: 3 }, { skipLock: true });
    const body = JSON.parse((apiFetch.mock.calls[0]?.[1] as { body: string }).body) as {
      updatedAt?: string | undefined;
    };
    expect(body.updatedAt).toBeUndefined();
  });
});
