import { describe, expect, it } from 'vitest';
import {
  guidedChoiceCardSelectAriaLabel,
  isGuidedChoiceCardSelectKey,
} from './guided-choice-card';

describe('isGuidedChoiceCardSelectKey', () => {
  const root = {} as EventTarget;

  it('selects on Enter/Space only when the card root is the target', () => {
    expect(isGuidedChoiceCardSelectKey({ key: 'Enter', target: root, currentTarget: root })).toBe(
      true
    );
    expect(isGuidedChoiceCardSelectKey({ key: ' ', target: root, currentTarget: root })).toBe(true);
  });

  it('ignores Enter/Space that originated on a nested control', () => {
    const nested = {} as EventTarget;
    expect(
      isGuidedChoiceCardSelectKey({ key: 'Enter', target: nested, currentTarget: root })
    ).toBe(false);
    expect(isGuidedChoiceCardSelectKey({ key: ' ', target: nested, currentTarget: root })).toBe(
      false
    );
  });

  it('ignores other keys on the card root', () => {
    expect(isGuidedChoiceCardSelectKey({ key: 'Tab', target: root, currentTarget: root })).toBe(
      false
    );
  });
});

describe('guidedChoiceCardSelectAriaLabel', () => {
  it('announces selection in the label instead of aria-selected', () => {
    expect(guidedChoiceCardSelectAriaLabel('Berserker', false)).toBe('Choose Berserker');
    expect(guidedChoiceCardSelectAriaLabel('Berserker', true)).toBe('Choose Berserker, selected');
  });

  it('keeps a custom selectAriaLabel and suffixes selected', () => {
    expect(guidedChoiceCardSelectAriaLabel('Berserker', true, 'Pick Berserker path')).toBe(
      'Pick Berserker path, selected'
    );
  });
});
