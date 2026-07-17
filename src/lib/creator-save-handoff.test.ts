import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { navigateThenResetCreator, scheduleCreatorReset } from './creator-save-handoff';

describe('creator-save-handoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('navigates before resetCreator runs', () => {
    const order: string[] = [];
    navigateThenResetCreator(
      () => {
        order.push('nav');
      },
      () => {
        order.push('reset');
      }
    );
    expect(order).toEqual(['nav']);
    vi.runAllTimers();
    expect(order).toEqual(['nav', 'reset']);
  });

  it('defers scheduleCreatorReset one macrotask', () => {
    const reset = vi.fn();
    scheduleCreatorReset(reset);
    expect(reset).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(reset).toHaveBeenCalledOnce();
  });
});
