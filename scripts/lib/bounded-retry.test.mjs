import { describe, expect, it } from 'vitest';
import { runSyncWithBoundedRetry } from './bounded-retry.mjs';

describe('runSyncWithBoundedRetry', () => {
  it('succeeds on a later attempt', () => {
    let calls = 0;
    const result = runSyncWithBoundedRetry({
      maxAttempts: 3,
      backoffMs: [1, 1],
      label: 'probe',
      sleep: () => {},
      log: () => {},
      attempt: () => {
        calls += 1;
        return { status: calls >= 2 ? 0 : 1, stderr: `fail-${calls}` };
      },
    });
    expect(calls).toBe(2);
    expect(result.status).toBe(0);
  });

  it('fails loudly after max attempts', () => {
    expect(() =>
      runSyncWithBoundedRetry({
        maxAttempts: 3,
        backoffMs: [1, 1],
        label: 'probe',
        sleep: () => {},
        log: () => {},
        attempt: () => ({ status: 1, stderr: 'still broken' }),
      }),
    ).toThrow(/probe failed after 3 attempt\(s\)/);
  });
});