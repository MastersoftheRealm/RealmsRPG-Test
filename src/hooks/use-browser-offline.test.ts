import { afterEach, describe, expect, it, vi } from 'vitest';
import { getBrowserOfflineSnapshot, subscribeBrowserOffline } from './use-browser-offline';

describe('useBrowserOffline', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('subscribes to online and offline window events', () => {
    const added = new Map<string, Set<() => void>>();
    const window = {
      addEventListener: (type: string, fn: () => void) => {
        const set = added.get(type) ?? new Set();
        set.add(fn);
        added.set(type, set);
      },
      removeEventListener: (type: string, fn: () => void) => {
        added.get(type)?.delete(fn);
      },
    };
    vi.stubGlobal('window', window);
    vi.stubGlobal('navigator', { onLine: true });

    const onChange = vi.fn();
    const unsubscribe = subscribeBrowserOffline(onChange);

    expect(added.get('online')?.size).toBe(1);
    expect(added.get('offline')?.size).toBe(1);

    added.get('offline')?.forEach((fn) => fn());
    expect(onChange).toHaveBeenCalled();

    unsubscribe();
    expect(added.get('online')?.size).toBe(0);
    expect(added.get('offline')?.size).toBe(0);
  });

  it('reports offline only when navigator.onLine is false', () => {
    vi.stubGlobal('navigator', { onLine: true });
    expect(getBrowserOfflineSnapshot()).toBe(false);

    vi.stubGlobal('navigator', { onLine: false });
    expect(getBrowserOfflineSnapshot()).toBe(true);
  });
});
