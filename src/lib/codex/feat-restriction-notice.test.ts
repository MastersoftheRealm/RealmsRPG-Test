import { describe, expect, it } from 'vitest';
import { getFeatRestrictionNotice } from './feat-restriction-notice';

describe('getFeatRestrictionNotice', () => {
  it('describes state feat enter-state uses per full recovery', () => {
    const notice = getFeatRestrictionNotice({ state_feat: true }, { level: 3 });
    expect(notice).toContain('State feat');
    expect(notice).toContain('2 times per Full Recovery');
  });

  it('state feat per-feat uses always say full recovery, not partial', () => {
    const notice = getFeatRestrictionNotice({
      state_feat: true,
      uses_per_rec: 2,
      rec_period: 'Partial',
    });
    expect(notice).toContain('2 times per Full Recovery');
    expect(notice).not.toContain('Partial Recovery');
  });

  it('non-state feat uses respect rec_period', () => {
    const notice = getFeatRestrictionNotice({
      state_feat: false,
      uses_per_rec: 1,
      rec_period: 'Partial',
    });
    expect(notice).toContain('once per Partial Recovery');
  });
});
