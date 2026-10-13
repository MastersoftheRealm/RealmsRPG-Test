import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { isCreatorRoutePath } from '@/components/rolls/roll-log';

const globalsCss = readFileSync(path.join(import.meta.dirname, '../../app/globals.css'), 'utf8');
const creatorLayout = readFileSync(path.join(import.meta.dirname, 'CreatorLayout.tsx'), 'utf8');
const rollLog = readFileSync(path.join(import.meta.dirname, '../rolls/roll-log.tsx'), 'utf8');

describe('Creator coarse touch targets (86e3jx9gm)', () => {
  it('marks creator layout pages for scoped stepper hit expansion', () => {
    expect(creatorLayout).toContain('data-creator-page');
  });

  it('expands creator ± steppers and roll-dock dice picks to 44px on coarse pointer only', () => {
    expect(globalsCss).toContain('[data-creator-page] .btn-stepper.hit-area-dense::after');
    expect(globalsCss).toContain('[data-creator-roll-dock] .btn-stepper.hit-area-dense::after');
    expect(globalsCss).toContain('[data-creator-roll-dock] [data-creator-dice-pick]');
    expect(globalsCss).toMatch(
      /@media \(pointer: coarse\)[\s\S]*\[data-creator-roll-dock\] \[data-creator-dice-pick\]/,
    );
  });

  it('tags roll log dock and dice picks on standalone creator routes', () => {
    expect(rollLog).toContain('data-creator-roll-dock');
    expect(rollLog).toContain('data-creator-dice-pick');
    expect(rollLog).toContain('isCreatorRoutePath');
  });
});

describe('isCreatorRoutePath (86e3jx9gm)', () => {
  it('matches standalone creator URLs', () => {
    expect(isCreatorRoutePath('/power-creator')).toBe(true);
    expect(isCreatorRoutePath('/creature-creator/edit/abc')).toBe(true);
    expect(isCreatorRoutePath('/empowered-technique-creator')).toBe(true);
  });

  it('does not match character sheet or campaign routes', () => {
    expect(isCreatorRoutePath('/characters/abc')).toBe(false);
    expect(isCreatorRoutePath('/campaigns/1')).toBe(false);
    expect(isCreatorRoutePath('/codex')).toBe(false);
  });
});
