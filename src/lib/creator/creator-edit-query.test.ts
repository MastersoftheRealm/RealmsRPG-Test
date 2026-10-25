import { describe, expect, it } from 'vitest';
import { creatorBackSentinelState } from './creator-unsaved-guard';
import {
  bindCreatorEditClear,
  creatorEditClearPlan,
  creatorPathWithoutEdit,
} from './creator-edit-query';

const EDIT_HREF = 'https://realmsrpg.com/power-creator?edit=row-1';

describe('creator edit query clear (86e3jwurq)', () => {
  it('drops only the edit param', () => {
    expect(creatorPathWithoutEdit(EDIT_HREF)).toBe('/power-creator');
    expect(creatorPathWithoutEdit('https://realmsrpg.com/power-creator?edit=row-1&x=1')).toBe(
      '/power-creator?x=1',
    );
    expect(creatorPathWithoutEdit('https://realmsrpg.com/power-creator?x=1')).toBe(
      '/power-creator?x=1',
    );
  });

  it('replaces immediately when no back sentinel is armed', () => {
    const clears: string[] = [];
    const plan = creatorEditClearPlan(EDIT_HREF, null);
    bindCreatorEditClear(
      plan,
      (href) => clears.push(href),
      () => {
        throw new Error('pop listener must not be armed when the draft has no sentinel');
      },
    );
    expect(plan.when).toBe('now');
    expect(clears).toEqual(['/power-creator']);
  });

  it('does not replace until after the sentinel popstate', async () => {
    const clears: string[] = [];
    const listeners: Array<() => void> = [];
    const plan = creatorEditClearPlan(EDIT_HREF, creatorBackSentinelState({ __NA: true }));
    bindCreatorEditClear(
      plan,
      (href) => clears.push(href),
      (listener) => {
        listeners.push(listener);
        return () => {
          listeners.length = 0;
        };
      },
    );
    expect(plan.when).toBe('after-sentinel-pop');
    expect(clears).toEqual([]);
    expect(listeners).toHaveLength(1);
    listeners[0]?.();
    expect(clears).toEqual([]);
    await Promise.resolve();
    expect(clears).toEqual(['/power-creator']);
    expect(listeners).toHaveLength(0);
  });
});
