import { describe, expect, it } from 'vitest';
import { GUIDED_CHOICE_CARD_PRESETS } from './guided-choice-styles';

describe('GUIDED_CHOICE_CARD_PRESETS — path density (86e3k71a2)', () => {
  it('does not line-clamp path card bodies (WCAG 1.4.12 text spacing)', () => {
    expect(GUIDED_CHOICE_CARD_PRESETS.path.bodyClamp).toBe('');
    expect(GUIDED_CHOICE_CARD_PRESETS.path.bodyClamp).not.toMatch(/line-clamp/);
  });
});
