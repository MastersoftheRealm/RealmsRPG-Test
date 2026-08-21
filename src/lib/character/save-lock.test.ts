import { describe, expect, it, beforeEach } from 'vitest';
import {
  enqueueCharacterSave,
  rememberCharacterLockToken,
  resetCharacterSaveLockForTests,
  resolveCharacterLockToken,
} from './save-lock';

describe('remember / resolve character lock', () => {
  beforeEach(() => {
    resetCharacterSaveLockForTests();
  });

  it('keeps the newest token and upgrades a stale provided lock', () => {
    expect(rememberCharacterLockToken('c1', '2026-08-15T12:00:00.000Z')).toBe(
      '2026-08-15T12:00:00.000Z',
    );
    expect(rememberCharacterLockToken('c1', '2026-08-15T11:00:00.000Z')).toBe(
      '2026-08-15T12:00:00.000Z',
    );
    expect(rememberCharacterLockToken('c1', '2026-08-15T13:00:00.000Z')).toBe(
      '2026-08-15T13:00:00.000Z',
    );
    expect(rememberCharacterLockToken('c1', '2026-08-15T13:00:00Z')).toBe(
      '2026-08-15T13:00:00.000Z',
    );
    expect(resolveCharacterLockToken('c1', '2026-08-15T11:00:00.000Z')).toBe(
      '2026-08-15T13:00:00.000Z',
    );
  });

  it('does not leak tokens across character ids', () => {
    rememberCharacterLockToken('c1', '2026-08-15T12:00:00.000Z');
    expect(resolveCharacterLockToken('c2')).toBeUndefined();
    expect(resolveCharacterLockToken('c2', '2026-08-15T10:00:00.000Z')).toBe(
      '2026-08-15T10:00:00.000Z',
    );
  });
});

describe('enqueueCharacterSave', () => {
  beforeEach(() => {
    resetCharacterSaveLockForTests();
  });

  it('runs work for the same id in start order', async () => {
    const order: number[] = [];
    let releaseFirst!: () => void;
    const firstGate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = enqueueCharacterSave('c1', async () => {
      await firstGate;
      order.push(1);
      return 'a';
    });
    const second = enqueueCharacterSave('c1', async () => {
      order.push(2);
      return 'b';
    });

    releaseFirst();
    await expect(first).resolves.toBe('a');
    await expect(second).resolves.toBe('b');
    expect(order).toEqual([1, 2]);
  });

  it('does not block a different character id', async () => {
    let releaseC1!: () => void;
    const c1Gate = new Promise<void>((resolve) => {
      releaseC1 = resolve;
    });
    const blocked = enqueueCharacterSave('c1', () => c1Gate.then(() => 'one'));
    const other = enqueueCharacterSave('c2', async () => 'two');
    await expect(other).resolves.toBe('two');
    releaseC1();
    await expect(blocked).resolves.toBe('one');
  });
});
