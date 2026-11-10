import { describe, expect, it } from 'vitest';
import {
  advanceSheetAutosaveBaselineAfterSuccess,
  advanceSheetAutosaveBaselineAfterSuccess_masterBuggy,
  qaEnAllocationLockedPatchIncludesEnergyPoints,
} from './sheet-autosave-baseline';

const useMasterBaseline =
  process.env.REGRESSION_BASELINE === 'master' ||
  process.env.REGRESSION_BASELINE === 'master-buggy';

describe('QA EN allocation → locked autosave regression', () => {
  it('energyPoints is still dirty for the next locked PATCH after resource-only echo + refetch', () => {
    const advance = useMasterBaseline
      ? advanceSheetAutosaveBaselineAfterSuccess_masterBuggy
      : advanceSheetAutosaveBaselineAfterSuccess;
    expect(qaEnAllocationLockedPatchIncludesEnergyPoints(advance)).toBe(true);
  });
});
