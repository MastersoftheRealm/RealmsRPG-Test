import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('./value-stepper.tsx', import.meta.url), 'utf8');

describe('ValueStepper keyboard (86e3jw5dw)', () => {
  it('activates hold-repeat stepper buttons from Enter and Space', () => {
    expect(source).toContain('onKeyDown={enableHoldRepeat ? activateFromKeyboard : undefined}');
    expect(source).toContain("if (event.key !== 'Enter' && event.key !== ' ') return;");
    expect(source).toContain('event.preventDefault();');
    expect(source).toContain('onActivate();');
  });

  it('ends hold-repeat when the pointer releases outside the button (86e3jw5p7)', () => {
    expect(source).toContain("addEventListener('pointerup', onGlobalPointerEnd, true)");
    expect(source).toContain("removeEventListener('pointerup', onGlobalPointerEnd, true)");
  });
});
