import { describe, expect, it } from 'vitest';
import { AUTOSAVE_RETRY_DELAYS_MS, nextAutosaveRetryDelayMs } from './use-auto-save';

describe('nextAutosaveRetryDelayMs', () => {
  it('steps through 2s / 5s / 15s then caps at 60s', () => {
    expect(AUTOSAVE_RETRY_DELAYS_MS).toEqual([2_000, 5_000, 15_000, 60_000]);
    expect(nextAutosaveRetryDelayMs(0)).toBe(2_000);
    expect(nextAutosaveRetryDelayMs(1)).toBe(5_000);
    expect(nextAutosaveRetryDelayMs(2)).toBe(15_000);
    expect(nextAutosaveRetryDelayMs(3)).toBe(60_000);
    expect(nextAutosaveRetryDelayMs(99)).toBe(60_000);
  });
});
