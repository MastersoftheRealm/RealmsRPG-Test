import { describe, expect, it } from 'vitest';
import { floatingHelpPanelPointerClass } from './floating-help';

describe('help tooltip click-through', () => {
  it('lets clicks pass through non-interactive help panels', () => {
    expect(floatingHelpPanelPointerClass(false)).toBe('pointer-events-none');
    expect(floatingHelpPanelPointerClass(true)).toBe('pointer-events-auto');
  });
});
