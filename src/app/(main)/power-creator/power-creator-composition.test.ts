import { describe, expect, it } from 'vitest';
import { actionIsOverride, durationIsOverride, rangeIsOverride } from './power-creator-from-shared';
import {
  buildCompositionPayload,
  defaultVariantTabs,
  emptyTabForm,
  isOverlayFieldForced,
  setOverlayField,
  showsFieldOverride,
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
