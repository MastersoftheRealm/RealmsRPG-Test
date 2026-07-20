import { describe, expect, it } from 'vitest';
import {
  getFeatRestrictionNotice,
  getLimitedUsesNotice,
  getTraitRestrictionNotice,
} from './feat-restriction-notice';

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

  it('omitLimitedUses drops uses sentence but keeps state teaching', () => {
    const notice = getFeatRestrictionNotice(
      {
        state_feat: true,
        uses_per_rec: 2,
        rec_period: 'Partial',
      },
      { omitLimitedUses: true, level: 1 }
    );
    expect(notice).toContain('State feat');
    expect(notice).not.toContain('2 times');
    expect(notice).not.toContain('can be used');
  });

  it('omitLimitedUses with non-state uses-only returns null', () => {
    const notice = getFeatRestrictionNotice(
      {
        state_feat: false,
        uses_per_rec: 1,
        rec_period: 'Full',
      },
      { omitLimitedUses: true }
    );
    expect(notice).toBeNull();
  });
});

describe('getLimitedUsesNotice / getTraitRestrictionNotice', () => {
  it('shares the same uses wording for traits and feats', () => {
    const feat = getLimitedUsesNotice('feat', 2, 'Partial');
    const trait = getTraitRestrictionNotice({ uses_per_rec: 2, rec_period: 'Partial' });
    expect(feat).toBe('This feat can be used 2 times per Partial Recovery.');
    expect(trait).toBe('This trait can be used 2 times per Partial Recovery.');
  });

  it('returns null when uses are missing or zero', () => {
    expect(getTraitRestrictionNotice({ uses_per_rec: 0, rec_period: 'Full' })).toBeNull();
    expect(getTraitRestrictionNotice({})).toBeNull();
  });
});
