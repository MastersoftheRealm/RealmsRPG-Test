import { describe, expect, it } from 'vitest';
import { actionIsOverride, durationIsOverride, rangeIsOverride } from './power-creator-from-shared';
import { normalizePowerComposition } from '@/lib/calculators';
import {
  buildCompositionPayload,
  defaultVariantTabs,
  emptyTabForm,
  isOverlayFieldForced,
  nextVariantId,
  overlayFlagsFromComposition,
  overlayFlagsFromVariants,
  pruneOverlayFlags,
  REVERSE_TAB_ID,
  setOverlayField,
  showsFieldOverride,
  variantHighWater,
} from './power-creator-composition';

describe('Modify variant tabs', () => {
  it('does not save Shared mechanics or Shared parts onto an untouched piece', () => {
    const shared = emptyTabForm();
    shared.range = { steps: 2 };
    shared.area = { type: 'sphere', level: 2, applyDuration: false };
    shared.duration = { ...shared.duration, type: 'rounds', value: 2 };
    shared.selectedParts = [
      {
        part: { id: '910', name: 'Restrained' },
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ] as typeof shared.selectedParts;

    const payload = buildCompositionPayload({
      structure: 'modify',
      reverseEnabled: false,
      shared,
      variants: [
        {
          id: 'v1',
          label: 'Variant 1',
          polarity: 'positive',
          description: '',
          form: emptyTabForm(),
        },
      ],
      reverse: emptyTabForm(),
      dieSides: 2,
      dieFaces: ['', ''],
    });

    expect(payload?.variants).toEqual([{ id: 'v1', label: 'Variant 1' }]);
  });

  it('keeps a damage override that equals the empty default, and reloads the flag', () => {
    const shared = emptyTabForm();
    shared.damages = [{ amount: 2, size: 10, type: 'fire', applyDuration: false }];
    const piece = emptyTabForm();
    const flags = setOverlayField({}, 'v1', 'damage', true);
    const payload = buildCompositionPayload({
      structure: 'modify',
      reverseEnabled: false,
      shared,
      variants: [
        {
          id: 'v1',
          label: 'Variant 1',
          polarity: 'positive',
          description: '',
          form: piece,
        },
      ],
      reverse: emptyTabForm(),
      dieSides: 2,
      dieFaces: ['', ''],
      overlayFlags: flags,
    });
    expect(payload?.variants[0]?.damage).toEqual([]);
    expect(payload?.variants[0]?.overrides).toEqual(['damage']);
    expect(overlayFlagsFromVariants(payload?.variants ?? [])).toEqual({ v1: { damage: true } });
  });
});

describe('Reverse tab overrides', () => {
  it('keeps an Instant duration override through save and load', () => {
    const shared = emptyTabForm();
    shared.duration = { ...shared.duration, type: 'minutes', value: 1 };
    const reverse = emptyTabForm();
    reverse.selectedParts = [
      {
        part: { id: '902', name: 'Blinded' },
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ] as typeof reverse.selectedParts;
    const flags = setOverlayField({}, REVERSE_TAB_ID, 'duration', true);
    const payload = buildCompositionPayload({
      structure: 'none',
      reverseEnabled: true,
      shared,
      variants: [],
      reverse,
      dieSides: 2,
      dieFaces: [],
      overlayFlags: flags,
    });
    expect(payload?.reverse?.duration).toMatchObject({ type: 'instant' });
    expect(payload?.reverse?.overrides).toEqual(['duration']);
    const loaded = normalizePowerComposition(payload);
    expect(loaded?.reverse?.duration).toMatchObject({ type: 'instant' });
    expect(loaded?.reverse?.overrides).toEqual(['duration']);
    expect(overlayFlagsFromComposition(loaded!)).toEqual({ reverse: { duration: true } });
    expect(
      pruneOverlayFlags({ v1: { damage: true }, reverse: { duration: true } }, [REVERSE_TAB_ID]),
    ).toEqual({ reverse: { duration: true } });
  });
});

describe('variant ids are not reused', () => {
  it('issues the next id above the high-water mark after a tab is removed', () => {
    const existing = [{ id: 'v1' }];
    expect(variantHighWater([{ id: 'v1' }, { id: 'v2' }])).toBe(2);
    expect(nextVariantId(existing, 2)).toBe('v3');
    expect(pruneOverlayFlags({ v1: { damage: true }, v2: { range: true } }, ['v1'])).toEqual({
      v1: { damage: true },
    });
  });
});

describe('default variant tabs (86e3kfkc3)', () => {
  it('opens Choice, Modify, Randomize, and Alternate with Variant 1 and Variant 2', () => {
    const tabs = defaultVariantTabs(emptyTabForm(), false);
    expect(tabs.map((tab) => tab.label)).toEqual(['Variant 1', 'Variant 2']);
    expect(tabs.map((tab) => tab.id)).toEqual(['v1', 'v2']);
  });
});

describe('Override on an empty Shared value (86e3kfkbg, 86e3kfkbp)', () => {
  it('stays overridden after copying Shared when Shared still matches the empty tab', () => {
    const shared = emptyTabForm();
    const live = emptyTabForm();
    live.range = shared.range;
    live.duration = shared.duration;
    live.actionType = shared.actionType;
    live.isReaction = shared.isReaction;
    expect(rangeIsOverride(live)).toBe(false);
    expect(durationIsOverride(live)).toBe(false);
    expect(actionIsOverride(live)).toBe(false);

    let flags = {};
    flags = setOverlayField(flags, 'v1', 'range', true);
    flags = setOverlayField(flags, 'v1', 'duration', true);
    flags = setOverlayField(flags, 'v1', 'action', true);
    expect(
      showsFieldOverride(rangeIsOverride(live), isOverlayFieldForced(flags, 'v1', 'range')),
    ).toBe(true);
    expect(
      showsFieldOverride(durationIsOverride(live), isOverlayFieldForced(flags, 'v1', 'duration')),
    ).toBe(true);
    expect(
      showsFieldOverride(actionIsOverride(live), isOverlayFieldForced(flags, 'v1', 'action')),
    ).toBe(true);
    expect(
      showsFieldOverride(rangeIsOverride(live), isOverlayFieldForced(flags, 'v1', 'area')),
    ).toBe(false);
  });
});
