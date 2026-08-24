import { describe, expect, it } from 'vitest';
import { nextSheetHeaderCollapsed } from './sheet-mobile-header-collapse';

describe('nextSheetHeaderCollapsed (TASK-902)', () => {
  it('stays open until scroll clears the collapse threshold', () => {
    expect(nextSheetHeaderCollapsed(false, 0)).toBe(false);
    expect(nextSheetHeaderCollapsed(false, 48)).toBe(false);
    expect(nextSheetHeaderCollapsed(false, 49)).toBe(true);
  });

  it('stays collapsed until the panel is fully back at the top', () => {
    expect(nextSheetHeaderCollapsed(true, 40)).toBe(true);
    expect(nextSheetHeaderCollapsed(true, 1)).toBe(true);
    expect(nextSheetHeaderCollapsed(true, 0)).toBe(false);
  });
});
