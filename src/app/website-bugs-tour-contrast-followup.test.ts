import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const globalsCss = readFileSync(new URL('./globals.css', import.meta.url), 'utf8');
const tourHighlight = readFileSync(
  new URL('../lib/sheet-tour-highlight.ts', import.meta.url),
  'utf8',
);

describe('website bugs tour/contrast follow-up (86e3jwkep, 86e3jwkem)', () => {
  it('detects tall sheet tour targets and reschedules scroll (86e3jwkep)', () => {
    expect(tourHighlight).toContain('isTallSheetTourTarget');
    expect(tourHighlight).toContain('scheduleSheetTourRescroll');
  });

  it('places dark sheet RollButton overrides in utilities layer (86e3jwkem)', () => {
    const utilitiesIdx = globalsCss.lastIndexOf('@layer utilities');
    expect(utilitiesIdx).toBeGreaterThan(-1);
    const rollSuccessIdx = globalsCss.indexOf(
      'button[data-roll-trigger].bg-success-600',
      utilitiesIdx,
    );
    expect(rollSuccessIdx).toBeGreaterThan(utilitiesIdx);
    expect(rollSuccessIdx).toBeGreaterThan(utilitiesIdx);
    expect(globalsCss.slice(rollSuccessIdx, rollSuccessIdx + 120)).toContain('success-dark');
  });
});
