import { describe, expect, it } from 'vitest';
import { shouldApplyGuidedDeepEntryOnArrival } from '@/lib/guided-creator/guided-deep-entry-landing';

describe('shouldApplyGuidedDeepEntryOnArrival', () => {
  const customDraft = { creatorEntryMode: 'custom' as const, archetypePathId: null };

  it('applies once per entryNonce on forward landing for custom entry', () => {
    expect(
      shouldApplyGuidedDeepEntryOnArrival({
        draft: customDraft,
        navigationIntent: 'forward',
        entryNonce: 3,
        lastAppliedEntryNonce: null,
      }),
    ).toBe(true);

    expect(
      shouldApplyGuidedDeepEntryOnArrival({
        draft: customDraft,
        navigationIntent: 'forward',
        entryNonce: 3,
        lastAppliedEntryNonce: 3,
      }),
    ).toBe(false);
  });

  it('does not apply for guided entry or footer back', () => {
    expect(
      shouldApplyGuidedDeepEntryOnArrival({
        draft: { creatorEntryMode: 'guided', archetypePathId: null },
        navigationIntent: 'forward',
        entryNonce: 1,
        lastAppliedEntryNonce: null,
      }),
    ).toBe(false);

    expect(
      shouldApplyGuidedDeepEntryOnArrival({
        draft: customDraft,
        navigationIntent: 'back',
        entryNonce: 2,
        lastAppliedEntryNonce: null,
      }),
    ).toBe(false);
  });

  it('respects enabled gate', () => {
    expect(
      shouldApplyGuidedDeepEntryOnArrival({
        draft: customDraft,
        navigationIntent: 'first',
        entryNonce: 1,
        lastAppliedEntryNonce: null,
        enabled: false,
      }),
    ).toBe(false);
  });
});
